from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class DeviceRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'devices')

    def get_by_device_code(self, device_code: str) -> dict[str, Any] | None:
        return self.find_one({'device_code': device_code})

    def get_by_id_and_owner(self, device_id: str, user_id: str) -> dict[str, Any] | None:
        try:
            device_key = ObjectId(device_id)
        except InvalidId:
            device_key = device_id
        return self.find_one({'_id': device_key, 'owner_user_id': user_id})

    def get_by_id(self, device_id: str) -> dict[str, Any] | None:
        try:
            device_key = ObjectId(device_id)
        except InvalidId:
            device_key = device_id
        return self.find_one({'_id': device_key})

    def update_heartbeat(self, device_id: str, payload: dict[str, Any]) -> int:
        return self.update_one({'_id': device_id}, payload)

    def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        return list(self.collection.find({'owner_user_id': user_id}).sort('created_at', 1))

    def list_all(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        skip = max(page - 1, 0) * limit
        return list(self.collection.find({}).sort('created_at', -1).skip(skip).limit(limit))

    def assign_device(self, device_id: str, user_id: str) -> int:
        try:
            device_key = ObjectId(device_id)
        except InvalidId:
            device_key = device_id
        return self.update_one(
            {'_id': device_key},
            {'owner_user_id': user_id, 'updated_at': datetime.now(UTC)},
        )
