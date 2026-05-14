from datetime import UTC, datetime
from unittest import TestCase

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
        return ["installation-blind", "installation-family", "installation-family"]


class _CareLinkRepo:
    def list_active_family_user_ids(self, blind_user_id):
        self.blind_user_id = blind_user_id
        return ["family-1"]


class _InstallationRepo:
    def list_by_ids(self, installation_ids):
        self.installation_ids = list(installation_ids)
        return [
            {"_id": "installation-blind", "push_token": "push-token-1", "push_provider": "fcm", "platform": "android"},
            {"_id": "installation-family", "push_token": None, "push_provider": None, "platform": "ios"},
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
        service.care_link_repository = _CareLinkRepo()
        service.installation_repository = _InstallationRepo()
        service.push_sender = _PushSender()
        return service

    def test_create_event_and_fanout_alert_to_related_installations_with_push_token(self):
        service = self._service()
        alert = {
            "_id": "alert-1",
            "blind_user_id": "blind-1",
            "device_id": "device-1",
            "alert_type": "vision_obstacle",
            "title": "Obstacle detected",
            "message": "Detected chair. Nearest obstacle 65 cm.",
            "risk_level": "high",
            "triggered_at": datetime(2026, 4, 25, 12, 0, tzinfo=UTC),
        }

        result = service.create_notification_event_from_alert(alert)

        self.assertEqual(service.notification_event_repository.created_payload["alert_id"], "alert-1")
        self.assertEqual(service.notification_event_repository.created_payload["event_type"], "alert_created")
        self.assertEqual(service.installation_account_repository.user_ids, ["blind-1", "family-1"])
        self.assertEqual(
            service.installation_notification_repository.created_payloads,
            [
                {"installation_id": "installation-blind", "notification_event_id": "event-1"},
                {"installation_id": "installation-family", "notification_event_id": "event-1"},
            ],
        )
        self.assertEqual(service.push_sender.sent, [{"installation": "installation-blind", "event": "event-1"}])
        self.assertEqual(result["installation_count"], 2)
        self.assertEqual(result["push_count"], 1)
