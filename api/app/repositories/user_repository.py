from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'users')

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        return self.find_one({'email': email})

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            return self.find_one({'_id': user_id})
        user = self.find_one({'_id': object_id})
        if user is not None:
            return user
        return self.find_one({'_id': user_id})

    def list_users(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        skip = max(page - 1, 0) * limit
        return list(self.collection.find({}).sort('created_at', -1).skip(skip).limit(limit))

    def create_user(self, payload: dict[str, Any]) -> str:
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        payload.setdefault('created_at', now)
        payload.setdefault('updated_at', now)
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def update_password_hash(self, user_id: str, password_hash: str) -> int:
        from datetime import UTC, datetime

        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            return 0
        return self.update_one(
            {'_id': object_id},
            {'password_hash': password_hash, 'updated_at': datetime.now(UTC)},
        )

    def update_profile(self, user_id: str, payload: dict[str, Any]) -> int:
        from datetime import UTC, datetime

        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            object_id = user_id
        payload = dict(payload)
        payload['updated_at'] = datetime.now(UTC)
        return self.update_one({'_id': object_id}, payload)

    def update_admin_fields(self, user_id: str, payload: dict[str, Any]) -> int:
        from datetime import UTC, datetime

        try:
            object_id = ObjectId(user_id)
        except InvalidId:
            object_id = user_id
        payload = {key: value for key, value in payload.items() if value is not None}
        payload['updated_at'] = datetime.now(UTC)
        return self.update_one({'_id': object_id}, payload)
