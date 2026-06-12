from typing import Any
from pathlib import Path
from urllib.parse import urlparse

from app.common.exceptions.base import AppError
from app.common.schemas.admin import AdminUserUpdateRequest
from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.alert_repository import AlertRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.image_request_repository import ImageRequestRepository
from app.repositories.user_repository import UserRepository
from app.services.storage_service import StorageService


class AdminService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.user_repository = UserRepository(database)
        self.device_repository = DeviceRepository(database)
        self.image_request_repository = ImageRequestRepository(database)
        self.alert_repository = AlertRepository(database)
        self.storage_service = None
        self.pictures_dir = Path(get_settings().pictures_dir)

    def list_users(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        return [self._serialize_document(user) for user in self.user_repository.list_users(page, limit)]

    def get_user(self, user_id: str) -> dict[str, Any]:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise AppError(code="user_not_found", message="User not found.", status_code=404)
        return self._serialize_document(user)

    def update_user(self, user_id: str, payload: AdminUserUpdateRequest) -> dict[str, Any]:
        update_payload = payload.model_dump(exclude_none=True)
        if update_payload:
            self.user_repository.update_admin_fields(user_id, update_payload)
        return self.get_user(user_id)

    def list_devices(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        return [self._serialize_document(device) for device in self.device_repository.list_all(page, limit)]

    def assign_device(self, device_id: str, user_id: str) -> dict[str, Any]:
        self.device_repository.assign_device(device_id, user_id)
        device = self.device_repository.get_by_id(device_id)
        if device is None:
            raise AppError(code="device_not_found", message="Device not found.", status_code=404)
        return self._serialize_document(device)

    def list_image_requests(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        storage_service = self.storage_service or StorageService()
        requests = []
        for request in self.image_request_repository.list_all(page, limit):
            serialized = self._serialize_document(request)
            if self._is_missing_demo_image(serialized):
                self.image_request_repository.delete_by_id(serialized["id"])
                continue
            if image_path := serialized.get("image_path"):
                serialized["image_url"] = storage_service.get_presigned_download_url(image_path)
            requests.append(serialized)
        return requests

    def list_alerts(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        return [self._serialize_document(alert) for alert in self.alert_repository.list_all(page, limit)]

    def _serialize_document(self, document: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(document)
        serialized["id"] = str(serialized.pop("_id"))
        for key, value in list(serialized.items()):
            if hasattr(value, "isoformat"):
                serialized[key] = value.isoformat()
        return serialized

    def _is_missing_demo_image(self, request: dict[str, Any]) -> bool:
        if self.pictures_dir is None or request.get("image_path"):
            return False
        image_url = request.get("image_url")
        if not isinstance(image_url, str):
            return False
        path = urlparse(image_url).path
        prefix = "/uploads/"
        if not path.startswith(prefix) or not path.endswith(".jpg"):
            return False
        frame_id = Path(path[len(prefix):]).stem
        return not (self.pictures_dir / f"{frame_id}.jpg").is_file()
