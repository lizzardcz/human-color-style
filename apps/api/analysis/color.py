from __future__ import annotations

import io
from collections import defaultdict
from dataclasses import dataclass

from PIL import Image, ImageOps, ImageStat

from apps.api.analysis.face import DEFAULT_REGIONS, detect_face_regions


@dataclass(frozen=True)
class RegionColor:
    key: str
    label: str
    hex: str
    rgb: tuple[int, int, int]
    lab: tuple[float, float, float]


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def read_image_bytes(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


def gray_world_white_balance(image: Image.Image) -> Image.Image:
    stat = ImageStat.Stat(image)
    means = [max(value, 1.0) for value in stat.mean[:3]]
    global_mean = sum(means) / 3
    scales = [global_mean / value for value in means]

    def transform(channel: int, scale: float) -> int:
        return int(max(0, min(255, round(channel * scale))))

    pixels = [
        (
            transform(red, scales[0]),
            transform(green, scales[1]),
            transform(blue, scales[2]),
        )
        for red, green, blue in image.getdata()
    ]
    balanced = Image.new("RGB", image.size)
    balanced.putdata(pixels)
    return balanced


def crop_region(image: Image.Image, box: tuple[float, float, float, float]) -> list[tuple[int, int, int]]:
    width, height = image.size
    left, top, right, bottom = box
    pixel_box = (
        int(width * left),
        int(height * top),
        int(width * right),
        int(height * bottom),
    )
    return list(image.crop(pixel_box).resize((96, 96)).getdata())


def dominant_rgb(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    if not pixels:
        return (200, 170, 145)

    buckets: dict[tuple[int, int, int], list[tuple[int, int, int]]] = defaultdict(list)
    for red, green, blue in pixels:
        if red > 225 and green > 225 and blue > 225:
            continue
        buckets[(red // 16, green // 16, blue // 16)].append((red, green, blue))

    if not buckets:
        buckets[(0, 0, 0)] = pixels

    dominant_pixels = max(buckets.values(), key=len)
    total = len(dominant_pixels)
    return (
        round(sum(pixel[0] for pixel in dominant_pixels) / total),
        round(sum(pixel[1] for pixel in dominant_pixels) / total),
        round(sum(pixel[2] for pixel in dominant_pixels) / total),
    )


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#" + "".join(f"{channel:02X}" for channel in rgb)


def _pivot_rgb(value: float) -> float:
    value = value / 255
    return ((value + 0.055) / 1.055) ** 2.4 if value > 0.04045 else value / 12.92


def _pivot_xyz(value: float) -> float:
    return value ** (1 / 3) if value > 0.008856 else (7.787 * value) + (16 / 116)


def rgb_to_lab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    red, green, blue = (_pivot_rgb(channel) for channel in rgb)
    x = (red * 0.4124 + green * 0.3576 + blue * 0.1805) / 0.95047
    y = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 1.0
    z = (red * 0.0193 + green * 0.1192 + blue * 0.9505) / 1.08883

    fx, fy, fz = _pivot_xyz(x), _pivot_xyz(y), _pivot_xyz(z)
    lightness = (116 * fy) - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    return (float(lightness), float(a), float(b))


def extract_region_colors(image: Image.Image) -> tuple[list[RegionColor], str, list[str]]:
    detected = detect_face_regions(image)
    labels = {
        "cheek": "脸颊",
        "midface": "中庭",
        "neck": "颈部",
        "lip": "唇色",
        "hair": "发色",
        "iris": "瞳色",
    }
    output: list[RegionColor] = []
    for key, label in labels.items():
        box = detected.regions.get(key, DEFAULT_REGIONS[key])
        rgb = dominant_rgb(crop_region(image, box))
        output.append(RegionColor(key=key, label=label, hex=rgb_to_hex(rgb), rgb=rgb, lab=rgb_to_lab(rgb)))
    return output, detected.method, detected.warnings


def compute_axes(colors: list[RegionColor]) -> dict[str, float]:
    by_key = {item.key: item for item in colors}
    skin = by_key.get("cheek") or colors[0]
    hair = by_key.get("hair") or colors[-2]
    lip = by_key.get("lip") or skin

    skin_l, _skin_a, skin_b = skin.lab
    hair_l, _hair_a, _hair_b = hair.lab
    lip_l, lip_a, lip_b = lip.lab

    warmth = _clamp((skin_b + 6) / 34)
    lightness = _clamp(skin_l / 100)
    chroma = _clamp(((lip_a**2 + lip_b**2) ** 0.5) / 70)
    contrast = _clamp(abs(skin_l - hair_l) / 75)

    return {
        "warmth": round(warmth, 3),
        "lightness": round(lightness, 3),
        "chroma": round(chroma, 3),
        "contrast": round(contrast, 3),
    }
