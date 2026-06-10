from datetime import UTC, datetime, timedelta
from unittest import TestCase

from app.services.alert_service import AlertService


class _AlertRepo:
    def __init__(self, duplicate=None):
        self.duplicate = duplicate
        self.created_payload = None
        self.duplicate_query = None

    def find_recent_duplicate(self, user_id, device_id, alert_type, since, image_request_id=None):
        self.duplicate_query = {
            "user_id": user_id,
            "device_id": device_id,
            "alert_type": alert_type,
            "since": since,
            "image_request_id": image_request_id,
        }
        return self.duplicate

    def create_alert(self, payload):
        self.created_payload = dict(payload)
        return "alert-1"


class _LiveStatusRepo:
    def __init__(self):
        self.updated = None

    def update_alert_status(self, user_id, payload):
        self.updated = {"user_id": user_id, **payload}
        return 1


class AlertServiceTest(TestCase):
    def _service(self, duplicate=None):
        service = AlertService.__new__(AlertService)
        service.alert_repository = _AlertRepo(duplicate)
        service.user_live_status_repository = _LiveStatusRepo()
        service.dedup_window_seconds = 300
        return service

    def test_create_alert_from_vision_result_creates_alert_and_updates_live_status(self):
        service = self._service()
        image_request = {
            "_id": "request-1",
            "user_id": "user-1",
            "device_id": "device-1",
            "gps_snapshot": {"lat": 16.0544, "lng": 108.2022},
        }
        vision_result = {
            "risk_level": "high",
            "summary_text": "Detected chair. Nearest obstacle 65 cm.",
            "nearest_obstacle_cm": 65,
            "processed_at": datetime(2026, 4, 25, 11, 0, tzinfo=UTC),
        }

        alert = service.create_alert_from_vision_result(image_request, vision_result)

        payload = service.alert_repository.created_payload
        self.assertTrue(alert["created"])
        self.assertEqual(alert["id"], "alert-1")
        self.assertEqual(payload["alert_type"], "vision_obstacle")
        self.assertEqual(payload["image_request_id"], "request-1")
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["lat"], 16.0544)
        self.assertEqual(payload["lng"], 108.2022)
        self.assertEqual(payload["distance_cm"], 65)
        self.assertEqual(service.user_live_status_repository.updated["current_safety_status"], "danger")
        self.assertEqual(service.user_live_status_repository.updated["last_alert_at"], vision_result["processed_at"])
        self.assertNotIn("notification", alert)

    def test_create_alert_from_distance_dedups_recent_open_alert(self):
        duplicate = {"_id": "alert-existing", "alert_type": "distance_danger"}
        service = self._service(duplicate)
        recorded_at = datetime(2026, 4, 25, 11, 5, tzinfo=UTC)

        alert = service.create_alert_from_distance(
            user_id="user-1",
            device_id="device-1",
            distance_cm=48,
            recorded_at=recorded_at,
        )

        self.assertFalse(alert["created"])
        self.assertTrue(alert["deduplicated"])
        self.assertEqual(alert["id"], "alert-existing")
        self.assertIsNone(service.alert_repository.created_payload)
        self.assertEqual(service.alert_repository.duplicate_query["since"], recorded_at - timedelta(seconds=300))

    def test_create_alert_from_offline_device_marks_live_status_offline(self):
        service = self._service()
        detected_at = datetime(2026, 4, 25, 11, 10, tzinfo=UTC)

        alert = service.create_alert_from_offline_device(
            user_id="user-1",
            device_id="device-1",
            detected_at=detected_at,
        )

        payload = service.alert_repository.created_payload
        self.assertTrue(alert["created"])
        self.assertEqual(payload["alert_type"], "device_offline")
        self.assertEqual(payload["risk_level"], "warning")
        self.assertEqual(service.user_live_status_repository.updated["current_safety_status"], "offline")
        self.assertEqual(service.user_live_status_repository.updated["last_alert_at"], detected_at)

    def test_create_test_alert_creates_high_risk_obstacle_without_dedup(self):
        service = self._service(duplicate={"_id": "alert-existing"})

        alert = service.create_test_alert(user_id="user-1", device_id="device-1")

        payload = service.alert_repository.created_payload
        self.assertTrue(alert["created"])
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["alert_type"], "OBSTACLE")
        self.assertEqual(service.user_live_status_repository.updated["current_safety_status"], "danger")
        self.assertIsNone(service.alert_repository.duplicate_query)
