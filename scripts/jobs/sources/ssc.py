"""Staff Selection Commission — https://ssc.gov.in

Attempts to parse public notices from simple HTML. If the site is
JavaScript-rendered or notices cannot be identified confidently, no job
records are emitted and a SourceCheck is stored for admin review.
"""

from __future__ import annotations

from typing import Any

from .base import JobSource


class SscSource(JobSource):
    name = "SSC Official Website"
    organization = "Staff Selection Commission"
    organization_slug = "ssc"
    official_url = "https://ssc.gov.in"
    source_url = "https://ssc.gov.in"
    source_type = "official_website"
    category = "ssc"
    exam_family = "SSC"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []
