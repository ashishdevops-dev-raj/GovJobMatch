"""Polite HTTP client for public HTML pages.

Respects robots.txt, identifies as the GovJobMatch research collector,
retries with backoff, and pauses between requests. Never executes JavaScript.
"""

from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import urllib3
from requests import Response
from requests.exceptions import RequestException, SSLError
from urllib3.exceptions import InsecureRequestWarning

logger = logging.getLogger("govjobmatch.jobs.http")

logger = logging.getLogger("govjobmatch.jobs.http")

USER_AGENT = (
    "GovJobMatch/1.0 (+https://github.com; research collector for public "
    "Indian government recruitment notices; HTML-only; polite)"
)
TIMEOUT_SECONDS = 20
MAX_RETRIES = 2
BACKOFF_BASE_SECONDS = 1.5
MIN_PAUSE_SECONDS = 1.5
MAX_PAUSE_SECONDS = 3.0
RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504}
OFFICIAL_HOST_SUFFIXES = (
    ".gov.in",
    ".nic.in",
    "ibps.in",
    "sbi.co.in",
    "sbi.bank.in",
)

_session: requests.Session | None = None
_last_request_at = 0.0
_robots: dict[str, RobotFileParser | None] = {}


@dataclass
class FetchResult:
    url: str
    ok: bool
    text: str | None
    status_code: int | None = None
    final_url: str | None = None
    skip_reason: str | None = None
    attempted: bool = False


def _session_get() -> requests.Session:
    global _session
    if _session is None:
        session = requests.Session()
        session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-IN,en;q=0.9",
            }
        )
        _session = session
    return _session


def _pause(extra: float = 0.0) -> None:
    global _last_request_at
    wait = random.uniform(MIN_PAUSE_SECONDS, MAX_PAUSE_SECONDS) + extra
    elapsed = time.monotonic() - _last_request_at
    remaining = wait - elapsed
    if _last_request_at > 0 and remaining > 0:
        logger.debug("Pausing %.2fs between requests", remaining)
        time.sleep(remaining)
    _last_request_at = time.monotonic()


def _is_official_host(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return any(host == suffix.lstrip(".") or host.endswith(suffix) for suffix in OFFICIAL_HOST_SUFFIXES)


def _get(session: requests.Session, url: str, *, verify: bool) -> Response:
    return session.get(url, timeout=TIMEOUT_SECONDS, allow_redirects=True, verify=verify)


def _robots_url(page_url: str) -> str:
    parts = urlparse(page_url)
    return f"{parts.scheme}://{parts.netloc}/robots.txt"


def _load_robots(page_url: str) -> RobotFileParser | None:
    host = urlparse(page_url).netloc.lower()
    if host in _robots:
        return _robots[host]

    robots_href = _robots_url(page_url)
    parser = RobotFileParser()
    parser.set_url(robots_href)
    try:
        result = _request(robots_href, check_robots=False)
        if not result.ok or result.text is None:
            if result.status_code in {404, 410}:
                parser.parse(["User-agent: *", "Allow: /"])
                _robots[host] = parser
                return parser
            if result.status_code in {401, 403}:
                logger.info(
                    "robots.txt for %s returned %s; treating as disallow",
                    host,
                    result.skip_reason,
                )
                parser.parse(["User-agent: *", "Disallow: /"])
                _robots[host] = parser
                return parser
            logger.warning("Could not read robots.txt for %s (%s)", host, result.skip_reason)
            parser.parse(["User-agent: *", "Disallow: /"])
            _robots[host] = parser
            return parser
        parser.parse(result.text.splitlines())
        _robots[host] = parser
        return parser
    except Exception as exc:  # noqa: BLE001 — never fail the collector on robots parse
        logger.warning("robots.txt parse failed for %s: %s", host, exc)
        _robots[host] = None
        return None


def allowed_by_robots(url: str) -> tuple[bool, str | None]:
    """Return (allowed, skip_reason). Missing robots.txt (404) is treated as allow."""
    parser = _load_robots(url)
    if parser is None:
        return True, None
    try:
        allowed = parser.can_fetch(USER_AGENT, url)
        if not allowed:
            return False, f"robots.txt disallows GET {url}"
        delay = parser.crawl_delay(USER_AGENT)
        if delay is None:
            delay = parser.crawl_delay("*")
        if delay and delay > MAX_PAUSE_SECONDS:
            _pause(extra=float(delay) - MAX_PAUSE_SECONDS)
        return True, None
    except Exception as exc:  # noqa: BLE001
        logger.warning("robots.txt check failed for %s: %s", url, exc)
        return True, None


def _request(url: str, *, check_robots: bool) -> FetchResult:
    if check_robots:
        allowed, reason = allowed_by_robots(url)
        if not allowed:
            logger.info("Skipping (robots.txt): %s", url)
            return FetchResult(url=url, ok=False, text=None, skip_reason=reason, attempted=False)

    session = _session_get()
    last_error = "request failed"
    for attempt in range(MAX_RETRIES + 1):
        _pause()
        try:
            response = _get(session, url, verify=True)
        except SSLError:
            last_error = "SSLError"
            logger.warning("GET %s TLS verification failed", url)
            if _is_official_host(url):
                logger.warning(
                    "Retrying official host %s without TLS verification (last resort)",
                    urlparse(url).netloc,
                )
                _pause()
                try:
                    urllib3.disable_warnings(InsecureRequestWarning)
                    response = _get(session, url, verify=False)
                except RequestException as exc:
                    last_error = type(exc).__name__
                    logger.warning("GET %s insecure retry failed: %s", url, type(exc).__name__)
                    return FetchResult(
                        url=url, ok=False, text=None, skip_reason=last_error, attempted=True
                    )
            else:
                if attempt < MAX_RETRIES:
                    time.sleep(BACKOFF_BASE_SECONDS * (2**attempt))
                    continue
                return FetchResult(
                    url=url, ok=False, text=None, skip_reason=last_error, attempted=True
                )
        except RequestException as exc:
            last_error = f"{type(exc).__name__}"
            logger.warning("GET %s attempt %s failed: %s", url, attempt + 1, type(exc).__name__)
            if attempt < MAX_RETRIES:
                time.sleep(BACKOFF_BASE_SECONDS * (2**attempt))
                continue
            return FetchResult(
                url=url,
                ok=False,
                text=None,
                skip_reason=last_error,
                attempted=True,
            )

        if response.status_code in RETRYABLE_STATUS and attempt < MAX_RETRIES:
            last_error = f"HTTP {response.status_code}"
            logger.warning("GET %s HTTP %s, retrying", url, response.status_code)
            time.sleep(BACKOFF_BASE_SECONDS * (2**attempt))
            continue

        if response.status_code >= 400:
            return FetchResult(
                url=url,
                ok=False,
                text=None,
                status_code=response.status_code,
                final_url=response.url,
                skip_reason=f"HTTP {response.status_code}",
                attempted=True,
            )

        content_type = (response.headers.get("Content-Type") or "").lower()
        if content_type and not any(
            token in content_type
            for token in ("text/html", "application/xhtml", "text/plain", "application/xml", "text/xml")
        ):
            return FetchResult(
                url=url,
                ok=False,
                text=None,
                status_code=response.status_code,
                final_url=response.url,
                skip_reason=f"unsupported content-type {content_type.split(';')[0]}",
                attempted=True,
            )

        return FetchResult(
            url=url,
            ok=True,
            text=response.text,
            status_code=response.status_code,
            final_url=response.url,
            attempted=True,
        )

    return FetchResult(url=url, ok=False, text=None, skip_reason=last_error, attempted=True)


def polite_get(url: str) -> FetchResult:
    """GET a public URL after a robots.txt check. HTML/text only."""
    logger.info("Fetching %s", url)
    return _request(url, check_robots=True)


def absolute_url(base: str, href: str) -> str:
    return urljoin(base, href.strip())


def same_host(url_a: str, url_b: str) -> bool:
    return urlparse(url_a).netloc.lower().lstrip("www.") == urlparse(url_b).netloc.lower().lstrip(
        "www."
    )


def request_headers() -> dict[str, Any]:
    return {"User-Agent": USER_AGENT}
