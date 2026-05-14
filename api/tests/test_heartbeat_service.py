from datetime import UTC, datetime
from unittest import TestCase

from app.common.schemas.cane import CaneAuthContext, CaneHeartbeatRequest
from app.services.heartbeat_service import HeartbeatService


class _DeviceRepo:
    def __init__(self):
        self.updated = None

    def update_heartbeat(self, device_id, payload):
        self.updated = {"device_id": device_id, **payload}
        return 1


class _LiveStatusRepo:
    def __init__(self):
        self.updated = None

    def update_last_seen(self, blind_user_id, payload):
        self.updated = {"blind_user_id": blind_user_id, **payload}
        return 1


class HeartbeatServiceTest(TestCase):
    def test_heartbeat_updates_device_and_live_status_last_seen_at(self):
        service = HeartbeatService.__new__(HeartbeatService)
        service.device_repository = _DeviceRepo()
        service.user_live_status_repository = _LiveStatusRepo()
        seen_at = datetime(2026, 4, 25, 10, 20, tzinfo=UTC)
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")

        result = service.record_heartbeat(context, CaneHeartbeatRequest(battery=87, firmware_version="1.0.1", seen_at=seen_at))

        self.assertEqual(result["device_id"], "device-1")
        self.assertEqual(result["last_seen_at"], seen_at.isoformat())
        self.assertEqual(service.device_repository.updated["device_id"], "device-1")
        self.assertEqual(service.device_repository.updated["last_seen_at"], seen_at)
        self.assertEqual(service.device_repository.updated["last_battery"], 87)
        self.assertEqual(service.device_repository.updated["firmware_version"], "1.0.1")
        self.assertEqual(service.device_repository.updated["status"], "online")
        self.assertEqual(service.user_live_status_repository.updated["blind_user_id"], "blind-1")
        self.assertEqual(service.user_live_status_repository.updated["device_id"], "device-1")
        self.assertEqual(service.user_live_status_repository.updated["last_seen_at"], seen_at)
