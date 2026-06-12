from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.core.config import get_settings
from app.services.demo_frame_persistence_service import DemoFramePersistenceService
from app.services.demo_sensor_persistence_service import DemoSensorPersistenceService


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_db_name]
    frame_service = DemoFramePersistenceService(database)
    sensor_service = DemoSensorPersistenceService(database)
    pictures_dir = Path(settings.pictures_dir)

    frames = 0
    sensors = 0
    skipped_sensors = 0
    for metadata_path in sorted(pictures_dir.glob("*.json")):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        frame_id = str(metadata["frame_id"])
        device_code = str(metadata["device_id"])
        matched_sensor = metadata.get("matched_sensor") or {}

        if matched_sensor and not database.distance_telemetry.find_one({"source_frame_id": frame_id}):
            sensor_service.persist_sensor(
                {
                    "device_id": device_code,
                    "seq": matched_sensor.get("seq"),
                    "millis": metadata.get("millis"),
                    "distance_cm": matched_sensor.get("distance_cm") or 0,
                    "distance_valid": matched_sensor.get("distance_cm") is not None,
                    "obstacle_in_1m": bool((matched_sensor.get("distance_cm") or 0) < 100),
                    "alert_level": (metadata.get("scene_context") or {}).get("risk_level", "clear"),
                    "gps": matched_sensor.get("gps") or {"fix": False, "lat": 0, "lng": 0, "sats": 0},
                    "source_frame_id": frame_id,
                }
            )
            sensors += 1
        else:
            skipped_sensors += 1

        frame_service.persist_frame(
            device_code=device_code,
            frame_id=frame_id,
            image_url=str(metadata["image_url"]),
            created_at=datetime.fromisoformat(str(metadata["created_at"])),
            sensor=matched_sensor or None,
            yolo_result={
                "model_name": "yolov8s",
                "model_version": "demo",
                "objects": metadata.get("objects") or [],
                "summary_text": f"Detected {len(metadata.get('objects') or [])} object(s)",
            },
            scene_context=metadata.get("scene_context") or {},
        )
        frames += 1

    client.close()
    print(f"Backfilled {frames} frame(s), {sensors} sensor snapshot(s); skipped {skipped_sensors} existing sensor snapshot(s).")


if __name__ == "__main__":
    main()
