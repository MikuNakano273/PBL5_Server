import asyncio
from unittest import TestCase

from app.api.deps import get_current_internal_context
from app.api.routers.internal import retry_vision_request, submit_vision_result
from app.common.exceptions.base import AppError
from app.common.schemas.internal import VisionResultCallbackRequest


class _Settings:
    internal_worker_token = "secret-token"


class _InternalVisionService:
    def __init__(self):
        self.result_payload = None
        self.retry_id = None

    def accept_result(self, payload):
        self.result_payload = payload
        return {"status": "accepted", "request_id": payload.request_id}

    def retry_request(self, request_id):
        self.retry_id = request_id
        return {"status": "queued", "request_id": request_id, "job_id": "rq-job-1"}


class InternalApiTest(TestCase):
    def test_internal_auth_accepts_bearer_worker_token(self):
        context = get_current_internal_context(authorization="Bearer secret-token", settings=_Settings())

        self.assertEqual(context["auth_type"], "internal_worker")

    def test_internal_auth_rejects_wrong_token(self):
        with self.assertRaises(AppError) as error:
            get_current_internal_context(authorization="Bearer wrong", settings=_Settings())

        self.assertEqual(error.exception.status_code, 401)

    def test_submit_vision_result_requires_internal_context_and_delegates(self):
        service = _InternalVisionService()
        body = VisionResultCallbackRequest(
            request_id="request-1",
            model_name="yolov8s",
            model_version="1.0",
            objects=[],
            nearest_obstacle_cm=80,
            risk_level="high",
            summary_text="Detected chair",
        )

        response = asyncio.run(submit_vision_result(body, {"auth_type": "internal_worker"}, service))

        self.assertEqual(response, {"status": "accepted", "request_id": "request-1"})
        self.assertEqual(service.result_payload.request_id, "request-1")

    def test_retry_vision_request_delegates_to_internal_service(self):
        service = _InternalVisionService()

        response = asyncio.run(retry_vision_request("request-1", {"auth_type": "internal_worker"}, service))

        self.assertEqual(response["status"], "queued")
        self.assertEqual(service.retry_id, "request-1")
