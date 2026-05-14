from datetime import UTC, datetime
from unittest import TestCase

from app.common.schemas.internal import VisionResultCallbackRequest
from app.services.alert_service import AlertService
from app.services.notification_service import NotificationService
from app.services.vision_result_service import VisionResultService


class _ImageRepo:
    def __init__(self):
        self.updated = []
        self.request = {
            "_id": "request-1",
            "blind_user_id": "blind-1",
            "device_id": "device-1",
            "status": "processing",
            "ai_status": "processing",
            "gps_snapshot": {"lat": 16.0544, "lng": 108.2022},
        }

    def get_by_id(self, request_id):
        return self.request if request_id == "request-1" else None

    def update_request(self, request_id, payload):
        self.updated.append({"request_id": request_id, **payload})
        self.request.update(payload)
        return 1


class _VisionRepo:
    def __init__(self):
        self.saved = None

    def save_if_absent(self, payload):
        self.saved = dict(payload)
        return "vision-1"


class _AlertRepo:
    def __init__(self):
        self.created = None

    def find_recent_duplicate(self, *args, **kwargs):
        return None

    def create_alert(self, payload):
        self.created = dict(payload)
        return "alert-1"


class _LiveStatusRepo:
    def __init__(self):
        self.updated = None

    def update_alert_status(self, blind_user_id, payload):
        self.updated = {"blind_user_id": blind_user_id, **payload}
        return 1


class _EventRepo:
    def __init__(self):
        self.created = None

    def create_event(self, payload):
        self.created = dict(payload)
        return "event-1"


class _InboxRepo:
    def __init__(self):
        self.created = []

    def create_notification(self, payload):
        self.created.append(dict(payload))
        return f"inbox-{len(self.created)}"


class _AccountRepo:
    def list_installation_ids_for_users(self, user_ids):
        return ["installation-blind", "installation-family"]


class _CareLinkRepo:
    def list_active_family_user_ids(self, blind_user_id):
        return ["family-1"]


class _InstallationRepo:
    def list_by_ids(self, installation_ids):
        return [
            {"_id": "installation-blind", "push_token": "push-token-1", "push_provider": "fcm"},
            {"_id": "installation-family", "push_token": None, "push_provider": None},
        ]


class _PushSender:
    def __init__(self):
        self.sent = []

    def send(self, installation, event):
        self.sent.append((installation["_id"], event["_id"]))
        return {"sent": True}


class DeviceToAlertNotificationFlowTest(TestCase):
    def test_worker_callback_creates_alert_notification_inbox_and_push_for_related_installations(self):
        notification_service = NotificationService.__new__(NotificationService)
        notification_service.notification_event_repository = _EventRepo()
        notification_service.installation_notification_repository = _InboxRepo()
        notification_service.installation_account_repository = _AccountRepo()
        notification_service.care_link_repository = _CareLinkRepo()
        notification_service.installation_repository = _InstallationRepo()
        notification_service.push_sender = _PushSender()

        alert_service = AlertService.__new__(AlertService)
        alert_service.alert_repository = _AlertRepo()
        alert_service.user_live_status_repository = _LiveStatusRepo()
        alert_service.notification_service = notification_service
        alert_service.dedup_window_seconds = 300

        vision_service = VisionResultService.__new__(VisionResultService)
        vision_service.image_request_repository = _ImageRepo()
        vision_service.vision_result_repository = _VisionRepo()
        vision_service.alert_service = alert_service
        vision_service.alert_distance_threshold_cm = 100

        response = vision_service.save_worker_result(
            VisionResultCallbackRequest(
                request_id="request-1",
                model_name="yolov8s",
                model_version="1.0",
                objects=[{"label": "chair", "confidence": 0.9}],
                nearest_obstacle_cm=65,
                risk_level="low",
                summary_text="",
            )
        )

        self.assertEqual(response["risk_level"], "high")
        self.assertEqual(vision_service.image_request_repository.updated[-1]["status"], "done")
        self.assertEqual(alert_service.alert_repository.created["image_request_id"], "request-1")
        self.assertEqual(notification_service.notification_event_repository.created["alert_id"], "alert-1")
        self.assertEqual(len(notification_service.installation_notification_repository.created), 2)
        self.assertEqual(notification_service.push_sender.sent, [("installation-blind", "event-1")])
