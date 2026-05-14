from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.auth import AuthContext
from app.common.schemas.care_link import CareLinkCreateRequest
from app.core.database import get_database
from app.repositories.care_link_repository import CareLinkRepository


class CareLinkService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.care_link_repository = CareLinkRepository(database)

    def list_links(self, auth_context: AuthContext) -> list[dict[str, Any]]:
        if auth_context.role == 'admin':
            links = list(self.care_link_repository.collection.find({}).sort('created_at', 1))
        else:
            links = self.care_link_repository.list_for_user(auth_context.user_id)
        return [self._serialize_link(link) for link in links]

    def create_link(self, auth_context: AuthContext, payload: CareLinkCreateRequest) -> dict[str, Any]:
        if auth_context.role != 'admin':
            if auth_context.user_type == 'family' and payload.family_user_id != auth_context.user_id:
                raise AppError(code='care_link_forbidden', message='Family user can only create their own care link.', status_code=403)
            if auth_context.user_type == 'blind' and payload.blind_user_id != auth_context.user_id:
                raise AppError(code='care_link_forbidden', message='Blind user can only create their own care link.', status_code=403)

        existing = self.care_link_repository.get_by_pair(payload.blind_user_id, payload.family_user_id)
        if existing is not None:
            return self._serialize_link(existing)

        care_link_id = self.care_link_repository.create_link(payload.model_dump())
        care_link = self.care_link_repository.get_by_id(care_link_id)
        if care_link is None:
            raise AppError(code='care_link_create_failed', message='Failed to create care link.', status_code=500)
        return self._serialize_link(care_link)

    def delete_link(self, auth_context: AuthContext, care_link_id: str) -> None:
        care_link = self.care_link_repository.get_by_id(care_link_id)
        if care_link is None:
            raise AppError(code='care_link_not_found', message='Care link not found.', status_code=404)

        if auth_context.role != 'admin' and auth_context.user_id not in {care_link['blind_user_id'], care_link['family_user_id']}:
            raise AppError(code='care_link_forbidden', message='You cannot delete this care link.', status_code=403)

        deleted = self.care_link_repository.delete_link(care_link_id)
        if deleted == 0:
            raise AppError(code='care_link_delete_failed', message='Failed to delete care link.', status_code=500)

    def _serialize_link(self, link: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(link)
        serialized['_id'] = str(serialized['_id'])
        return serialized
