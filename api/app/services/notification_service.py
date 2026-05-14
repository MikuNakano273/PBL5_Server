from datetime import UTC, datetime
from typing import Any

from app.core.database import get_database
from app.repositories.installation_account_repository import InstallationAccountRepository
from app.repositories.installation_notification_repository import InstallationNotificationRepository
from app.repositories.mobile_installation_repository import MobileInstallationRepository
from app.repositories.notification_event_repository import NotificationEventRepository
from app.services.push_notification_service import PushNotificationService


class NotificationService:
    def __init__(self, database=None, push_sender: PushNotificationService | None = None) -> None:
        database = database if database is not None else get_database()
        self.notification_event_repository = NotificationEventRepository(database)
        self.installation_notification_repository = InstallationNotificationRepository(database)
        self.installation_account_repository = InstallationAccountRepository(database)
        self.installation_repository = MobileInstallationRepository(database)
        self.push_sender = push_sender or PushNotificationService()

    def create_notification_event_from_alert(self, alert: dict[str, Any]) -> dict[str, Any]:
        created_at = alert.get("triggered_at") or datetime.now(UTC)
        event_payload = {
            "event_type": "alert_created",
            "alert_id": str(alert["_id"]),
            "user_id": alert["user_id"],
            "device_id": alert.get("device_id"),
            "title": alert["title"],
            "message": alert["message"],
            "risk_level": alert["risk_level"],
            "created_at": created_at,
        }
        event_id = self.notification_event_repository.create_event(event_payload)
        event = {"_id": event_id, **event_payload}
        fanout = self.fanout_notification_to_installations(event)
        return {"event_id": event_id, **fanout}

    def fanout_notification_to_installations(self, event: dict[str, Any]) -> dict[str, Any]:
        installation_ids = self._related_installation_ids(event["user_id"])
        installations = self.installation_repository.list_by_ids(installation_ids)
        installation_by_id = {str(installation["_id"]): installation for installation in installations}

        notification_ids = []
        push_count = 0
        for installation_id in installation_ids:
            notification_id = self.installation_notification_repository.create_notification(
                {
                    "installation_id": installation_id,
                    "notification_event_id": str(event["_id"]),
                }
            )
            notification_ids.append(notification_id)

            installation = installation_by_id.get(installation_id)
            if installation is not None and installation.get("push_token"):
                push_result = self.push_sender.send(installation, event)
                if push_result.get("sent"):
                    push_count += 1

        return {
            "installation_count": len(notification_ids),
            "notification_ids": notification_ids,
            "push_count": push_count,
        }

    def _related_installation_ids(self, user_id: str) -> list[str]:
        installation_ids = self.installation_account_repository.list_installation_ids_for_users([user_id])
        return list(dict.fromkeys(installation_ids))
