"""Shared JobSource adapter interface and conservative HTML notice extraction.

Adapters never invent vacancy counts or eligibility criteria. If a page is
JavaScript-heavy or notices cannot be identified with high confidence, parse()
returns an empty list and collect() records a SourceCheck for manual review.
"""

from __future__ import annotations

import logging
import re
from abc import ABC, abstractmethod
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup, Tag

from ..http import FetchResult, absolute_url, polite_get, same_host
from ..models import (
    MANUAL_REVIEW_NOTE,
    SOURCE_DISABLED,
    SOURCE_ERROR,
    SOURCE_FETCH_FAILED,
    SOURCE_MANUAL_REVIEW,
    SOURCE_OK,
    SOURCE_ROBOTS_DISALLOWED,
    NormalizedJob,
    SourceCheck,
    utc_now_iso,
)
from ..normalize import clean_whitespace, normalize_job

logger = logging.getLogger("govjobmatch.jobs.sources")

NOTICE_HINTS = (
    "notification",
    "advertisement",
    "detailed advertisement",
    "advt",
    "vacancy",
    "vacancies",
    "recruitment notice",
    "apply online",
    "online application",
    "examination",
)
REJECT_HINTS = (
    "result",
    "results",
    "archive",
    "admit card",
    "answer key",
    "syllabus",
    "cut off",
    "cutoff",
    "answerkey",
)
YEAR_RE = re.compile(r"20\d{2}")
NAV_STOPWORDS = {
    "home",
    "about",
    "about us",
    "contact",
    "contact us",
    "login",
    "register",
    "sitemap",
    "feedback",
    "hindi",
    "english",
    "skip to main content",
    "skip to content",
    "facebook",
    "twitter",
    "youtube",
    "instagram",
    "linkedin",
    "disclaimer",
    "privacy policy",
    "terms",
    "rti",
    "faq",
    "help",
    "search",
    "screen reader",
}
MAX_CONFIDENT_NOTICES = 40
MIN_TITLE_LEN = 12
SCRIPT_HEAVY_TEXT_CHARS = 400


