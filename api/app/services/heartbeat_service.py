from datetime import UTC, datetime

from app.common.schemas.cane import CaneAuthContext, CaneHeartbeatRequest
from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository


class HeartbeatService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)

    def record_heartbeat(self, cane_context: CaneAuthContext, payload: CaneHeartbeatRequest) -> dict[str, str]:
        seen_at = payload.seen_at or datetime.now(UTC)
        device_payload = {
            "last_seen_at": seen_at,
            "last_battery": payload.battery,
            "status": "online",
        }
        if payload.firmware_version is not None:
            device_payload["firmware_version"] = payload.firmware_version

        self.device_repository.update_heartbeat(cane_context.device_id, device_payload)
        self.user_live_status_repository.update_last_seen(
            cane_context.user_id,
            {
                "device_id": cane_context.device_id,
                "last_seen_at": seen_at,
                "updated_at": datetime.now(UTC),
            },
        )
        return {"device_id": cane_context.device_id, "last_seen_at": seen_at.isoformat()}
