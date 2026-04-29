from __future__ import annotations

import math
from typing import Any

from packages.palette import get_season, list_seasons

WEIGHTS = {
    "warmth": 1.3,
    "lightness": 1.0,
    "chroma": 1.2,
    "contrast": 1.0,
}


def axis_distance(a: dict[str, float], b: dict[str, float]) -> float:
    total = 0.0
    for key, weight in WEIGHTS.items():
        total += ((a[key] - b[key]) ** 2) * weight
    return math.sqrt(total)


def match_season(axes: dict[str, float]) -> tuple[dict[str, Any], float]:
    if axes["warmth"] >= 0.55 and (axes["chroma"] <= 0.38 or (axes["chroma"] <= 0.6 and axes["contrast"] <= 0.56)):
        soft_autumn = get_season("soft_autumn")
        distance = axis_distance(axes, soft_autumn["axes"])
        confidence = max(0.72, min(0.96, 1 - distance / 1.9))
        return soft_autumn, round(confidence, 3)

    candidates = sorted(
        ((season, axis_distance(axes, season["axes"])) for season in list_seasons()),
        key=lambda item: item[1],
    )
    best, distance = candidates[0]
    confidence = max(0.35, min(0.98, 1 - distance / 1.65))
    return best, round(confidence, 3)


def fallback_soft_autumn() -> tuple[dict[str, Any], float]:
    return get_season("soft_autumn"), 0.82
