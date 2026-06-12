from datetime import UTC, datetime
from typing import Any

from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository
from app.repositories.image_request_repository import ImageRequestRepository
from app.repositories.vision_result_repository import VisionResultRepository
from app.services.alert_service import AlertService


class DemoFramePersistenceService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)
        self.image_request_repository = ImageRequestRepository(database)
        self.vision_result_repository = VisionResultRepository(database)
        self.alert_service = AlertService(database)

    def persist_frame(
        self,
        *,
        device_code: str,
        frame_id: str,
        image_url: str,
        created_at: datetime,
        sensor: dict[str, Any] | None,
        yolo_result: dict[str, Any],
        scene_context: dict[str, Any],
    ) -> dict[str, Any]:
        device = self.device_repository.get_by_device_code(device_code)
        if device is None:
            return {"persisted": False, "reason": "device_not_found"}

        user_id = device.get("owner_user_id")
        if not user_id:
            return {"persisted": False, "reason": "device_has_no_owner"}

        request_code = f"demo_{frame_id}"
        existing = self.image_request_repository.get_by_request_code(request_code)
        now = datetime.now(UTC)
        distance_cm = sensor.get("distance_cm") if sensor else None
        gps_snapshot = sensor.get("gps") if sensor else None
        if existing is None:
            request_payload = {
                "request_code": request_code,
                "device_id": str(device["_id"]),
                "user_id": str(user_id),
                "captured_at": created_at,
                "distance_cm": distance_cm,
                "gps_snapshot": gps_snapshot,
                "image_path": None,
                "image_url": image_url,
                "status": "done",
                "ai_status": "done",
                "error_message": None,
                "metadata": {
                    "source": "demo_frame",
                    "frame_id": frame_id,
                    "scene_context": scene_context,
                    "objects": yolo_result.get("objects", []),
                },
                "created_at": created_at,
                "updated_at": now,
                "completed_at": now,
            }
            request_id = self.image_request_repository.create_request(request_payload)
            image_request = self.image_request_repository.get_by_id(request_id) or {
                "_id": request_id,
                **request_payload,
            }
        else:
            image_request = existing
            request_id = str(existing["_id"])

        risk_level = self._alert_risk_level(scene_context.get("risk_level"))
        result_payload = {
            "image_request_id": str(request_id),
            "user_id": str(user_id),
            "model_name": yolo_result.get("model_name") or "yolov8s",
            "model_version": yolo_result.get("model_version") or "demo",
            "objects": yolo_result.get("objects", []),
            "nearest_obstacle_cm": distance_cm,
            "risk_level": risk_level,
            "summary_text": self._summary_text(scene_context, yolo_result),
            "scene_type": scene_context.get("type"),
            "confidence": scene_context.get("confidence"),
            "processed_at": now,
        }
        vision_result_id = self.vision_result_repository.save_if_absent(result_payload)
        alert = None
        if risk_level != "low":
            alert = self.alert_service.create_alert_from_vision_result(image_request, result_payload)

        return {
            "persisted": True,
            "deduplicated": existing is not None,
            "image_request_id": str(request_id),
            "vision_result_id": vision_result_id,
            "alert": alert,
        }

    @staticmethod
    def _alert_risk_level(scene_risk_level: object) -> str:
        if scene_risk_level == "danger":
            return "high"
        if scene_risk_level in {"warning", "info"}:
            return "warning"
        return "low"

    @staticmethod
    def _summary_text(scene_context: dict[str, Any], yolo_result: dict[str, Any]) -> str:
        summary = yolo_result.get("summary_text")
        if summary:
            return str(summary)
        scene_type = str(scene_context.get("type") or "object").replace("_", " ")
        return f"Detected scene: {scene_type}."
