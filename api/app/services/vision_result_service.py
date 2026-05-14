from datetime import UTC, datetime
from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.internal import VisionResultCallbackRequest
from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.image_request_repository import ImageRequestRepository
from app.repositories.vision_result_repository import VisionResultRepository
from app.services.alert_service import AlertService


class VisionResultService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.image_request_repository = ImageRequestRepository(database)
        self.vision_result_repository = VisionResultRepository(database)
        self.alert_service = AlertService(database)
        self.alert_distance_threshold_cm = get_settings().alert_distance_threshold_cm

    def save_worker_result(self, payload: VisionResultCallbackRequest) -> dict[str, Any]:
        image_request = self.image_request_repository.get_by_id(payload.request_id)
        if image_request is None:
            raise AppError(code="image_request_not_found", message="Image request not found.", status_code=404)

        risk_level = self.derive_risk_level(payload.objects, payload.nearest_obstacle_cm)
        summary_text = self.build_summary_text(payload.objects, payload.nearest_obstacle_cm)
        processed_at = datetime.now(UTC)
        result_payload = {
            "image_request_id": payload.request_id,
            "model_name": payload.model_name,
            "model_version": payload.model_version,
            "objects": payload.objects,
            "nearest_obstacle_cm": payload.nearest_obstacle_cm,
            "risk_level": risk_level,
            "summary_text": summary_text,
            "processed_at": processed_at,
        }
        result_id = self.vision_result_repository.save_if_absent(result_payload)
        self.update_request_status_after_result(payload.request_id, "done")
        if risk_level != "low":
            self.alert_service.create_alert_from_vision_result(image_request, result_payload)
        return {
            "id": result_id,
            "request_id": payload.request_id,
            "risk_level": risk_level,
            "summary_text": summary_text,
            "processed_at": processed_at.isoformat(),
        }

    def update_request_status_after_result(self, request_id: str, status: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        payload: dict[str, Any] = {"status": status, "ai_status": status, "updated_at": now}
        if status == "done":
            payload["completed_at"] = now
            payload["error_message"] = None
        self.image_request_repository.update_request(request_id, payload)
        return payload

    def derive_risk_level(self, objects: list[dict[str, Any]], nearest_obstacle_cm: float | None) -> str:
        if nearest_obstacle_cm is not None and nearest_obstacle_cm <= self.alert_distance_threshold_cm:
            return "high"
        if nearest_obstacle_cm is not None or objects:
            return "warning"
        return "low"

    def build_summary_text(self, objects: list[dict[str, Any]], nearest_obstacle_cm: float | None) -> str:
        if not objects and nearest_obstacle_cm is None:
            return "No obstacle detected."

        parts = []
        if objects:
            labels = [str(item.get("label") or item.get("class") or "object") for item in objects]
            label_text = ", ".join(dict.fromkeys(labels))
            parts.append(f"Detected {len(objects)} object(s): {label_text}.")
        if nearest_obstacle_cm is not None:
            parts.append(f"Nearest obstacle {nearest_obstacle_cm:g} cm.")
        return " ".join(parts)
