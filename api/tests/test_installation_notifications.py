from datetime import UTC, datetime
from unittest import TestCase

from app.common.exceptions.base import AppError
from app.services.installation_service import InstallationService


class _InstallationNotificationRepo:
    def __init__(self, notifications):
        self.notifications = notifications
        self.marked_id = None
        self.created_payload = None

    def list_by_installation(self, installation_id):
        return [item for item in self.notifications if item["installation_id"] == installation_id]

    def get_by_id(self, notification_id):
        for item in self.notifications:
            if item["_id"] == notification_id:
                return item
        return None

    def mark_as_read(self, notification_id):
        self.marked_id = notification_id
        for item in self.notifications:
            if item["_id"] == notification_id:
                item["read_at"] = datetime(2026, 4, 25, 9, 30, tzinfo=UTC)
                return 1
        return 0

    def create_notification(self, payload):
        self.created_payload = dict(payload)
        notification = {
            "_id": "inbox-created",
            "read_at": None,
            "created_at": datetime(2026, 4, 25, 9, 45, tzinfo=UTC),
            **payload,
        }
        self.notifications.append(notification)
        return notification["_id"]


class _NotificationEventRepo:
    def __init__(self, events):
        self.events = events
        self.created_payload = None

    def get_by_id(self, event_id):
        return self.events.get(event_id)

    def create_event(self, payload):
        self.created_payload = dict(payload)
        event = {
            "_id": "event-created",
            "created_at": datetime(2026, 4, 25, 9, 45, tzinfo=UTC),
            **payload,
        }
        self.events[event["_id"]] = event
        return event["_id"]


class InstallationNotificationTest(TestCase):
    def _service(self, notifications, events):
        service = InstallationService.__new__(InstallationService)
        service.installation_notification_repository = _InstallationNotificationRepo(notifications)
        service.notification_event_repository = _NotificationEventRepo(events)
        return service

    def test_list_notifications_returns_installation_inbox_with_event_payloads(self):
        created_at = datetime(2026, 4, 25, 9, 0, tzinfo=UTC)
        service = self._service(
            notifications=[
                {
                    "_id": "inbox-1",
                    "installation_id": "installation-1",
                    "notification_event_id": "event-1",
                    "read_at": None,
                    "created_at": created_at,
                }
            ],
            events={
                "event-1": {
                    "_id": "event-1",
                    "event_type": "alert_created",
                    "blind_user_id": "blind-1",
                    "title": "Obstacle",
                    "message": "Obstacle ahead",
                    "risk_level": "warning",
                    "created_at": created_at,
                }
            },
        )

        notifications = service.list_notifications("installation-1")

        self.assertEqual(notifications[0]["id"], "inbox-1")
        self.assertIsNone(notifications[0]["read_at"])
        self.assertEqual(notifications[0]["created_at"], created_at.isoformat())
        self.assertEqual(notifications[0]["event"]["id"], "event-1")
        self.assertEqual(notifications[0]["event"]["title"], "Obstacle")
        self.assertEqual(notifications[0]["event"]["created_at"], created_at.isoformat())

    def test_mark_notification_read_requires_matching_installation(self):
        service = self._service(
            notifications=[
                {
                    "_id": "inbox-1",
                    "installation_id": "installation-2",
                    "notification_event_id": "event-1",
                    "read_at": None,
                    "created_at": datetime(2026, 4, 25, 9, 0, tzinfo=UTC),
                }
            ],
            events={},
        )

        with self.assertRaises(AppError) as error:
            service.mark_notification_read("installation-1", "inbox-1")

        self.assertEqual(error.exception.status_code, 404)

    def test_mark_notification_read_returns_updated_notification(self):
        created_at = datetime(2026, 4, 25, 9, 0, tzinfo=UTC)
        service = self._service(
            notifications=[
                {
                    "_id": "inbox-1",
                    "installation_id": "installation-1",
                    "notification_event_id": "event-1",
                    "read_at": None,
                    "created_at": created_at,
                }
            ],
            events={
                "event-1": {
                    "_id": "event-1",
                    "event_type": "alert_created",
                    "blind_user_id": "blind-1",
                    "title": "Obstacle",
                    "message": "Obstacle ahead",
                    "risk_level": "warning",
                    "created_at": created_at,
                }
            },
        )

        notification = service.mark_notification_read("installation-1", "inbox-1")

        self.assertEqual(service.installation_notification_repository.marked_id, "inbox-1")
        self.assertEqual(notification["id"], "inbox-1")
        self.assertEqual(notification["read_at"], "2026-04-25T09:30:00+00:00")

    def test_create_notification_for_installation_creates_event_and_inbox_row(self):
        service = self._service(notifications=[], events={})

        notification = service.create_notification_for_installation(
            "installation-1",
            {
                "event_type": "alert_created",
                "blind_user_id": "blind-1",
                "device_id": "device-1",
                "title": "Obstacle",
                "message": "Obstacle ahead",
                "risk_level": "warning",
            },
        )

        self.assertEqual(service.notification_event_repository.created_payload["title"], "Obstacle")
        self.assertEqual(
            service.installation_notification_repository.created_payload,
            {"installation_id": "installation-1", "notification_event_id": "event-created"},
        )
        self.assertEqual(notification["id"], "inbox-created")
        self.assertEqual(notification["event"]["id"], "event-created")
