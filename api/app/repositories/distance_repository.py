from typing import Any

from app.repositories.base import BaseRepository


class DistanceRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "distance_telemetry")

    def create_telemetry(self, payload: dict[str, Any]) -> str:
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def get_latest_for_device(self, device_id: str) -> dict[str, Any] | None:
        return self.collection.find_one({"device_id": device_id}, sort=[("recorded_at", -1)])

    def delete_older_than(self, cutoff) -> int:
        result = self.collection.delete_many({"recorded_at": {"$lt": cutoff}})
        return result.deleted_count
