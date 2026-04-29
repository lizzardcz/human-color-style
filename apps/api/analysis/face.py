from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Iterable

from PIL import Image

Box = tuple[float, float, float, float]

DEFAULT_REGIONS: dict[str, Box] = {
    "cheek": (0.28, 0.42, 0.72, 0.58),
    "midface": (0.34, 0.34, 0.66, 0.52),
    "neck": (0.36, 0.62, 0.64, 0.82),
    "lip": (0.42, 0.53, 0.58, 0.60),
    "hair": (0.24, 0.08, 0.76, 0.28),
    "iris": (0.38, 0.36, 0.62, 0.43),
}


@dataclass(frozen=True)
class FaceRegionResult:
    regions: dict[str, Box]
    method: str
    warnings: list[str]


def _clamp_box(box: Box) -> Box:
    left, top, right, bottom = box
    left = max(0.0, min(0.98, left))
    top = max(0.0, min(0.98, top))
    right = max(left + 0.01, min(1.0, right))
    bottom = max(top + 0.01, min(1.0, bottom))
    return (left, top, right, bottom)


def _box_from_points(points: Iterable[tuple[float, float]], padding_x: float = 0.02, padding_y: float = 0.02) -> Box:
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return _clamp_box((min(xs) - padding_x, min(ys) - padding_y, max(xs) + padding_x, max(ys) + padding_y))


def _looks_like_skin(red: int, green: int, blue: int) -> bool:
    return (
        red > 88
        and green > 45
        and blue > 28
        and red > blue
        and red >= green - 8
        and max(red, green, blue) - min(red, green, blue) > 16
        and not (red > 235 and green > 225 and blue > 210)
    )


def _skin_detected_regions(image: Image.Image) -> FaceRegionResult | None:
    width, height = image.size
    scan_width = 180
    scan_height = max(120, round(height * (scan_width / width)))
    scan = image.resize((scan_width, scan_height)).convert("RGB")
    pixels = scan.load()
    visited: set[tuple[int, int]] = set()
    best_component: tuple[int, int, int, int, int] | None = None

    for y in range(scan_height):
        for x in range(scan_width):
            if (x, y) in visited:
                continue
            visited.add((x, y))
            if not _looks_like_skin(*pixels[x, y]):
                continue

            queue: deque[tuple[int, int]] = deque([(x, y)])
            min_x = max_x = x
            min_y = max_y = y
            count = 0
            while queue:
                current_x, current_y = queue.popleft()
                count += 1
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)
                for next_x, next_y in ((current_x + 1, current_y), (current_x - 1, current_y), (current_x, current_y + 1), (current_x, current_y - 1)):
                    if next_x < 0 or next_x >= scan_width or next_y < 0 or next_y >= scan_height or (next_x, next_y) in visited:
                        continue
                    visited.add((next_x, next_y))
                    if _looks_like_skin(*pixels[next_x, next_y]):
                        queue.append((next_x, next_y))

            component_width = max_x - min_x + 1
            component_height = max_y - min_y + 1
            if count < 80 or component_width < 10 or component_height < 12:
                continue
            if best_component is None or count > best_component[0]:
                best_component = (count, min_x, min_y, max_x, max_y)

    if best_component is None:
        return None

    _count, min_x, min_y, max_x, max_y = best_component
    left = min_x / scan_width
    top = min_y / scan_height
    right = (max_x + 1) / scan_width
    bottom = (max_y + 1) / scan_height
    face_box = _clamp_box((left - 0.03, top - 0.04, right + 0.03, bottom + 0.05))
    left, top, right, bottom = face_box
    box_width = right - left
    box_height = bottom - top

    regions = {
        "cheek": _clamp_box((left + box_width * 0.16, top + box_height * 0.42, right - box_width * 0.16, top + box_height * 0.70)),
        "midface": _clamp_box((left + box_width * 0.28, top + box_height * 0.24, right - box_width * 0.28, top + box_height * 0.50)),
        "neck": _clamp_box((left + box_width * 0.30, bottom - box_height * 0.02, right - box_width * 0.30, min(1.0, bottom + box_height * 0.22))),
        "lip": _clamp_box((left + box_width * 0.38, top + box_height * 0.62, right - box_width * 0.38, top + box_height * 0.76)),
        "hair": _clamp_box((left + box_width * 0.03, max(0.0, top - box_height * 0.32), right - box_width * 0.03, top + box_height * 0.12)),
        "iris": _clamp_box((left + box_width * 0.30, top + box_height * 0.30, right - box_width * 0.30, top + box_height * 0.44)),
    }
    return FaceRegionResult(
        regions=regions,
        method="fallback-skin-component",
        warnings=["MediaPipe 未安装，已使用肤色连通区域定位人脸；生产环境建议安装 MediaPipe FaceMesh。"],
    )


def detect_face_regions(image: Image.Image) -> FaceRegionResult:
    """Return normalized region boxes for color extraction.

    MediaPipe FaceMesh is used when installed. The project keeps an approximate
    fallback because Python 3.14 environments often cannot install MediaPipe yet.
    """

    try:
        import mediapipe as mp  # type: ignore
        import numpy as np
    except Exception:
        skin_result = _skin_detected_regions(image)
        if skin_result is not None:
            return skin_result
        return FaceRegionResult(
            regions=DEFAULT_REGIONS,
            method="fallback-relative-boxes",
            warnings=["MediaPipe 未安装，已使用相对区域取色；生产环境建议安装 MediaPipe FaceMesh。"],
        )

    arr = np.asarray(image)
    face_mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    )
    result = face_mesh.process(arr)
    face_mesh.close()

    if not result.multi_face_landmarks:
        skin_result = _skin_detected_regions(image)
        if skin_result is not None:
            return skin_result
        return FaceRegionResult(
            regions=DEFAULT_REGIONS,
            method="fallback-no-face-detected",
            warnings=["未检测到稳定人脸 landmarks，已使用相对区域取色。"],
        )

    landmarks = result.multi_face_landmarks[0].landmark

    def pts(indices: list[int]) -> list[tuple[float, float]]:
        return [(landmarks[index].x, landmarks[index].y) for index in indices if index < len(landmarks)]

    face_outline = pts([10, 21, 54, 103, 67, 109, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162])
    face_box = _box_from_points(face_outline, 0.02, 0.03)
    left, top, right, bottom = face_box
    width = right - left
    height = bottom - top

    lip_box = _box_from_points(pts([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 0, 13, 14, 78, 308]), 0.015, 0.01)
    iris_box = _box_from_points(pts([33, 133, 362, 263, 468, 473]), 0.01, 0.01)

    regions = {
        "cheek": _clamp_box((left + width * 0.22, top + height * 0.42, right - width * 0.22, top + height * 0.62)),
        "midface": _clamp_box((left + width * 0.32, top + height * 0.30, right - width * 0.32, top + height * 0.50)),
        "neck": _clamp_box((left + width * 0.30, bottom - height * 0.02, right - width * 0.30, min(1.0, bottom + height * 0.24))),
        "lip": lip_box,
        "hair": _clamp_box((left + width * 0.08, max(0.0, top - height * 0.22), right - width * 0.08, top + height * 0.10)),
        "iris": iris_box,
    }

    return FaceRegionResult(regions=regions, method="mediapipe-facemesh", warnings=[])
