from apps.api.analysis.season import match_season


def test_soft_autumn_axes_match_soft_autumn() -> None:
    season, confidence = match_season({"warmth": 0.66, "lightness": 0.48, "chroma": 0.32, "contrast": 0.34})
    assert season["id"] == "soft_autumn"
    assert confidence >= 0.8
