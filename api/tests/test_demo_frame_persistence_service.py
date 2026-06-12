from datetime import UTC, datetime
from unittest import TestCase

from app.services.demo_frame_persistence_service import DemoFramePersistenceService


class _DeviceRepo:
    def get_by_device_code(self, device_code):
        if device_code != "pbl5-01":
            return None
        return {"_id": "device-1", "owner_user_id": "user-1"}


class _ImageRequestRepo:
    def __init__(self):
        self.created = None

    def create_request(self, payload):
        self.created = payload
        return "request-1"

    def get_by_id(self, request_id):
        return {"_id": request_id, **self.created}

    def get_by_request_code(self, request_code):
        return None


class _VisionResultRepo:
    def __init__(self):
        self.created = None

    def save_if_absent(self, payload):
        self.created = payload
        return "vision-1"


class _AlertService:
    def __init__(self):
        self.created = None

    def create_alert_from_vision_result(self, image_request, vision_result):
        self.created = {"image_request": image_request, "vision_result": vision_result}
        return {"created": True, "id": "alert-1"}


class DemoFramePersistenceServiceTest(TestCase):
    def _service(self):
        service = DemoFramePersistenceService.__new__(DemoFramePersistenceService)
        service.device_repository = _DeviceRepo()
        service.image_request_repository = _ImageRequestRepo()
        service.vision_result_repository = _VisionResultRepo()
        service.alert_service = _AlertService()
        return service

    def test_persist_frame_creates_done_image_request_with_demo_image_url(self):
        service = self._service()
        created_at = datetime(2026, 6, 10, 8, 0, tzinfo=UTC)

        result = service.persist_frame(
            device_code="pbl5-01",
            frame_id="frame_45",
            image_url="/uploads/frame_45.jpg",
            created_at=created_at,
            sensor={"distance_cm": 72.4, "gps": {"fix": True, "lat": 16.0, "lng": 108.0}},
            yolo_result={"objects": [{"label": "person", "confidence": 0.91}]},
            scene_context={"type": "person", "risk_level": "warning", "confidence": 0.91},
        )

        request = service.image_request_repository.created
        self.assertEqual(result["image_request_id"], "request-1")
        self.assertEqual(request["device_id"], "device-1")
        self.assertEqual(request["user_id"], "user-1")
        self.assertEqual(request["image_url"], "/uploads/frame_45.jpg")
        self.assertEqual(request["status"], "done")
        self.assertEqual(request["ai_status"], "done")
        self.assertEqual(request["metadata"]["scene_context"]["type"], "person")
        self.assertEqual(service.vision_result_repository.created["image_request_id"], "request-1")
        self.assertEqual(service.vision_result_repository.created["risk_level"], "warning")

    def test_persist_frame_creates_alert_with_scene_context_for_warning(self):
        service = self._service()

        result = service.persist_frame(
            device_code="pbl5-01",
            frame_id="frame_45",
            image_url="/uploads/frame_45.jpg",
            created_at=datetime(2026, 6, 10, 8, 0, tzinfo=UTC),
            sensor={"distance_cm": 72.4, "gps": {"fix": True, "lat": 16.0, "lng": 108.0}},
            yolo_result={"objects": [{"label": "person", "confidence": 0.91}]},
            scene_context={"type": "person", "risk_level": "warning", "confidence": 0.91},
        )

        vision_result = service.alert_service.created["vision_result"]
        self.assertTrue(result["alert"]["created"])
        self.assertEqual(vision_result["risk_level"], "warning")
        self.assertEqual(vision_result["scene_type"], "person")
        self.assertEqual(vision_result["confidence"], 0.91)
        self.assertEqual(vision_result["nearest_obstacle_cm"], 72.4)

    def test_persist_frame_skips_unknown_device(self):
        service = self._service()

        result = service.persist_frame(
            device_code="unknown",
            frame_id="frame_45",
            image_url="/uploads/frame_45.jpg",
            created_at=datetime(2026, 6, 10, 8, 0, tzinfo=UTC),
            sensor=None,
            yolo_result={"objects": []},
            scene_context={"type": "clear", "risk_level": "clear", "confidence": 0},
        )

        self.assertEqual(result, {"persisted": False, "reason": "device_not_found"})
