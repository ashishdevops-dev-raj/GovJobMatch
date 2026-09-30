"""Python job collector for GovJobMatch.

Public recruitment notices only. Collectors never invent vacancies or
eligibility criteria. When a site cannot be parsed reliably, adapters
return an empty job list and record a SourceCheck for manual review.
"""

from .models import NormalizedJob, SourceCheck, fingerprint_for

__all__ = ["NormalizedJob", "SourceCheck", "fingerprint_for"]
