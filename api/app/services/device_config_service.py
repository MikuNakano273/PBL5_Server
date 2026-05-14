from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.cane import CaneAuthContext
from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository


class DeviceConfigService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)
        self.settings = get_settings()

    def get_config(self, cane_context: CaneAuthContext) -> dict[str, Any]:
        device = self.device_repository.get_by_id_and_owner(cane_context.device_id, cane_context.user_id)
        if device is None:
            raise AppError(code="device_not_found", message="Device not found.", status_code=404)

        return {
            "device_id": str(device["_id"]),
            "device_code": device["device_code"],
            "user_id": device["owner_user_id"],
            "name": device.get("name"),
            "firmware_version": device.get("firmware_version"),
            "status": device.get("status"),
            "minio_bucket": self.settings.minio_bucket,
            "image_upload_prefix": f"raw/{device['owner_user_id']}/{device['_id']}/",
            "image_upload_url_ttl_seconds": self.settings.image_upload_url_ttl_seconds,
            "telemetry": {
                "alert_distance_threshold_cm": self.settings.alert_distance_threshold_cm,
                "distance_sampling_min_seconds": self.settings.distance_sampling_min_seconds,
                "distance_sampling_delta_cm": self.settings.distance_sampling_delta_cm,
            },
        }
