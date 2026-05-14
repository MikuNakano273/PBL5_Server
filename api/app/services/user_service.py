from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.user import UpdateMeRequest
from app.core.database import get_database
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.user_repository = UserRepository(database)

    def get_profile(self, user_id: str) -> dict[str, Any]:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise AppError(code='user_not_found', message='User not found.', status_code=404)
        return self._serialize_user(user)

    def update_profile(self, user_id: str, payload: UpdateMeRequest) -> dict[str, Any]:
        update_data = payload.model_dump(exclude_none=True)
        if not update_data:
            return self.get_profile(user_id)

        updated = self.user_repository.update_profile(user_id, update_data)
        if updated == 0:
            existing = self.user_repository.get_by_id(user_id)
            if existing is None:
                raise AppError(code='user_not_found', message='User not found.', status_code=404)
        return self.get_profile(user_id)

    def _serialize_user(self, user: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(user)
        serialized['_id'] = str(serialized['_id'])
        return serialized
