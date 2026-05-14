from datetime import UTC, datetime
from typing import Any

from app.common.schemas.cane import CaneAuthContext, CaneDistanceRequest
from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.distance_repository import DistanceRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository


class DistanceService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        settings = get_settings()
        self.distance_repository = DistanceRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)
        self.sampling_min_seconds = settings.distance_sampling_min_seconds
        self.sampling_delta_cm = settings.distance_sampling_delta_cm
        self.alert_distance_threshold_cm = settings.alert_distance_threshold_cm

    def ingest_distance(self, cane_context: CaneAuthContext, payload: CaneDistanceRequest) -> dict[str, Any]:
        recorded_at = payload.recorded_at or datetime.now(UTC)
        current_safety_status = "danger" if payload.detected and payload.distance_cm < self.alert_distance_threshold_cm else "safe"
        self.user_live_status_repository.update_distance_status(
            cane_context.user_id,
            {
                "device_id": cane_context.device_id,
                "current_safety_status": current_safety_status,
                "nearest_distance_cm": payload.distance_cm if payload.detected else None,
                "last_seen_at": recorded_at,
                "updated_at": datetime.now(UTC),
            },
        )

        should_save = self._should_save_sample(cane_context.device_id, payload.distance_cm, recorded_at)
        telemetry_id = None
        if should_save:
            telemetry_id = self.distance_repository.create_telemetry(
                {
                    "device_id": cane_context.device_id,
                    "user_id": cane_context.user_id,
                    "distance_cm": payload.distance_cm,
                    "detected": payload.detected,
                    "sensor_type": payload.sensor_type,
                    "recorded_at": recorded_at,
                }
            )

        return {
            "id": telemetry_id,
            "saved": should_save,
            "current_safety_status": current_safety_status,
            "nearest_distance_cm": payload.distance_cm if payload.detected else None,
            "recorded_at": recorded_at.isoformat(),
        }

    def _should_save_sample(self, device_id: str, distance_cm: float, recorded_at: datetime) -> bool:
        latest = self.distance_repository.get_latest_for_device(device_id)
        if latest is None:
            return True

        latest_recorded_at = latest.get("recorded_at")
        latest_distance_cm = latest.get("distance_cm")
        if latest_recorded_at is None or latest_distance_cm is None:
            return True

        elapsed_seconds = (recorded_at - latest_recorded_at).total_seconds()
        distance_delta = abs(distance_cm - latest_distance_cm)
        return elapsed_seconds >= self.sampling_min_seconds or distance_delta >= self.sampling_delta_cm
