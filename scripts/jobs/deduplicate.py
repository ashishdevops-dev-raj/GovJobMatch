"""Deterministic fingerprint-based duplicate detection."""

from __future__ import annotations

from .models import NormalizedJob, fingerprint_for
from .normalize import normalize_job


def ensure_fingerprint(job: NormalizedJob) -> str:
    if job.fingerprint:
        return job.fingerprint
    job.fingerprint = fingerprint_for(
        job.organization, job.title, job.application_end_date
    )
    return job.fingerprint


def deduplicate(
    jobs: list[NormalizedJob],
    existing_fingerprints: set[str] | None = None,
) -> tuple[list[NormalizedJob], int]:
    """Return unique jobs and the number skipped as duplicates.

    A job is skipped when its fingerprint is already in
    ``existing_fingerprints`` or was seen earlier in this batch.
    """
    seen = set(existing_fingerprints or ())
    unique: list[NormalizedJob] = []
    skipped = 0
    for job in jobs:
        normalized = job if job.fingerprint else normalize_job(job)
        fingerprint = ensure_fingerprint(normalized)
        if not fingerprint or fingerprint in seen:
            skipped += 1
            continue
        seen.add(fingerprint)
        unique.append(normalized)
    return unique, skipped
