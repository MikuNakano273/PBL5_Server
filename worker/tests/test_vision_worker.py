from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from app.services.vision_worker import VisionJobProcessor


class _ImageRequests:
    def __init__(self):
        self.states = []

    def mark_processing(self, request_id):
        self.states.append(("processing", request_id))

    def mark_done(self, request_id):
        self.states.append(("done", request_id))

    def mark_failed(self, request_id, reason):
        self.states.append(("failed", request_id, reason))


class _VisionResults:
    def __init__(self):
        self.saved = None

    def save_if_absent(self, payload):
        self.saved = payload


class _Storage:
    def __init__(self):
        self.downloaded = None

    def download_image(self, object_key, destination_path):
        self.downloaded = (object_key, destination_path)
        Path(destination_path).write_bytes(b"fake-image")


class _Yolo:
    def __init__(self, result=None, error=None):
        self.result = result or {
            "objects": [{"label": "chair", "confidence": 0.91, "bbox": {"x1": 1, "y1": 2, "x2": 3, "y2": 4}}],
            "nearest_obstacle_cm": 80,
            "risk_level": "high",
            "summary_text": "Detected chair",
        }
        self.error = error
        self.image_path = None

    def infer(self, image_path):
        self.image_path = image_path
        if self.error is not None:
            raise self.error
        return self.result


class _Callback:
    def __init__(self):
        self.sent = None

    def send_result(self, payload):
        self.sent = payload


class VisionJobProcessorTest(TestCase):
    def test_process_downloads_image_runs_yolo_saves_result_and_callbacks(self):
        with TemporaryDirectory() as temp_dir:
            image_requests = _ImageRequests()
            vision_results = _VisionResults()
            storage = _Storage()
            yolo = _Yolo()
            callback = _Callback()
            processor = VisionJobProcessor(
                image_requests=image_requests,
                vision_results=vision_results,
                storage=storage,
                yolo=yolo,
                callback=callback,
                temp_dir=temp_dir,
            )

            result = processor.process(
                {
                    "request_id": "request-1",
                    "device_id": "device-1",
                    "user_id": "user-1",
                    "object_key": "raw/user-1/device-1/request-1.jpg",
                    "timestamp": "2026-04-25T11:00:00+00:00",
                }
            )

        self.assertEqual(image_requests.states, [("processing", "request-1"), ("done", "request-1")])
        self.assertEqual(storage.downloaded[0], "raw/user-1/device-1/request-1.jpg")
        self.assertEqual(vision_results.saved["image_request_id"], "request-1")
        self.assertEqual(vision_results.saved["user_id"], "user-1")
        self.assertEqual(vision_results.saved["model_name"], "yolov8s")
        self.assertEqual(vision_results.saved["objects"][0]["label"], "chair")
        self.assertEqual(callback.sent["request_id"], "request-1")
        self.assertEqual(callback.sent["user_id"], "user-1")
        self.assertEqual(result["risk_level"], "high")

    def test_process_marks_failed_and_reraises_for_rq_retry(self):
        image_requests = _ImageRequests()
        processor = VisionJobProcessor(
            image_requests=image_requests,
            vision_results=_VisionResults(),
            storage=_Storage(),
            yolo=_Yolo(error=RuntimeError("model failed")),
            callback=_Callback(),
        )

        with self.assertRaises(RuntimeError):
            processor.process(
                {
                    "request_id": "request-1",
                    "device_id": "device-1",
                    "user_id": "user-1",
                    "object_key": "raw/user-1/device-1/request-1.jpg",
                    "timestamp": "2026-04-25T11:00:00+00:00",
                }
            )

        self.assertEqual(image_requests.states[-1], ("failed", "request-1", "model failed"))
