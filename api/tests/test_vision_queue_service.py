from datetime import UTC, datetime
from unittest import TestCase

from app.services.vision_queue_service import VisionQueueService
from app.tasks.vision_jobs import process_vision_job


class _Queue:
    def __init__(self):
        self.enqueued = None

    def enqueue(self, func, payload, job_timeout=None, retry=None):
        self.enqueued = {"func": func, "payload": payload, "job_timeout": job_timeout, "retry": retry}
        return type("Job", (), {"id": "rq-job-1"})()


class _Settings:
    vision_queue_name = "vision-jobs"
    vision_job_timeout_seconds = 120
    vision_retry_max = 3
    vision_retry_intervals = (3, 9, 27)


class VisionQueueServiceTest(TestCase):
    def test_enqueue_vision_job_uses_standard_payload(self):
        queue = _Queue()
        service = VisionQueueService(queue=queue, settings=_Settings())
        captured_at = datetime(2026, 4, 25, 11, 0, tzinfo=UTC)

        result = service.enqueue_vision_job(
            {
                "_id": "request-1",
                "device_id": "device-1",
                "user_id": "user-1",
                "image_path": "raw/user-1/device-1/request-1.jpg",
                "captured_at": captured_at,
            }
        )

        self.assertEqual(result["queue"], "vision-jobs")
        self.assertEqual(result["job_id"], "rq-job-1")
        self.assertEqual(queue.enqueued["func"], process_vision_job)
        self.assertEqual(queue.enqueued["job_timeout"], 120)
        self.assertEqual(queue.enqueued["retry"].max, 3)
        self.assertEqual(tuple(queue.enqueued["retry"].intervals), (3, 9, 27))
        self.assertEqual(
            queue.enqueued["payload"],
            {
                "request_id": "request-1",
                "device_id": "device-1",
                "user_id": "user-1",
                "object_key": "raw/user-1/device-1/request-1.jpg",
                "timestamp": captured_at.isoformat(),
            },
        )
