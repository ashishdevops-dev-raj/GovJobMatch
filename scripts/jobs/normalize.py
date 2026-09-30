"""Normalize collected notice rows into NormalizedJob records."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Mapping

from .models import NormalizedJob, fingerprint_for

_WHITESPACE = re.compile(r"\s+")
_NON_SLUG = re.compile(r"[^a-z0-9]+")
_DATE_FORMATS = (
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%d.%m.%Y",
    "%d-%m-%y",
    "%d/%m/%y",
    "%d %b %Y",
    "%d %B %Y",
    "%d-%b-%Y",
    "%d-%B-%Y",
    "%d %b, %Y",
    "%d %B, %Y",
    "%b %d, %Y",
    "%B %d, %Y",
    "%b %d %Y",
    "%B %d %Y",
)


def clean_whitespace(value: Any) -> str:
    if value is None:
        return ""
    return _WHITESPACE.sub(" ", str(value)).strip()


def slugify(value: str, *, fallback: str = "job") -> str:
    text = clean_whitespace(value).lower()
    text = _NON_SLUG.sub("-", text).strip("-")
    return (text[:80] or fallback).strip("-")


def coerce_iso_date(value: Any) -> str | None:
    text = clean_whitespace(value)
    if not text:
        return None
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = [clean_whitespace(part) for part in re.split(r"[,;/|]", value)]
        return [part for part in parts if part]
    if isinstance(value, (list, tuple, set)):
        out: list[str] = []
        for item in value:
            text = clean_whitespace(item)
            if text:
                out.append(text)
        return out
    text = clean_whitespace(value)
    return [text] if text else []


def _as_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    text = clean_whitespace(value).replace(",", "")
    if not re.fullmatch(r"-?\d+", text):
        return None
    try:
        return int(text)
    except ValueError:
        return None


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return dict(value)
    return {}


def normalize_job(row: Mapping[str, Any] | NormalizedJob) -> NormalizedJob:
    """Clean whitespace, coerce dates, slugify titles, apply collector defaults."""
    if isinstance(row, NormalizedJob):
        data = row.to_dict()
    else:
        data = dict(row)

    title = clean_whitespace(data.get("title"))
    organization = clean_whitespace(data.get("organization"))
    end_date = coerce_iso_date(data.get("application_end_date"))
    start_date = coerce_iso_date(data.get("application_start_date"))
    fingerprint = clean_whitespace(data.get("fingerprint")) or fingerprint_for(
        organization, title, end_date
    )
    slug = clean_whitespace(data.get("slug")) or f"{slugify(title)}-{fingerprint[:8]}"
    description = clean_whitespace(data.get("description"))
    if not description:
        description = (
            "Collected from an official public page. Structured eligibility, vacancy "
            "counts, and dates were only stored when they appeared in the HTML. "
            "Always verify the official notification before applying."
        )

    salary = clean_whitespace(data.get("salary") or data.get("salary_text"))

    return NormalizedJob(
        title=title,
        organization=organization,
        qualification=clean_whitespace(data.get("qualification")),
        branches=_as_list(data.get("branches")),
        minimum_age=_as_int(data.get("minimum_age")),
        maximum_age=_as_int(data.get("maximum_age")),
        age_relaxation=_as_dict(data.get("age_relaxation")),
        experience=clean_whitespace(data.get("experience")),
        states=_as_list(data.get("states")),
        vacancies=_as_int(data.get("vacancies")),
        salary=salary,
        application_start_date=start_date,
        application_end_date=end_date,
        selection_process=_as_list(data.get("selection_process")),
        official_notification_url=clean_whitespace(data.get("official_notification_url")) or None,
        official_apply_url=clean_whitespace(data.get("official_apply_url")) or None,
        source_url=clean_whitespace(data.get("source_url")) or None,
        category=clean_whitespace(data.get("category")) or None,
        job_type=clean_whitespace(data.get("job_type")) or None,
        fingerprint=fingerprint,
        is_sample=False,
        status="pending",
        is_verified=False,
        slug=slug,
        description=description,
        locations=_as_list(data.get("locations")),
        exam_family=clean_whitespace(data.get("exam_family")) or None,
    )
