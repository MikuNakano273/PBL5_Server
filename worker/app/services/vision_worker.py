import os
import tempfile
from datetime import UTC, datetime
from typing import Any

from app.services.repositories import ImageRequestRepository, VisionResultRepository
from app.services.result_callback_service import ResultCallbackService
from app.services.storage_service import StorageService
from app.services.yolo_service import YoloService


class VisionJobProcessor:
    def __init__(
        self,
        image_requests: ImageRequestRepository | None = None,
        vision_results: VisionResultRepository | None = None,
        storage: StorageService | None = None,
        yolo: YoloService | None = None,
        callback: ResultCallbackService | None = None,
        temp_dir: str | None = None,
    ) -> None:
        self.image_requests = image_requests or ImageRequestRepository()
        self.vision_results = vision_results or VisionResultRepository()
        self.storage = storage or StorageService()
        self.yolo = yolo or YoloService()
        self.callback = callback or ResultCallbackService()
        self.temp_dir = temp_dir

    def process(self, payload: dict[str, Any]) -> dict[str, Any]:
        request_id = payload["request_id"]
        user_id = payload["user_id"]
        object_key = payload["object_key"]
        self.image_requests.mark_processing(request_id)

        temp_path = None
        try:
            fd, temp_path = tempfile.mkstemp(suffix=".jpg", dir=self.temp_dir)
            os.close(fd)
            self.storage.download_image(object_key, temp_path)
            result = self.yolo.infer(temp_path)
            result_payload = self._build_result_payload(request_id, user_id, result)
            self.vision_results.save_if_absent(result_payload)
            self.image_requests.mark_done(request_id)
            self.callback.send_result(self._build_callback_payload(request_id, result_payload))
            return result_payload
        except Exception as exc:
            self.image_requests.mark_failed(request_id, str(exc))
            raise
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

    def _build_result_payload(self, request_id: str, user_id: str, result: dict[str, Any]) -> dict[str, Any]:
        return {
            "image_request_id": request_id,
            "user_id": user_id,
            "model_name": result.get("model_name", "yolov8s"),
            "model_version": result.get("model_version", "1.0"),
            "objects": result.get("objects", []),
            "nearest_obstacle_cm": result.get("nearest_obstacle_cm"),
            "risk_level": result.get("risk_level", "low"),
            "summary_text": result.get("summary_text", ""),
            "processed_at": datetime.now(UTC),
        }

    def _build_callback_payload(self, request_id: str, result_payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "request_id": request_id,
            "user_id": result_payload["user_id"],
            "model_name": result_payload["model_name"],
            "model_version": result_payload["model_version"],
            "objects": result_payload["objects"],
            "nearest_obstacle_cm": result_payload["nearest_obstacle_cm"],
            "risk_level": result_payload["risk_level"],
            "summary_text": result_payload["summary_text"],
        }
