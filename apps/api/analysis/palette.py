from __future__ import annotations

import colorsys
from typing import Any

from apps.api.analysis.color import RegionColor


def _rgb_to_hls(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    red, green, blue = (channel / 255 for channel in rgb)
    return colorsys.rgb_to_hls(red, green, blue)


def _hls_to_hex(hue: float, lightness: float, saturation: float) -> str:
    red, green, blue = colorsys.hls_to_rgb(hue % 1, _clamp(lightness), _clamp(saturation))
    return "#" + "".join(f"{round(channel * 255):02X}" for channel in (red, green, blue))


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _unique(colors: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for color in colors:
        if color not in seen:
            output.append(color)
            seen.add(color)
    return output


def _blend(rgb_a: tuple[int, int, int], rgb_b: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    ratio = _clamp(ratio)
    return tuple(round(a * (1 - ratio) + b * ratio) for a, b in zip(rgb_a, rgb_b, strict=True))


def _hex_from_rgb(rgb: tuple[int, int, int]) -> str:
    return "#" + "".join(f"{channel:02X}" for channel in rgb)


def generate_dynamic_palette(region_colors: list[RegionColor], season: dict[str, Any]) -> dict[str, list[str]]:
    """Generate user-specific report colors from extracted portrait colors.

    The fixed season table remains a color-theory constraint, while this function
    shifts hue, lightness and chroma from the person's measured skin/lip/hair
    tones so each report is not a static template.
    """

    by_key = {color.key: color for color in region_colors}
    cheek = by_key.get("cheek") or region_colors[0]
    midface = by_key.get("midface") or cheek
    lip = by_key.get("lip") or cheek
    hair = by_key.get("hair") or region_colors[-2]

    cheek_h, cheek_l, cheek_s = _rgb_to_hls(cheek.rgb)
    lip_h, _lip_l, lip_s = _rgb_to_hls(lip.rgb)
    hair_h, hair_l, hair_s = _rgb_to_hls(hair.rgb)

    axes = season.get("axes", {})
    warmth = float(axes.get("warmth", 0.5))
    chroma = float(axes.get("chroma", 0.45))
    contrast = float(axes.get("contrast", 0.4))

    base_hue = (cheek_h * 0.55 + lip_h * 0.3 + hair_h * 0.15) % 1
    target_s = _clamp((cheek_s * 0.35 + lip_s * 0.25 + chroma * 0.4), 0.16, 0.7)
    muted_s = target_s * (0.72 if chroma < 0.45 else 0.92)
    base_l = _clamp(cheek_l * 0.66 + 0.18, 0.34, 0.82)

    if warmth >= 0.5:
        recommended_shifts = [-0.06, 0.0, 0.04, 0.08, 0.13, 0.20, 0.27, 0.34, -0.12, -0.18]
        accent_shifts = [-0.10, 0.03, 0.10, 0.18, 0.28, -0.22]
        avoid_shifts = [0.48, 0.55, 0.62, 0.72, 0.82, 0.92]
    else:
        recommended_shifts = [0.42, 0.48, 0.54, 0.60, 0.66, 0.74, 0.82, 0.88, 0.36, 0.30]
        accent_shifts = [0.50, 0.58, 0.68, 0.78, 0.88, 0.44]
        avoid_shifts = [-0.10, -0.04, 0.03, 0.08, 0.14, 0.20]

    best_colors = [
        _hls_to_hex(base_hue + shift, _clamp(base_l + ((index % 5) - 2) * 0.055), muted_s)
        for index, shift in enumerate(recommended_shifts)
    ]

    # Add measured-friendly complexion colors at the front so each palette visibly
    # follows the user photo.
    complexion_colors = [
        _hex_from_rgb(_blend(midface.rgb, (255, 245, 232), 0.34)),
        _hex_from_rgb(_blend(cheek.rgb, (245, 224, 200), 0.24)),
        _hex_from_rgb(_blend(lip.rgb, (232, 196, 168), 0.18)),
        _hex_from_rgb(_blend(hair.rgb, (166, 124, 82), 0.32)),
        _hex_from_rgb(_blend(hair.rgb, (92, 83, 64), 0.48)),
    ]

    neutral_lightness = [0.86, 0.76, 0.64, 0.5, 0.36, 0.24]
    neutral_saturation = 0.16 if chroma < 0.5 else 0.22
    neutral_hue = base_hue + (0.02 if warmth >= 0.5 else 0.5)
    neutrals = [
        _hls_to_hex(neutral_hue, lightness, neutral_saturation)
        for lightness in neutral_lightness
    ]
    neutrals.extend([
        _hex_from_rgb(_blend(cheek.rgb, hair.rgb, 0.22)),
        _hex_from_rgb(_blend(cheek.rgb, hair.rgb, 0.52)),
    ])

    accent_l = _clamp(0.46 + contrast * 0.1, 0.38, 0.62)
    accents = [
        _hls_to_hex(base_hue + shift, accent_l, _clamp(muted_s * 1.35, 0.24, 0.78))
        for shift in accent_shifts
    ]

    avoid_s = 0.86 if chroma < 0.55 else 0.68
    avoid_l = 0.5 if warmth >= 0.5 else 0.48
    avoid_colors = [_hls_to_hex(base_hue + shift, avoid_l, avoid_s) for shift in avoid_shifts]
    if chroma < 0.5:
        avoid_colors = ["#FF0000", "#0047AB", "#FF1493", "#FFFFFF", "#000000", avoid_colors[0]]

    near_colors = [
        _hls_to_hex(base_hue + shift, _clamp(base_l + 0.08), _clamp(muted_s * 0.62, 0.12, 0.38))
        for shift in ([0.42, 0.50, 0.58, 0.66, 0.74, 0.82] if warmth >= 0.5 else [-0.12, -0.04, 0.04, 0.12, 0.20, 0.28])
    ]

    return {
        "bestColors": _unique(complexion_colors + best_colors)[:15],
        "neutrals": _unique(neutrals)[:8],
        "accents": _unique(accents)[:6],
        "avoidColors": _unique(avoid_colors)[:6],
        "nearColors": _unique(near_colors)[:6],
    }
