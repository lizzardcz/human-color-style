from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent / "data" / "reports"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _path(report_id: str) -> Path:
    safe = "".join(char for char in report_id if char.isalnum() or char in {"-", "_"})
    if not safe:
        raise ValueError("Invalid report id")
    return DATA_DIR / f"{safe}.json"


def create_report(report: dict[str, Any]) -> dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    report_id = report.get("id")
    if not isinstance(report_id, str) or report_id.startswith("demo-"):
        report_id = secrets.token_urlsafe(8)
    timestamp = _now()
    record = {
        "id": report_id,
        "report": {**report, "id": report_id},
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    _path(report_id).write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")
    return record


def get_report(report_id: str) -> dict[str, Any] | None:
    path = _path(report_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def list_reports(limit: int = 20) -> list[dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(DATA_DIR.glob("*.json"), key=lambda file: file.stat().st_mtime, reverse=True)
    records: list[dict[str, Any]] = []
    for file in files[:limit]:
        records.append(json.loads(file.read_text(encoding="utf-8")))
    return records
