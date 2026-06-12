from unittest import TestCase

from app.services.demo_sensor_persistence_service import DemoSensorPersistenceService


class _DeviceRepo:
    def __init__(self):
        self.heartbeat = None

    def get_by_device_code(self, device_code):
        if device_code != "pbl5-01":
            return None
        return {"_id": "device-1", "owner_user_id": "user-1"}

    def update_heartbeat(self, device_id, payload):
        self.heartbeat = {"device_id": device_id, **payload}
        return 1


class _DistanceRepo:
    def __init__(self):
        self.payload = None

    def create_telemetry(self, payload):
        self.payload = payload
        return "distance-1"


class _GpsRepo:
    def __init__(self):
        self.payload = None

    def create_log(self, payload):
        self.payload = payload
        return "gps-1"


class _LiveStatusRepo:
    def __init__(self):
        self.distance = None
        self.location = None
        self.last_seen = None

    def update_distance_status(self, user_id, payload):
        self.distance = {"user_id": user_id, **payload}

    def update_location(self, user_id, payload):
        self.location = {"user_id": user_id, **payload}

    def update_last_seen(self, user_id, payload):
        self.last_seen = {"user_id": user_id, **payload}


class DemoSensorPersistenceServiceTest(TestCase):
    def _service(self):
        service = DemoSensorPersistenceService.__new__(DemoSensorPersistenceService)
        service.device_repository = _DeviceRepo()
        service.distance_repository = _DistanceRepo()
        service.gps_repository = _GpsRepo()
        service.user_live_status_repository = _LiveStatusRepo()
        return service

    def test_persist_sensor_saves_every_signal_and_marks_device_online(self):
        service = self._service()

        result = service.persist_sensor(
            {
                "device_id": "pbl5-01",
                "seq": 92,
                "millis": 123456,
                "distance_cm": 269.4,
                "distance_valid": True,
                "obstacle_in_1m": False,
                "alert_level": "clear",
                "gps": {"fix": False, "lat": 16.047079, "lng": 108.20623, "sats": 0},
            }
        )

        self.assertTrue(result["persisted"])
        self.assertEqual(service.distance_repository.payload["seq"], 92)
        self.assertEqual(service.distance_repository.payload["distance_cm"], 269.4)
        self.assertEqual(service.gps_repository.payload["lat"], 16.047079)
        self.assertFalse(service.gps_repository.payload["fix"])
        self.assertEqual(service.device_repository.heartbeat["status"], "online")
        self.assertIsNotNone(service.device_repository.heartbeat["last_seen_at"])

    def test_persist_sensor_skips_unknown_device(self):
        service = self._service()

        result = service.persist_sensor({"device_id": "unknown"})

        self.assertEqual(result, {"persisted": False, "reason": "device_not_found"})
