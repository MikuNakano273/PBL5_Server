from datetime import UTC, datetime
from unittest import TestCase

from app.common.exceptions.base import AppError
from app.services.notification_service import NotificationService


class _NotificationEventRepo:
    def __init__(self):
        self.created_payload = None

    def create_event(self, payload):
        self.created_payload = dict(payload)
        return "event-1"


class _InstallationNotificationRepo:
    def __init__(self):
        self.created_payloads = []

    def create_notification(self, payload):
        self.created_payloads.append(dict(payload))
        return f"inbox-{len(self.created_payloads)}"


class _InstallationAccountRepo:
    def list_installation_ids_for_users(self, user_ids):
        self.user_ids = list(user_ids)
        return ["installation-user", "installation-user"]


class _InstallationRepo:
    def list_by_ids(self, installation_ids):
        self.installation_ids = list(installation_ids)
        return [
            {"_id": "installation-user", "push_token": "push-token-1", "push_provider": "fcm", "platform": "android"},
        ]


class _PushSender:
    def __init__(self):
        self.sent = []

    def send(self, installation, event):
        self.sent.append({"installation": installation["_id"], "event": event["_id"]})
        return {"sent": True}


class NotificationServiceTest(TestCase):
    def _service(self):
        service = NotificationService.__new__(NotificationService)
        service.notification_event_repository = _NotificationEventRepo()
        service.installation_notification_repository = _InstallationNotificationRepo()
        service.installation_account_repository = _InstallationAccountRepo()
        service.installation_repository = _InstallationRepo()
        service.push_sender = _PushSender()
        return service

    def test_create_system_notification_fans_out_to_related_installations_with_push_token(self):
        service = self._service()
        result = service.create_system_notification(
            user_id="user-1",
            event_type="maintenance_scheduled",
            category="system",
            title="Scheduled maintenance",
            message="The service will be unavailable from 02:00 to 02:15.",
            priority="normal",
            created_at=datetime(2026, 4, 25, 12, 0, tzinfo=UTC),
        )

        payload = service.notification_event_repository.created_payload
        self.assertEqual(payload["event_type"], "maintenance_scheduled")
        self.assertEqual(payload["category"], "system")
        self.assertEqual(payload["priority"], "normal")
        self.assertNotIn("alert_id", payload)
        self.assertNotIn("risk_level", payload)
        self.assertEqual(service.installation_account_repository.user_ids, ["user-1"])
        self.assertEqual(
            service.installation_notification_repository.created_payloads,
            [
                {"installation_id": "installation-user", "notification_event_id": "event-1"},
            ],
        )
        self.assertEqual(service.push_sender.sent, [{"installation": "installation-user", "event": "event-1"}])
        self.assertEqual(result["installation_count"], 1)
        self.assertEqual(result["push_count"], 1)

    def test_create_system_notification_rejects_alert_event_type(self):
        service = self._service()

        with self.assertRaises(AppError) as error:
            service.create_system_notification(
                user_id="user-1",
                event_type="alert_created",
                category="system",
                title="Obstacle",
                message="Obstacle ahead",
            )

        self.assertEqual(error.exception.code, "invalid_notification_event")
        self.assertIsNone(service.notification_event_repository.created_payload)
