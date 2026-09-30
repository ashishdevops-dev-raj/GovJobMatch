"""Banking recruitment sources.

IBPS — https://www.ibps.in
SBI careers — https://sbi.co.in/web/careers

Adapters never invent vacancy numbers or eligibility criteria. Unparseable
pages produce an empty job list plus a SourceCheck for manual verification.
"""

from __future__ import annotations

from typing import Any

from .base import JobSource


class IbpsSource(JobSource):
    name = "IBPS Careers"
    organization = "Institute of Banking Personnel Selection"
    organization_slug = "ibps"
    official_url = "https://www.ibps.in"
    source_url = "https://www.ibps.in"
    source_type = "official_website"
    category = "banking"
    exam_family = "Banking"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []


class SbiSource(JobSource):
    name = "SBI Careers"
    organization = "State Bank of India"
    organization_slug = "sbi"
    official_url = "https://sbi.co.in/web/careers"
    source_url = "https://sbi.co.in/web/careers"
    source_type = "official_website"
    category = "banking"
    exam_family = "Banking"
    enabled = True

    def parse(self, raw: str) -> list[dict[str, Any]]:
        try:
            return self.parse_simple_notices(raw)
        except Exception:
            return []
