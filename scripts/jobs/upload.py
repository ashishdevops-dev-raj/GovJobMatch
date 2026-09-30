"""Upload collected jobs to Supabase via PostgREST (urllib, no paid SDK).

Reads SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and
SUPABASE_SERVICE_ROLE_KEY from the environment. Never prints secrets.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .models import NormalizedJob, SourceCheck

logger = logging.getLogger("govjobmatch.jobs.upload")

JOBS_PAGE_SIZE = 1000


class UploadError(RuntimeError):
    pass


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def supabase_url() -> str:
    return _env("SUPABASE_URL") or _env("NEXT_PUBLIC_SUPABASE_URL")


def service_role_key() -> str:
    return _env("SUPABASE_SERVICE_ROLE_KEY")


def credentials_available() -> bool:
    return bool(supabase_url() and service_role_key())


def _rest_base() -> str:
    base = supabase_url().rstrip("/")
    if not base:
        raise UploadError("SUPABASE_URL is not set")
    if base.endswith("/rest/v1"):
        return base
    return f"{base}/rest/v1"


def _headers(*, prefer: str | None = None) -> dict[str, str]:
    key = service_role_key()
    if not key:
        raise UploadError("SUPABASE_SERVICE_ROLE_KEY is not set")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _redact(text: str) -> str:
    key = service_role_key()
    if key and key in text:
        return text.replace(key, "[redacted]")
    return text


def _request(
    method: str,
    path: str,
    *,
    params: dict[str, str] | None = None,
    body: Any = None,
    prefer: str | None = None,
) -> Any:
    url = _rest_base() + path
    if params:
        url += "?" + urllib.parse.urlencode(params, safe=".,()*")
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        headers=_headers(prefer=prefer),
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        logger.error("PostgREST %s %s failed: HTTP %s %s", method, path, exc.code, _redact(detail)[:500])
        raise UploadError(f"PostgREST HTTP {exc.code} on {method} {path}") from None
    except urllib.error.URLError as exc:
        logger.error("PostgREST connection error on %s %s: %s", method, path, type(exc.reason).__name__)
        raise UploadError("PostgREST connection failed") from None


class SupabaseUploader:
    """Insert organizations / job_sources / jobs and record source checks."""

    def fetch_existing_fingerprints(self) -> set[str]:
        fingerprints: set[str] = set()
        offset = 0
        while True:
            params = {
                "select": "fingerprint",
                "fingerprint": "not.is.null",
                "limit": str(JOBS_PAGE_SIZE),
                "offset": str(offset),
            }
            rows = _request("GET", "/jobs", params=params) or []
            if not isinstance(rows, list) or not rows:
                break
            for row in rows:
                value = (row or {}).get("fingerprint")
                if value:
                    fingerprints.add(str(value))
            if len(rows) < JOBS_PAGE_SIZE:
                break
            offset += JOBS_PAGE_SIZE
        logger.info("Loaded %s existing fingerprints", len(fingerprints))
        return fingerprints

    def ensure_organization(self, *, name: str, slug: str, official_website: str | None) -> str:
        rows = _request(
            "GET",
            "/organizations",
            params={"select": "id,slug", "slug": f"eq.{slug}", "limit": "1"},
        ) or []
        if rows:
            return str(rows[0]["id"])
        created = _request(
            "POST",
            "/organizations",
            body={"name": name, "slug": slug, "official_website": official_website},
            prefer="return=representation",
        ) or []
        if not created:
            raise UploadError(f"Failed to create organization {slug}")
        return str(created[0]["id"])

    def ensure_source(
        self,
        *,
        organization_id: str,
        name: str,
        source_url: str,
        source_type: str,
    ) -> str:
        rows = _request(
            "GET",
            "/job_sources",
            params={"select": "id", "source_url": f"eq.{source_url}", "limit": "1"},
        ) or []
        if rows:
            return str(rows[0]["id"])
        payload = {
            "organization_id": organization_id,
            "name": name,
            "source_url": source_url,
            "source_type": source_type,
            "status": "pending",
        }
        created = _request(
            "POST",
            "/job_sources",
            body=payload,
            prefer="return=representation",
        ) or []
        if not created:
            raise UploadError(f"Failed to create job_source {name}")
        return str(created[0]["id"])

    def record_source_check(self, source_id: str, check: SourceCheck) -> None:
        payload: dict[str, Any] = {
            "last_checked_at": check.last_checked,
            "status": check.status,
        }
        try:
            _request(
                "PATCH",
                "/job_sources",
                params={"id": f"eq.{source_id}"},
                body={**payload, "last_error": check.note},
                prefer="return=minimal",
            )
        except UploadError:
            logger.info("Retrying source check without last_error column")
            _request(
                "PATCH",
                "/job_sources",
                params={"id": f"eq.{source_id}"},
                body=payload,
                prefer="return=minimal",
            )

    def upsert_jobs(
        self,
        jobs: list[NormalizedJob],
        *,
        organization_id: str,
        source_id: str,
    ) -> int:
        if not jobs:
            return 0
        body = [self._job_payload(job, organization_id, source_id) for job in jobs]
        try:
            _request(
                "POST",
                "/jobs",
                params={"on_conflict": "fingerprint"},
                body=body,
                prefer="resolution=ignore-duplicates,return=minimal",
            )
        except UploadError:
            stripped = [{k: v for k, v in row.items() if k != "exam_family"} for row in body]
            _request(
                "POST",
                "/jobs",
                params={"on_conflict": "fingerprint"},
                body=stripped,
                prefer="resolution=ignore-duplicates,return=minimal",
            )
        return len(jobs)

    def _job_payload(self, job: NormalizedJob, organization_id: str, source_id: str) -> dict[str, Any]:
        return {
            "organization_id": organization_id,
            "source_id": source_id,
            "title": job.title,
            "slug": job.slug,
            "description": job.description,
            "qualification": job.qualification,
            "branches": job.branches,
            "minimum_age": job.minimum_age,
            "maximum_age": job.maximum_age,
            "age_relaxation": job.age_relaxation or {},
            "experience": job.experience,
            "states": job.states,
            "locations": job.locations,
            "vacancies": job.vacancies,
            "salary_text": job.salary or None,
            "job_type": job.job_type,
            "category": job.category,
            "application_start_date": job.application_start_date,
            "application_end_date": job.application_end_date,
            "selection_process": job.selection_process,
            "official_notification_url": job.official_notification_url,
            "official_apply_url": job.official_apply_url,
            "source_url": job.source_url,
            "status": job.status or "pending",
            "is_verified": False,
            "is_sample": False,
            "fingerprint": job.fingerprint,
            "exam_family": job.exam_family,
            "qualification_codes": [],
            "required_conditions": [],
            "organization_name": job.organization,
        }


def load_existing_fingerprints() -> set[str]:
    if not credentials_available():
        logger.info("Supabase credentials not set; skipping fingerprint load")
        return set()
    return SupabaseUploader().fetch_existing_fingerprints()
