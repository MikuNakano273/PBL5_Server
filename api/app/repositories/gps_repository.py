from typing import Any

from app.repositories.base import BaseRepository


class GpsRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'gps_logs')

    def create_log(self, payload: dict[str, Any]) -> str:
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def list_for_blind_user(self, blind_user_id: str, limit: int = 20) -> list[dict[str, Any]]:
        return list(self.collection.find({'blind_user_id': blind_user_id}).sort('recorded_at', -1).limit(limit))

    def delete_older_than(self, cutoff) -> int:
        result = self.collection.delete_many({'recorded_at': {'$lt': cutoff}})
        return result.deleted_count
