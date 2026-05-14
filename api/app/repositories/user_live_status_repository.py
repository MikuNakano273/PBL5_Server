from typing import Any

from app.repositories.base import BaseRepository


class UserLiveStatusRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'user_live_status')

    def get_by_blind_user(self, blind_user_id: str) -> dict[str, Any] | None:
        return self.find_one({'blind_user_id': blind_user_id})

    def update_location(self, blind_user_id: str, payload: dict[str, Any]) -> int:
        result = self.collection.update_one(
            {'blind_user_id': blind_user_id},
            {
                '$set': payload,
                '$setOnInsert': {
                    'blind_user_id': blind_user_id,
                    'current_safety_status': 'safe',
                    'nearest_distance_cm': None,
                    'last_alert_at': None,
                },
            },
            upsert=True,
        )
        return result.modified_count or int(result.upserted_id is not None)

    def update_distance_status(self, blind_user_id: str, payload: dict[str, Any]) -> int:
        result = self.collection.update_one(
            {'blind_user_id': blind_user_id},
            {
                '$set': payload,
                '$setOnInsert': {
                    'blind_user_id': blind_user_id,
                    'last_location': None,
                    'last_alert_at': None,
                },
            },
            upsert=True,
        )
        return result.modified_count or int(result.upserted_id is not None)

    def update_last_seen(self, blind_user_id: str, payload: dict[str, Any]) -> int:
        result = self.collection.update_one(
            {'blind_user_id': blind_user_id},
            {
                '$set': payload,
                '$setOnInsert': {
                    'blind_user_id': blind_user_id,
                    'current_safety_status': 'safe',
                    'nearest_distance_cm': None,
                    'last_location': None,
                    'last_alert_at': None,
                },
            },
            upsert=True,
        )
        return result.modified_count or int(result.upserted_id is not None)

    def update_alert_status(self, blind_user_id: str, payload: dict[str, Any]) -> int:
        result = self.collection.update_one(
            {'blind_user_id': blind_user_id},
            {
                '$set': payload,
                '$setOnInsert': {
                    'blind_user_id': blind_user_id,
                    'last_location': None,
                },
            },
            upsert=True,
        )
        return result.modified_count or int(result.upserted_id is not None)
