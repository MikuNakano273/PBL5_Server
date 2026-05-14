from datetime import UTC, datetime
from typing import Any

from app.core.config import Settings, get_settings
from app.core.redis import get_rq_redis
from app.tasks.vision_jobs import process_vision_job


class VisionQueueService:
    def __init__(self, queue=None, settings: Settings | None = None) -> None:
        self.settings = settings if settings is not None else get_settings()
        if queue is None:
            from rq import Queue

            queue = Queue(self.settings.vision_queue_name, connection=get_rq_redis())
        self.queue = queue

    def enqueue_vision_job(self, image_request: dict[str, Any]) -> dict[str, Any]:
        from rq import Retry

        payload = self._build_payload(image_request)
        retry = Retry(max=self.settings.vision_retry_max, interval=list(self._retry_intervals()))
        job = self.queue.enqueue(
            process_vision_job,
            payload,
            job_timeout=self.settings.vision_job_timeout_seconds,
            retry=retry,
        )
        return {"job_id": job.id, "queue": self.settings.vision_queue_name, "payload": payload}

    def _retry_intervals(self) -> tuple[int, ...]:
        intervals = getattr(self.settings, "vision_retry_interval_values", None)
        if intervals is not None:
            return tuple(intervals)
        raw_intervals = self.settings.vision_retry_intervals
        if isinstance(raw_intervals, str):
            return tuple(int(value.strip()) for value in raw_intervals.split(",") if value.strip())
        return tuple(raw_intervals)

    def _build_payload(self, image_request: dict[str, Any]) -> dict[str, Any]:
        timestamp = image_request.get("captured_at") or datetime.now(UTC)
        if hasattr(timestamp, "isoformat"):
            timestamp = timestamp.isoformat()
        return {
            "request_id": str(image_request.get("_id") or image_request.get("id")),
            "device_id": image_request["device_id"],
            "user_id": image_request["user_id"],
            "object_key": image_request["image_path"],
            "timestamp": timestamp,
        }
