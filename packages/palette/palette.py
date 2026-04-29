from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

PALETTE_PATH = Path(__file__).with_name("seasons.json")


@lru_cache(maxsize=1)
def load_palette() -> dict[str, Any]:
    with PALETTE_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def list_seasons() -> list[dict[str, Any]]:
    return load_palette()["seasons"]


def get_season(season_id: str | None = None) -> dict[str, Any]:
    data = load_palette()
    target = season_id or data.get("defaultSeasonId")
    for season in data["seasons"]:
        if season["id"] == target:
            return season
    return data["seasons"][0]