def html_looks_js_heavy(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    raw = BeautifulSoup(html, "html.parser")
    script_count = len(raw.find_all("script"))
    return len(text) < SCRIPT_HEAVY_TEXT_CHARS and script_count >= 5


def _looks_like_notice(title: str, href: str) -> bool:
    lowered = title.lower()
    if lowered in NAV_STOPWORDS:
        return False
    if len(title) < MIN_TITLE_LEN:
        return False
    if any(token in lowered for token in REJECT_HINTS):
        return False
    if href.startswith(("#", "javascript:", "mailto:", "tel:")):
        return False
    path = urlparse(href).path.lower()
    is_pdf = path.endswith(".pdf")
    has_year = bool(YEAR_RE.search(title) or YEAR_RE.search(path))
    strong = any(token in lowered or token in path for token in NOTICE_HINTS)
    # Generic "Careers" / "Recruitment Results" nav links are not job records.
    return is_pdf or (strong and has_year) or (
        "notification" in lowered
        or "advertisement" in lowered
        or "vacancy" in lowered
        or "vacancies" in lowered
    )


def extract_public_notices(
    html: str,
    base_url: str,
    *,
    organization: str,
    category: str | None,
    job_type: str | None = None,
    exam_family: str | None = None,
) -> list[dict[str, Any]]:
    """Best-effort extraction of public notice links from simple HTML.

    Returns an empty list when the markup is too dynamic or too noisy to
    treat as a reliable notice listing.
    """
    if not html or html_looks_js_heavy(html):
        return []

    soup = BeautifulSoup(html, "html.parser")
    items: list[dict[str, Any]] = []
    seen: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        if not isinstance(anchor, Tag):
            continue
        title = clean_whitespace(anchor.get_text(" ", strip=True))
        href_value = anchor.get("href")
        if isinstance(href_value, list):
            href_value = href_value[0] if href_value else ""
        href = clean_whitespace(href_value)
        if not title or not href:
            continue
        url = absolute_url(base_url, href)
        if not url.startswith("http"):
            continue
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            continue
        if not same_host(base_url, url) and not parsed.path.lower().endswith(".pdf"):
            continue
        if not _looks_like_notice(title, url):
            continue
        if url in seen:
            continue
        seen.add(url)
        items.append(
            {
                "title": title,
                "organization": organization,
                "official_notification_url": url,
                "official_apply_url": None,
                "source_url": base_url,
                "category": category,
                "job_type": job_type,
                "exam_family": exam_family,
            }
        )

    if len(items) > MAX_CONFIDENT_NOTICES:
        logger.info("Discarding %s noisy notice candidates from %s", len(items), base_url)
        return []
    return items


class JobSource(ABC):
    name: str
    organization: str
    official_url: str
    source_url: str
    source_type: str = "official_website"
    organization_slug: str = ""
    enabled: bool = True
    category: str | None = None
    job_type: str | None = None
    exam_family: str | None = None
    alternate_urls: list[str] = []

    def __init__(self) -> None:
        self.last_check: SourceCheck | None = None
        self.pages_fetched = 0
        self.rows_parsed = 0
        self.fetched_url: str | None = None
        self._fetch_skip_reason: str | None = None

    def fetch(self) -> str | None:
        """Download listing HTML. Returns None when skipped or failed."""
        self._fetch_skip_reason = None
        urls = [self.source_url, *list(self.alternate_urls or [])]
        last_result: FetchResult | None = None
        for url in urls:
            try:
                result = polite_get(url)
            except Exception as exc:  # noqa: BLE001
                logger.warning("%s fetch error for %s: %s", self.name, url, type(exc).__name__)
                last_result = FetchResult(
                    url=url, ok=False, text=None, skip_reason=type(exc).__name__, attempted=True
                )
                continue
            last_result = result
            if result.ok and result.text:
                self.pages_fetched += 1
                self.fetched_url = result.final_url or url
                return result.text
            self._fetch_skip_reason = result.skip_reason
            if result.skip_reason and result.skip_reason.startswith("robots.txt"):
                self._record_check(
                    SOURCE_ROBOTS_DISALLOWED,
                    result.skip_reason,
                    jobs_found=0,
                    skip_reason=result.skip_reason,
                )
                return None
        reason = (last_result.skip_reason if last_result else "fetch failed") or "fetch failed"
        self._record_check(SOURCE_FETCH_FAILED, reason, jobs_found=0, skip_reason=reason)
        return None

    @abstractmethod
    def parse(self, raw: str) -> list[dict[str, Any]]:
        """Return raw notice dicts. Never invent vacancy or eligibility fields."""

    def collect(self) -> list[NormalizedJob]:
        if not self.enabled:
            self._record_check(SOURCE_DISABLED, "Source is disabled.", jobs_found=0)
            return []
        try:
            raw = self.fetch()
            if raw is None:
                if self.last_check is None:
                    self._record_check(
                        SOURCE_FETCH_FAILED,
                        self._fetch_skip_reason or "No HTML returned.",
                        jobs_found=0,
                        skip_reason=self._fetch_skip_reason,
                    )
                return []
            try:
                rows = self.parse(raw) or []
            except Exception:
                logger.exception("%s parse failed", self.name)
                self._record_check(
                    SOURCE_ERROR,
                    f"Parser raised an exception for {self.source_url}. {MANUAL_REVIEW_NOTE}",
                    jobs_found=0,
                )
                return []
            self.rows_parsed = len(rows)
            jobs: list[NormalizedJob] = []
            for row in rows:
                try:
                    payload = dict(row)
                    payload.setdefault("organization", self.organization)
                    payload.setdefault("source_url", self.fetched_url or self.source_url)
                    payload.setdefault("category", self.category)
                    payload.setdefault("job_type", self.job_type)
                    payload.setdefault("exam_family", self.exam_family)
                    job = normalize_job(payload)
                    if not job.title:
                        continue
                    jobs.append(job)
                except Exception:
                    logger.exception("%s skipped a notice row", self.name)
            if not jobs:
                self._record_check(
                    SOURCE_MANUAL_REVIEW,
                    MANUAL_REVIEW_NOTE,
                    jobs_found=0,
                )
                return []
            self._record_check(
                SOURCE_OK,
                f"Parsed {len(jobs)} public notice(s) from simple HTML. "
                "Eligibility fields were stored only when present in the page.",
                jobs_found=len(jobs),
            )
            return jobs
        except Exception as exc:  # noqa: BLE001
            logger.exception("%s collect failed", self.name)
            self._record_check(
                SOURCE_ERROR,
                f"{type(exc).__name__}: collector aborted. {MANUAL_REVIEW_NOTE}",
                jobs_found=0,
            )
            return []

    def _record_check(
        self,
        status: str,
        note: str,
        *,
        jobs_found: int,
        skip_reason: str | None = None,
    ) -> None:
        self.last_check = SourceCheck(
            source_name=self.name,
            organization=self.organization,
            official_url=self.official_url,
            source_url=self.fetched_url or self.source_url,
            status=status,
            last_checked=utc_now_iso(),
            note=note,
            jobs_found=jobs_found,
            skip_reason=skip_reason,
        )

    def parse_simple_notices(self, raw: str) -> list[dict[str, Any]]:
        return extract_public_notices(
            raw,
            self.fetched_url or self.source_url,
            organization=self.organization,
            category=self.category,
            job_type=self.job_type,
            exam_family=self.exam_family,
        )
