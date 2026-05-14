from datetime import UTC, datetime
from unittest import TestCase

from app.common.schemas.cane import CaneAuthContext, CaneGpsRequest
from app.services.gps_service import GpsService


class _GpsRepo:
    def __init__(self):
        self.created_payload = None

    def create_log(self, payload):
        self.created_payload = dict(payload)
        return "gps-1"


class _LiveStatusRepo:
    def __init__(self):
        self.updated = None

    def update_location(self, blind_user_id, payload):
        self.updated = {"blind_user_id": blind_user_id, **payload}
        return 1


class GpsServiceTest(TestCase):
    def test_ingest_gps_saves_log_and_updates_live_status_location(self):
        service = GpsService.__new__(GpsService)
        service.gps_repository = _GpsRepo()
        service.user_live_status_repository = _LiveStatusRepo()
        recorded_at = datetime(2026, 4, 25, 10, 0, tzinfo=UTC)
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")

        result = service.ingest_gps(
            context,
            CaneGpsRequest(
                lat=16.0544,
                lng=108.2022,
                accuracy=5.5,
                speed=1.2,
                heading=90,
                recorded_at=recorded_at,
            ),
        )

        expected_location = {"type": "Point", "coordinates": [108.2022, 16.0544]}
        self.assertEqual(result["id"], "gps-1")
        self.assertEqual(result["location"], expected_location)
        self.assertEqual(service.gps_repository.created_payload["device_id"], "device-1")
        self.assertEqual(service.gps_repository.created_payload["blind_user_id"], "blind-1")
        self.assertEqual(service.gps_repository.created_payload["location"], expected_location)
        self.assertEqual(service.gps_repository.created_payload["recorded_at"], recorded_at)
        self.assertEqual(service.user_live_status_repository.updated["blind_user_id"], "blind-1")
        self.assertEqual(service.user_live_status_repository.updated["device_id"], "device-1")
        self.assertEqual(service.user_live_status_repository.updated["last_location"], expected_location)
        self.assertEqual(service.user_live_status_repository.updated["last_seen_at"], recorded_at)
