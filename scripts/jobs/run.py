"""GovJobMatch job collector entry point.

Usage:
    python -m scripts.jobs.run --source all --dry-run
    python -m scripts.jobs.run --source ssc --json-out tmp/ssc.json
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from .deduplicate import deduplicate
from .models import NormalizedJob, SourceCheck
from .normalize import normalize_job, slugify
from .sources import SOURCE_CHOICES, JobSource, build_sources
from .upload import SupabaseUploader, credentials_available, load_existing_fingerprints

logger = logging.getLogger("govjobmatch.jobs")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect public Indian government recruitment notices. "
        "Does not invent vacancies or eligibility criteria."
    )
    parser.add_argument(
        "--source",
        choices=SOURCE_CHOICES,
        default="all",
        help="Which official source group to collect (default: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Collect, normalize, and deduplicate without writing to Supabase",
    )
    parser.add_argument(
        "--json-out",
        default=None,
        help="Optional path to write jobs and source checks as JSON",
    )
    return parser.parse_args(argv)


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )


def collect_from(sources: list[JobSource]) -> tuple[list[NormalizedJob], list[SourceCheck], int, int]:
    jobs: list[NormalizedJob] = []
    checks: list[SourceCheck] = []
    fetched = 0
    parsed = 0
    for source in sources:
        logger.info("Collecting %s (%s)", source.name, source.source_url)
        try:
            collected = source.collect()
        except Exception:
            logger.exception("Collector crashed for %s", source.name)
            collected = []
        fetched += source.pages_fetched
        parsed += source.rows_parsed
        jobs.extend(collected)
        if source.last_check:
            checks.append(source.last_check)
            logger.info(
                "Source check %s status=%s jobs=%s",
                source.name,
                source.last_check.status,
                source.last_check.jobs_found,
            )
    return jobs, checks, fetched, parsed


def upload_results(
    unique_jobs: list[NormalizedJob],
    sources: list[JobSource],
    *,
    dry_run: bool,
) -> int:
    if dry_run:
        logger.info("Dry-run: skipping Supabase upload of %s jobs", len(unique_jobs))
        return 0
    if not credentials_available():
        logger.warning("Supabase credentials missing; skipping upload")
        return 0

    uploader = SupabaseUploader()
    uploaded = 0
    jobs_by_source: dict[str, list[NormalizedJob]] = {source.name: [] for source in sources}
    unmatched: list[NormalizedJob] = []
    source_by_org = {source.organization: source for source in sources}
    for job in unique_jobs:
        owner = next((src for src in sources if src.organization == job.organization), None)
        if owner is None:
            owner = source_by_org.get(job.organization)
        if owner is None:
            unmatched.append(job)
            continue
        jobs_by_source.setdefault(owner.name, []).append(job)

    for source in sources:
        check = source.last_check
        try:
            org_id = uploader.ensure_organization(
                name=source.organization,
                slug=source.organization_slug or slugify(source.organization),
                official_website=source.official_url,
            )
            source_id = uploader.ensure_source(
                organization_id=org_id,
                name=source.name,
                source_url=source.source_url,
                source_type=source.source_type,
            )
            if check is not None:
                uploader.record_source_check(source_id, check)
            batch = jobs_by_source.get(source.name) or []
            if batch:
                uploaded += uploader.upsert_jobs(batch, organization_id=org_id, source_id=source_id)
        except Exception:
            logger.exception("Upload failed for source %s", source.name)

    if unmatched:
        logger.warning("Skipped %s jobs with unknown organization", len(unmatched))
    return uploaded


def run(argv: list[str] | None = None) -> int:
    load_dotenv()
    _configure_logging()
    args = parse_args(argv)

    sources = build_sources(args.source)
    collected, checks, fetched, parsed = collect_from(sources)
    normalized = [normalize_job(job) for job in collected]

    existing: set[str] = set()
    if credentials_available():
        try:
            existing = load_existing_fingerprints()
        except Exception:
            logger.exception("Could not load existing fingerprints; continuing with in-batch dedupe only")

    unique, skipped = deduplicate(normalized, existing)
    uploaded = upload_results(unique, sources, dry_run=args.dry_run)

    counts = {
        "fetched": fetched,
        "parsed": parsed,
        "unique": len(unique),
        "uploaded": uploaded,
        "skipped": skipped,
    }
    print(
        "fetched={fetched} parsed={parsed} unique={unique} uploaded={uploaded} skipped={skipped}".format(
            **counts
        )
    )
    for check in checks:
        print(
            f"source={check.source_name} status={check.status} jobs_found={check.jobs_found}"
        )

    if args.json_out:
        payload: dict[str, Any] = {
            "counts": counts,
            "source_checks": [check.to_dict() for check in checks],
            "jobs": [job.to_dict() for job in unique],
        }
        out_path = Path(args.json_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        logger.info("Wrote JSON output to %s", out_path)

    return 0


def main() -> int:
    try:
        return run()
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
