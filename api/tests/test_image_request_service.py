from datetime import UTC, datetime
from unittest import TestCase

from app.common.exceptions.base import AppError
from app.common.schemas.cane import CaneAuthContext, CaneImageRequestCreate, CaneImageUploadRequest
from app.services.image_request_service import ImageRequestService


class _ImageRequestRepo:
    def __init__(self):
        self.created_payload = None
        self.documents = {}
        self.updated = []

    def create_request(self, payload):
        self.created_payload = dict(payload)
        request_id = "request-1"
        self.documents[request_id] = {"_id": request_id, **payload}
        return request_id

    def get_by_id(self, request_id):
        return self.documents.get(request_id)

    def update_request(self, request_id, payload):
        self.updated.append({"request_id": request_id, **payload})
        if request_id not in self.documents:
            return 0
        self.documents[request_id].update(payload)
        return 1


class ImageRequestServiceTest(TestCase):
    def _service(self):
        service = ImageRequestService.__new__(ImageRequestService)
        service.image_request_repository = _ImageRequestRepo()
        return service

    def test_create_image_request_stores_created_state_for_cane_device(self):
        service = self._service()
        captured_at = datetime(2026, 4, 25, 10, 30, tzinfo=UTC)
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")

        request = service.create_image_request(
            context,
            CaneImageRequestCreate(
                captured_at=captured_at,
                distance_cm=64,
                gps_snapshot={"lat": 16.0544, "lng": 108.2022, "accuracy": 5},
                metadata={"source": "button"},
            ),
        )

        self.assertEqual(request["id"], "request-1")
        self.assertEqual(request["device_id"], "device-1")
        self.assertEqual(request["user_id"], "user-1")
        self.assertEqual(request["status"], "created")
        self.assertEqual(request["ai_status"], "created")
        self.assertTrue(request["request_code"].startswith("img_"))
        self.assertEqual(service.image_request_repository.created_payload["captured_at"], captured_at)

    def test_attach_uploaded_image_marks_request_uploaded_and_queued(self):
        service = self._service()
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")
        created = service.create_image_request(context, CaneImageRequestCreate())

        updated = service.attach_uploaded_image(
            context,
            created["id"],
            CaneImageUploadRequest(image_path="raw/device-1/request-1.jpg"),
        )

        self.assertEqual(updated["image_path"], "raw/device-1/request-1.jpg")
        self.assertEqual(updated["status"], "uploaded")
        self.assertEqual(updated["ai_status"], "queued")
        self.assertEqual(service.image_request_repository.updated[-1]["status"], "uploaded")
        self.assertEqual(service.image_request_repository.updated[-1]["ai_status"], "queued")

    def test_attach_uploaded_image_rejects_other_device_request(self):
        service = self._service()
        owner_context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")
        other_context = CaneAuthContext(device_id="device-2", device_code="STICK-002", user_id="user-1")
        created = service.create_image_request(owner_context, CaneImageRequestCreate())

        with self.assertRaises(AppError) as error:
            service.attach_uploaded_image(other_context, created["id"], CaneImageUploadRequest(image_path="raw/x.jpg"))

        self.assertEqual(error.exception.status_code, 404)

    def test_worker_state_methods_cover_processing_done_and_failed(self):
        service = self._service()
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", user_id="user-1")
        created = service.create_image_request(context, CaneImageRequestCreate())
        service.attach_uploaded_image(context, created["id"], CaneImageUploadRequest(image_path="raw/device-1/request-1.jpg"))

        processing = service.mark_processing(created["id"])
        done = service.mark_done(created["id"])
        failed = service.mark_failed(created["id"], "model timeout")

        self.assertEqual(processing["status"], "processing")
        self.assertEqual(processing["ai_status"], "processing")
        self.assertEqual(done["status"], "done")
        self.assertEqual(done["ai_status"], "done")
        self.assertEqual(failed["status"], "failed")
        self.assertEqual(failed["ai_status"], "failed")
        self.assertEqual(failed["error_message"], "model timeout")
