"""Union Public Service Commission — https://upsc.gov.in

Attempts to parse public notices from simple HTML. Otherwise catalogs the
official URL only via SourceCheck; never invents vacancies or criteria.
"""

from __future__ import annotations

from typing import Any

from .base import JobSource


class UpscSource(JobSource):
    name = "UPSC Official Website"
    organization = "Union Public Service Commission"
    organization_slug = "upsc"
    official_url = "https://upsc.gov.in"
    source_url = "https://upsc.gov.in"
    source_type = "official_website"
    category = "upsc"
    exam_family = "UPSC"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []
