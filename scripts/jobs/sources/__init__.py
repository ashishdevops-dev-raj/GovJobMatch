"""Official recruitment source adapters."""

from __future__ import annotations

from .banking import IbpsSource, SbiSource
from .base import JobSource
from .railway import IndianRailwaysSource, RrbSource
from .ssc import SscSource
from .upsc import UpscSource

SOURCE_GROUPS: dict[str, list[type[JobSource]]] = {
    "ssc": [SscSource],
    "upsc": [UpscSource],
    "railway": [RrbSource, IndianRailwaysSource],
    "banking": [IbpsSource, SbiSource],
}

SOURCE_CHOICES = (*SOURCE_GROUPS.keys(), "all")


def build_sources(name: str) -> list[JobSource]:
    key = (name or "all").strip().lower()
    if key == "all":
        classes: list[type[JobSource]] = []
        for group in SOURCE_GROUPS.values():
            classes.extend(group)
        return [cls() for cls in classes]
    if key not in SOURCE_GROUPS:
        raise ValueError(f"Unknown source '{name}'. Expected one of: {', '.join(SOURCE_CHOICES)}")
    return [cls() for cls in SOURCE_GROUPS[key]]
