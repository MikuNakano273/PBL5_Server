from datetime import UTC, datetime, timedelta
from unittest import TestCase

from app.common.schemas.cane import CaneAuthContext, CaneDistanceRequest
from app.services.distance_service import DistanceService


class _DistanceRepo:
    def __init__(self, latest=None):
        self.latest = latest
        self.created_payload = None

    def get_latest_for_device(self, device_id):
        return self.latest

    def create_telemetry(self, payload):
        self.created_payload = dict(payload)
        return "distance-1"


class _LiveStatusRepo:
    def __init__(self):
        self.updated = None

    def update_distance_status(self, blind_user_id, payload):
        self.updated = {"blind_user_id": blind_user_id, **payload}
        return 1


class DistanceServiceTest(TestCase):
    def _service(self, latest=None):
        service = DistanceService.__new__(DistanceService)
        service.distance_repository = _DistanceRepo(latest)
        service.user_live_status_repository = _LiveStatusRepo()
        service.sampling_min_seconds = 2
        service.sampling_delta_cm = 10
        service.alert_distance_threshold_cm = 100
        return service

    def test_ingest_distance_saves_sample_and_updates_danger_live_status(self):
        recorded_at = datetime(2026, 4, 25, 10, 10, tzinfo=UTC)
        service = self._service()
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", blind_user_id="blind-1")

        result = service.ingest_distance(
            context,
            CaneDistanceRequest(distance_cm=48, detected=True, sensor_type="ultrasonic", recorded_at=recorded_at),
        )

        self.assertTrue(result["saved"])
        self.assertEqual(result["id"], "distance-1")
        self.assertEqual(service.distance_repository.created_payload["device_id"], "device-1")
        self.assertEqual(service.distance_repository.created_payload["blind_user_id"], "blind-1")
        self.assertEqual(service.distance_repository.created_payload["distance_cm"], 48)
        self.assertEqual(service.user_live_status_repository.updated["nearest_distance_cm"], 48)
        self.assertEqual(service.user_live_status_repository.updated["current_safety_status"], "danger")
        self.assertEqual(service.user_live_status_repository.updated["last_seen_at"], recorded_at)

    def test_ingest_distance_skips_dense_sample_without_large_delta_but_updates_live_status(self):
        recorded_at = datetime(2026, 4, 25, 10, 10, tzinfo=UTC)
        service = self._service(
            latest={
                "device_id": "device-1",
                "distance_cm": 80,
                "recorded_at": recorded_at - timedelta(seconds=1),
            }
        )
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", blind_user_id="blind-1")

        result = service.ingest_distance(context, CaneDistanceRequest(distance_cm=84, recorded_at=recorded_at))

        self.assertFalse(result["saved"])
        self.assertIsNone(service.distance_repository.created_payload)
        self.assertEqual(service.user_live_status_repository.updated["nearest_distance_cm"], 84)
        self.assertEqual(service.user_live_status_repository.updated["current_safety_status"], "danger")
