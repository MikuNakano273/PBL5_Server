from datetime import UTC, datetime
from typing import Any

from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository
from app.repositories.distance_repository import DistanceRepository
from app.repositories.gps_repository import GpsRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository


class DemoSensorPersistenceService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)
        self.distance_repository = DistanceRepository(database)
        self.gps_repository = GpsRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)

    def persist_sensor(self, sensor: dict[str, Any]) -> dict[str, Any]:
        device = self.device_repository.get_by_device_code(str(sensor.get("device_id") or ""))
        if device is None:
            return {"persisted": False, "reason": "device_not_found"}

        user_id = device.get("owner_user_id")
        if not user_id:
            return {"persisted": False, "reason": "device_has_no_owner"}

        device_id = str(device["_id"])
        user_id = str(user_id)
        recorded_at = datetime.now(UTC)
        distance_id = self.distance_repository.create_telemetry(
            {
                "device_id": device_id,
                "user_id": user_id,
                "seq": sensor.get("seq"),
                "millis": sensor.get("millis"),
                "source_frame_id": sensor.get("source_frame_id"),
                "distance_cm": sensor.get("distance_cm"),
                "detected": bool(sensor.get("distance_valid", True)),
                "obstacle_in_1m": bool(sensor.get("obstacle_in_1m", False)),
                "alert_level": sensor.get("alert_level"),
                "sensor_type": "demo_ultrasonic",
                "recorded_at": recorded_at,
            }
        )

        gps = sensor.get("gps") or {}
        location = {
            "type": "Point",
            "coordinates": [gps.get("lng"), gps.get("lat")],
        }
        gps_id = self.gps_repository.create_log(
            {
                "device_id": device_id,
                "user_id": user_id,
                "seq": sensor.get("seq"),
                "millis": sensor.get("millis"),
                "source_frame_id": sensor.get("source_frame_id"),
                "fix": bool(gps.get("fix", False)),
                "sats": gps.get("sats"),
                "lat": gps.get("lat"),
                "lng": gps.get("lng"),
                "location": location,
                "accuracy": None,
                "speed": None,
                "heading": None,
                "recorded_at": recorded_at,
            }
        )

        safety_status = "danger" if sensor.get("alert_level") in {"danger", "critical"} else "safe"
        common_status = {
            "device_id": device_id,
            "last_seen_at": recorded_at,
            "updated_at": recorded_at,
        }
        self.user_live_status_repository.update_distance_status(
            user_id,
            {
                **common_status,
                "current_safety_status": safety_status,
                "nearest_distance_cm": sensor.get("distance_cm") if sensor.get("distance_valid", True) else None,
            },
        )
        self.user_live_status_repository.update_location(
            user_id,
            {
                **common_status,
                "last_location": location,
            },
        )
        self.user_live_status_repository.update_last_seen(user_id, common_status)
        self.device_repository.update_heartbeat(
            device_id,
            {
                "last_seen_at": recorded_at,
                "status": "online",
            },
        )
        return {
            "persisted": True,
            "distance_id": distance_id,
            "gps_id": gps_id,
            "recorded_at": recorded_at.isoformat(),
        }
