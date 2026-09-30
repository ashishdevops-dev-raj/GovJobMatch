"""Normalized job records and source-check metadata."""

from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


SOURCE_OK = "ok"
SOURCE_MANUAL_REVIEW = "manual_review"
SOURCE_FETCH_FAILED = "fetch_failed"
SOURCE_ROBOTS_DISALLOWED = "robots_disallowed"
SOURCE_ERROR = "error"
SOURCE_DISABLED = "disabled"

MANUAL_REVIEW_NOTE = (
    "This official website could not be reliably parsed into structured job "
    "records (JavaScript-rendered markup, inconsistent HTML, or no clearly "
    "identifiable public notices). No vacancies or eligibility criteria were "
    "invented. An administrator must verify current recruitments on the "
    "official source URL and enter them manually."
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def fingerprint_for(
    organization: str,
    title: str,
    application_end_date: str | None,
) -> str:
    """Deterministic SHA-256 fingerprint matching lib/jobs/fingerprint.ts."""
    key = "|".join(
        [
            (organization or "").strip().lower(),
            (title or "").strip().lower(),
            (application_end_date or "").strip(),
        ]
    )
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


@dataclass
class SourceCheck:
    """Outcome of checking an official source. Stored on job_sources."""

    source_name: str
    organization: str
    official_url: str
    source_url: str
    status: str
    last_checked: str
    note: str
    jobs_found: int = 0
    skip_reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class NormalizedJob:
    title: str
    organization: str
    qualification: str = ""
    branches: list[str] = field(default_factory=list)
    minimum_age: int | None = None
    maximum_age: int | None = None
    age_relaxation: dict[str, Any] = field(default_factory=dict)
    experience: str = ""
    states: list[str] = field(default_factory=list)
    vacancies: int | None = None
    salary: str = ""
    application_start_date: str | None = None
    application_end_date: str | None = None
    selection_process: list[str] = field(default_factory=list)
    official_notification_url: str | None = None
    official_apply_url: str | None = None
    source_url: str | None = None
    category: str | None = None
    job_type: str | None = None
    fingerprint: str = ""
    is_sample: bool = False
    status: str = "pending"
    is_verified: bool = False
    slug: str = ""
    description: str = ""
    locations: list[str] = field(default_factory=list)
    exam_family: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "organization": self.organization,
            "qualification": self.qualification,
            "branches": list(self.branches),
            "minimum_age": self.minimum_age,
            "maximum_age": self.maximum_age,
            "age_relaxation": dict(self.age_relaxation),
            "experience": self.experience,
            "states": list(self.states),
            "vacancies": self.vacancies,
            "salary": self.salary,
            "application_start_date": self.application_start_date,
            "application_end_date": self.application_end_date,
            "selection_process": list(self.selection_process),
            "official_notification_url": self.official_notification_url,
            "official_apply_url": self.official_apply_url,
            "source_url": self.source_url,
            "category": self.category,
            "job_type": self.job_type,
            "fingerprint": self.fingerprint,
            "is_sample": self.is_sample,
            "status": self.status,
            "is_verified": self.is_verified,
            "slug": self.slug,
            "description": self.description,
            "locations": list(self.locations),
            "exam_family": self.exam_family,
        }
