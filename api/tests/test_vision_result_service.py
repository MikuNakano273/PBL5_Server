from unittest import TestCase

from app.common.exceptions.base import AppError
from app.common.schemas.internal import VisionResultCallbackRequest
from app.services.vision_result_service import VisionResultService


class _VisionResultRepo:
    def __init__(self):
        self.saved_payload = None

    def save_if_absent(self, payload):
        self.saved_payload = dict(payload)
        return "vision-result-1"


class _ImageRequestRepo:
    def __init__(self):
        self.documents = {
            "request-1": {
                "_id": "request-1",
                "device_id": "device-1",
                "user_id": "user-1",
                "status": "processing",
                "ai_status": "processing",
            }
        }
        self.updated = []

    def get_by_id(self, request_id):
        return self.documents.get(request_id)

    def update_request(self, request_id, payload):
        self.updated.append({"request_id": request_id, **payload})
        self.documents[request_id].update(payload)
        return 1


class _AlertService:
    def __init__(self):
        self.vision_alert_args = None

    def create_alert_from_vision_result(self, image_request, vision_result):
        self.vision_alert_args = (image_request, vision_result)
        return {"created": True, "id": "alert-1"}


class VisionResultServiceTest(TestCase):
    def _service(self):
        service = VisionResultService.__new__(VisionResultService)
        service.vision_result_repository = _VisionResultRepo()
        service.image_request_repository = _ImageRequestRepo()
        service.alert_service = _AlertService()
        service.alert_distance_threshold_cm = 100
        return service

    def test_save_worker_result_persists_result_and_marks_image_request_done(self):
        service = self._service()
        payload = VisionResultCallbackRequest(
            request_id="request-1",
            model_name="yolov8s",
            model_version="1.0",
            objects=[
                {"label": "chair", "confidence": 0.91},
                {"label": "person", "confidence": 0.82},
            ],
            nearest_obstacle_cm=65,
            risk_level="low",
            summary_text="",
        )

        result = service.save_worker_result(payload)

        saved = service.vision_result_repository.saved_payload
        self.assertEqual(result["id"], "vision-result-1")
        self.assertEqual(saved["image_request_id"], "request-1")
        self.assertEqual(saved["user_id"], "user-1")
        self.assertEqual(saved["risk_level"], "high")
        self.assertIn("chair", saved["summary_text"])
        self.assertIn("65", saved["summary_text"])
        self.assertEqual(service.image_request_repository.updated[-1]["status"], "done")
        self.assertEqual(service.image_request_repository.updated[-1]["ai_status"], "done")
        self.assertIsNone(service.image_request_repository.updated[-1]["error_message"])
        self.assertEqual(service.alert_service.vision_alert_args[0]["_id"], "request-1")
        self.assertEqual(service.alert_service.vision_alert_args[1]["risk_level"], "high")

    def test_save_worker_result_rejects_unknown_request(self):
        service = self._service()
        payload = VisionResultCallbackRequest(
            request_id="missing-request",
            model_name="yolov8s",
            model_version="1.0",
            risk_level="low",
        )

        with self.assertRaises(AppError) as error:
            service.save_worker_result(payload)

        self.assertEqual(error.exception.status_code, 404)

    def test_derives_low_risk_and_clear_summary_when_no_obstacle_detected(self):
        service = self._service()

        risk_level = service.derive_risk_level([], None)
        summary_text = service.build_summary_text([], None)

        self.assertEqual(risk_level, "low")
        self.assertEqual(summary_text, "No obstacle detected.")
