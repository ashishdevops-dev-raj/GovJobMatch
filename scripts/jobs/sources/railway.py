"""Railway recruitment sources.

Primary: Railway Recruitment Boards — https://www.rrbcdg.gov.in
Fallback listing: Indian Railways — https://indianrailways.gov.in

Both adapters share the JobSource interface. If HTML cannot be parsed
reliably, they return an empty job list and emit a SourceCheck.
"""

from __future__ import annotations

from typing import Any

from .base import JobSource


class RrbSource(JobSource):
    name = "RRB Centralised Recruitment"
    organization = "Railway Recruitment Boards"
    organization_slug = "rrb"
    official_url = "https://www.rrbcdg.gov.in"
    source_url = "https://www.rrbcdg.gov.in"
    source_type = "official_website"
    category = "railway"
    exam_family = "Railway"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []


class IndianRailwaysSource(JobSource):
    name = "Indian Railways"
    organization = "Railway Recruitment Boards"
    organization_slug = "rrb"
    official_url = "https://indianrailways.gov.in"
    source_url = "https://indianrailways.gov.in"
    source_type = "official_website"
    category = "railway"
    exam_family = "Railway"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []
