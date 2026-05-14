from datetime import UTC, datetime
from typing import Any

from app.common.exceptions.base import AppError
from app.core.database import get_database
from app.repositories.installation_account_repository import InstallationAccountRepository
from app.repositories.installation_notification_repository import InstallationNotificationRepository
from app.repositories.mobile_installation_repository import MobileInstallationRepository
from app.repositories.notification_event_repository import NotificationEventRepository


class InstallationService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.installation_repository = MobileInstallationRepository(database)
        self.installation_account_repository = InstallationAccountRepository(database)
        self.notification_event_repository = NotificationEventRepository(database)
        self.installation_notification_repository = InstallationNotificationRepository(database)

    def get_installation_by_fingerprint(self, device_fingerprint: str) -> dict[str, Any] | None:
        return self.installation_repository.get_by_fingerprint(device_fingerprint)

    def get_or_create_installation(self, device_fingerprint: str, device_name: str, platform: str) -> dict[str, Any]:
        existing = self.installation_repository.get_by_fingerprint(device_fingerprint)
        if existing is not None:
            self.installation_repository.update_installation(
                str(existing["_id"]),
                {
                    "device_name": device_name,
                    "platform": platform,
                    "status": "active",
                    "last_seen_at": datetime.now(UTC),
                },
            )
            return self.installation_repository.get_by_id(str(existing["_id"])) or existing

        installation_id = self.installation_repository.create_installation(
            {
                "device_fingerprint": device_fingerprint,
                "device_name": device_name,
                "platform": platform,
                "push_provider": None,
                "push_token": None,
                "status": "active",
            }
        )
        installation = self.installation_repository.get_by_id(installation_id)
        if installation is None:
            raise AppError(code="installation_create_failed", message="Failed to create installation.", status_code=500)
        return installation

    def attach_account_to_installation(self, installation_id: str, user_id: str) -> dict[str, Any]:
        existing = self.installation_account_repository.get_by_installation_and_user(installation_id, user_id)
        if existing is not None:
            return existing

        is_first_account = self.installation_account_repository.get_active_account(installation_id) is None
        installation_account_id = self.installation_account_repository.create_account(
            {
                "installation_id": installation_id,
                "user_id": user_id,
                "is_active": is_first_account,
                "last_switched_at": datetime.now(UTC) if is_first_account else None,
            }
        )
        account = self.installation_account_repository.get_by_id(installation_account_id)
        if account is None:
            raise AppError(code="installation_account_create_failed", message="Failed to attach account.", status_code=500)
        return account

    def switch_active_account(self, installation_id: str, target_installation_account_id: str) -> dict[str, Any]:
        target_account = self.installation_account_repository.get_by_id(target_installation_account_id)
        if target_account is None or target_account["installation_id"] != installation_id:
            raise AppError(code="installation_account_not_found", message="Installation account not found.", status_code=404)

        self.installation_account_repository.deactivate_all(installation_id)
        self.installation_account_repository.activate_account(target_installation_account_id)
        active_account = self.installation_account_repository.get_by_id(target_installation_account_id)
        if active_account is None:
            raise AppError(code="installation_switch_failed", message="Failed to switch account.", status_code=500)
        return active_account

    def list_installation_accounts(self, installation_id: str) -> list[dict[str, Any]]:
        return self.installation_account_repository.list_by_installation(installation_id)

    def save_push_token(self, installation_id: str, push_token: str, provider: str, platform: str | None = None) -> dict[str, Any]:
        self.installation_repository.update_installation(
            installation_id,
            {
                "push_token": push_token,
                "push_provider": provider,
                "platform": platform,
                "last_seen_at": datetime.now(UTC),
            },
        )
        installation = self.installation_repository.get_by_id(installation_id)
        if installation is None:
            raise AppError(code="installation_not_found", message="Installation not found.", status_code=404)
        return installation

    def list_notifications(self, installation_id: str) -> list[dict[str, Any]]:
        notifications = self.installation_notification_repository.list_by_installation(installation_id)
        return [self._serialize_installation_notification(notification) for notification in notifications]

    def create_notification_for_installation(self, installation_id: str, event_payload: dict[str, Any]) -> dict[str, Any]:
        notification_event_id = self.notification_event_repository.create_event(event_payload)
        installation_notification_id = self.installation_notification_repository.create_notification(
            {
                "installation_id": installation_id,
                "notification_event_id": notification_event_id,
            }
        )
        notification = self.installation_notification_repository.get_by_id(installation_notification_id)
        if notification is None:
            raise AppError(code="notification_create_failed", message="Failed to create notification.", status_code=500)
        return self._serialize_installation_notification(notification)

    def mark_notification_read(self, installation_id: str, notification_id: str) -> dict[str, Any]:
        notification = self.installation_notification_repository.get_by_id(notification_id)
        if notification is None or notification.get("installation_id") != installation_id:
            raise AppError(code="notification_not_found", message="Notification not found.", status_code=404)

        updated_count = self.installation_notification_repository.mark_as_read(notification_id)
        if updated_count == 0:
            raise AppError(code="notification_read_failed", message="Failed to mark notification as read.", status_code=500)

        updated_notification = self.installation_notification_repository.get_by_id(notification_id)
        if updated_notification is None:
            raise AppError(code="notification_not_found", message="Notification not found.", status_code=404)
        return self._serialize_installation_notification(updated_notification)

    def _serialize_installation_notification(self, notification: dict[str, Any]) -> dict[str, Any]:
        serialized = self._serialize_document(notification)
        event = self.notification_event_repository.get_by_id(notification["notification_event_id"])
        serialized["event"] = self._serialize_document(event) if event is not None else None
        return serialized

    def _serialize_document(self, document: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(document)
        serialized["id"] = str(serialized.pop("_id"))
        for key, value in list(serialized.items()):
            if hasattr(value, "isoformat"):
                serialized[key] = value.isoformat()
        return serialized
