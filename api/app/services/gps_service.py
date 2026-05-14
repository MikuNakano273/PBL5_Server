from datetime import UTC, datetime
from typing import Any

from app.common.schemas.cane import CaneAuthContext, CaneGpsRequest
from app.core.database import get_database
from app.repositories.gps_repository import GpsRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository


class GpsService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.gps_repository = GpsRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)

    def ingest_gps(self, cane_context: CaneAuthContext, payload: CaneGpsRequest) -> dict[str, Any]:
        recorded_at = payload.recorded_at or datetime.now(UTC)
        location = {"type": "Point", "coordinates": [payload.lng, payload.lat]}
        gps_payload = {
            "device_id": cane_context.device_id,
            "user_id": cane_context.user_id,
            "lat": payload.lat,
            "lng": payload.lng,
            "location": location,
            "accuracy": payload.accuracy,
            "speed": payload.speed,
            "heading": payload.heading,
            "recorded_at": recorded_at,
        }
        gps_id = self.gps_repository.create_log(gps_payload)
        self.user_live_status_repository.update_location(
            cane_context.user_id,
            {
                "device_id": cane_context.device_id,
                "last_location": location,
                "last_seen_at": recorded_at,
                "updated_at": datetime.now(UTC),
            },
        )
        return {"id": gps_id, "location": location, "recorded_at": recorded_at.isoformat()}
