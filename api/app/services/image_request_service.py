from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.common.exceptions.base import AppError
from app.common.schemas.cane import CaneAuthContext, CaneImageRequestCreate, CaneImageUploadRequest
from app.core.database import get_database
from app.repositories.image_request_repository import ImageRequestRepository
from app.services.storage_service import StorageService
from app.services.vision_queue_service import VisionQueueService


class ImageRequestService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.image_request_repository = ImageRequestRepository(database)
        self.storage_service = StorageService()
        self.vision_queue_service = VisionQueueService()

    def create_image_request(self, cane_context: CaneAuthContext, payload: CaneImageRequestCreate) -> dict[str, Any]:
        now = datetime.now(UTC)
        request_payload = {
            "request_code": f"img_{uuid4().hex}",
            "device_id": cane_context.device_id,
            "blind_user_id": cane_context.blind_user_id,
            "captured_at": payload.captured_at or now,
            "distance_cm": payload.distance_cm,
            "gps_snapshot": payload.gps_snapshot,
            "image_path": None,
            "status": "created",
            "ai_status": "created",
            "error_message": None,
            "metadata": payload.metadata,
            "created_at": now,
            "updated_at": now,
        }
        request_id = self.image_request_repository.create_request(request_payload)
        request = self.image_request_repository.get_by_id(request_id)
        if request is None:
            raise AppError(code="image_request_create_failed", message="Failed to create image request.", status_code=500)
        return self._serialize_request(request)

    def attach_uploaded_image(
        self,
        cane_context: CaneAuthContext,
        request_id: str,
        payload: CaneImageUploadRequest,
    ) -> dict[str, Any]:
        request = self._get_owned_request(request_id, cane_context)
        if request.get("status") in {"processing", "done"} or request.get("ai_status") in {"processing", "done"}:
            return self._serialize_request(request)

        image_path = payload.image_path
        upload_url = None
        if image_path is None:
            image_path = self.storage_service.build_raw_image_key(cane_context.blind_user_id, cane_context.device_id, request_id)
            upload_url = self.storage_service.get_presigned_upload_url(image_path)

        self.image_request_repository.update_request(
            request_id,
            {
                "image_path": image_path,
                "status": "uploaded",
                "ai_status": "queued",
                "updated_at": datetime.now(UTC),
            },
        )
        updated_request = self.image_request_repository.get_by_id(request_id)
        if updated_request is None:
            raise AppError(code="image_request_not_found", message="Image request not found.", status_code=404)
        queue_result = None
        if hasattr(self, "vision_queue_service"):
            queue_result = self.vision_queue_service.enqueue_vision_job(updated_request)
        serialized = self._serialize_request(updated_request)
        if upload_url is not None:
            serialized["upload_url"] = upload_url
        if queue_result is not None:
            serialized["vision_job"] = {"job_id": queue_result["job_id"], "queue": queue_result["queue"]}
        return serialized

    def mark_processing(self, request_id: str) -> dict[str, Any]:
        return self._mark_state(request_id, status="processing", ai_status="processing")

    def mark_done(self, request_id: str) -> dict[str, Any]:
        return self._mark_state(request_id, status="done", ai_status="done")

    def mark_failed(self, request_id: str, reason: str) -> dict[str, Any]:
        return self._mark_state(request_id, status="failed", ai_status="failed", error_message=reason)

    def _mark_state(
        self,
        request_id: str,
        *,
        status: str,
        ai_status: str,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        payload = {"status": status, "ai_status": ai_status, "updated_at": datetime.now(UTC)}
        if error_message is not None:
            payload["error_message"] = error_message
        self.image_request_repository.update_request(request_id, payload)
        return self._get_serialized_request_or_raise(request_id)

    def _get_owned_request(self, request_id: str, cane_context: CaneAuthContext) -> dict[str, Any]:
        request = self.image_request_repository.get_by_id(request_id)
        if request is None or request.get("device_id") != cane_context.device_id:
            raise AppError(code="image_request_not_found", message="Image request not found.", status_code=404)
        return request

    def _get_serialized_request_or_raise(self, request_id: str) -> dict[str, Any]:
        request = self.image_request_repository.get_by_id(request_id)
        if request is None:
            raise AppError(code="image_request_not_found", message="Image request not found.", status_code=404)
        return self._serialize_request(request)

    def _serialize_request(self, request: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(request)
        serialized["id"] = str(serialized.pop("_id"))
        for key, value in list(serialized.items()):
            if hasattr(value, "isoformat"):
                serialized[key] = value.isoformat()
        return serialized
