from datetime import UTC, datetime
from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.internal import VisionResultCallbackRequest
from app.core.database import get_database
from app.repositories.image_request_repository import ImageRequestRepository
from app.services.vision_result_service import VisionResultService
from app.services.vision_queue_service import VisionQueueService


class InternalVisionService:
    def __init__(
        self,
        database=None,
        vision_queue_service: VisionQueueService | None = None,
        vision_result_service: VisionResultService | None = None,
    ) -> None:
        database = database if database is not None else get_database()
        self.image_request_repository = ImageRequestRepository(database)
        self.vision_queue_service = vision_queue_service or VisionQueueService()
        self.vision_result_service = vision_result_service or VisionResultService(database)

    def accept_result(self, payload: VisionResultCallbackRequest) -> dict[str, Any]:
        result = self.vision_result_service.save_worker_result(payload)
        return {"status": "accepted", **result}

    def retry_request(self, request_id: str) -> dict[str, Any]:
        image_request = self.image_request_repository.get_by_id(request_id)
        if image_request is None:
            raise AppError(code="image_request_not_found", message="Image request not found.", status_code=404)
        if not image_request.get("image_path"):
            raise AppError(code="image_request_image_missing", message="Image request has no uploaded image.", status_code=409)

        self.image_request_repository.update_request(
            request_id,
            {
                "status": "queued",
                "ai_status": "queued",
                "error_message": None,
                "updated_at": datetime.now(UTC),
            },
        )
        queued = self.vision_queue_service.enqueue_vision_job(image_request)
        return {
            "status": "queued",
            "request_id": request_id,
            "job_id": queued["job_id"],
            "queue": queued["queue"],
        }
