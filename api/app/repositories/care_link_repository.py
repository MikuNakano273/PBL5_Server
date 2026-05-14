from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class CareLinkRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'care_links')

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        return list(
            self.collection.find(
                {
                    '$or': [
                        {'blind_user_id': user_id},
                        {'family_user_id': user_id},
                    ]
                }
            ).sort('created_at', 1)
        )

    def get_by_id(self, care_link_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(care_link_id)
        except InvalidId:
            return None
        return self.find_one({'_id': object_id})

    def get_by_pair(self, blind_user_id: str, family_user_id: str) -> dict[str, Any] | None:
        return self.find_one({'blind_user_id': blind_user_id, 'family_user_id': family_user_id})

    def list_active_family_user_ids(self, blind_user_id: str) -> list[str]:
        links = self.collection.find({'blind_user_id': blind_user_id, 'status': 'active'})
        return [link['family_user_id'] for link in links]

    def create_link(self, payload: dict[str, Any]) -> str:
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        payload.setdefault('status', 'active')
        payload.setdefault('created_at', now)
        payload.setdefault('updated_at', now)
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def delete_link(self, care_link_id: str) -> int:
        try:
            object_id = ObjectId(care_link_id)
        except InvalidId:
            return 0
        result = self.collection.delete_one({'_id': object_id})
        return result.deleted_count
