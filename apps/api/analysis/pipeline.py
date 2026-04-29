from __future__ import annotations

from apps.api.analysis.color import compute_axes, extract_region_colors, gray_world_white_balance, read_image_bytes
from apps.api.analysis.palette import generate_dynamic_palette
from apps.api.analysis.season import match_season
from apps.api.schemas import AnalysisResponse, Axes, BaseTone, DynamicPalette


def analyze_portrait(image_bytes: bytes) -> AnalysisResponse:
    image = read_image_bytes(image_bytes)
    balanced = gray_world_white_balance(image)
    region_colors, analysis_method, region_warnings = extract_region_colors(balanced)
    axes = compute_axes(region_colors)
    season, confidence = match_season(axes)
    recommended_palette = generate_dynamic_palette(region_colors, season)

    warnings: list[str] = [*region_warnings]
    if confidence < 0.62:
        warnings.append("照片光线或背景可能影响判断，建议上传自然光正脸照。")

    return AnalysisResponse(
        season=season["id"],
        confidence=confidence,
        axes=Axes(**axes),
        base_palette=[
            BaseTone(key=color.key, label=color.label, hex=color.hex)
            for color in region_colors
        ],
        recommended_palette=DynamicPalette(**recommended_palette),
        analysis_method=analysis_method,
        warnings=warnings,
    )
