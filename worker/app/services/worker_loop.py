import json
import os
import tempfile
import time
from datetime import datetime, timezone
from bson import ObjectId
from minio import Minio
from redis import Redis
from app.config.settings import settings
from app.db.mongo import db
from app.services.yolo_service import YoloService

redis_client = Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)
minio_client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=False,
)
yolo_service = YoloService()

QUEUE_NAME = "bull:vision-jobs:wait"
PROCESSING_QUEUE = "bull:vision-jobs:active"


def now_utc():
    return datetime.now(timezone.utc)


def process_job(job_data: dict):
    request_id = job_data.get("request_id")
    object_key = job_data.get("object_key")
    if not request_id or not object_key:
        print(f"[worker] Invalid job data: {job_data}")
        return

    print(f"[worker] Processing request_id={request_id}, object_key={object_key}")
    db.image_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "processing", "ai_status": "processing"}},
    )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp_path = tmp.name
        minio_client.fget_object(settings.minio_bucket, object_key, tmp_path)
        result = yolo_service.infer(tmp_path)
    except Exception as e:
        print(f"[worker] Error during infer: {e}")
        db.image_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "failed", "ai_status": "failed", "error_message": str(e)}},
        )
        return
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Idempotency: skip if result already saved
    existing = db.vision_results.find_one({"image_request_id": ObjectId(request_id)})
    if not existing:
        db.vision_results.insert_one(
            {
                **result,
                "image_request_id": ObjectId(request_id),
                "model_name": "yolov8",
                "model_version": "1.0",
                "processed_at": now_utc(),
            }
        )

    db.image_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "done", "ai_status": "done"}},
    )

    # Callback to NestJS internal API
    try:
        import requests as http_lib
        internal_url = settings.internal_api_url + "/api/internal/v1/vision/results"
        payload = {
            "request_id": request_id,
            "model_name": "yolov8",
            "model_version": "1.0",
            "objects": result.get("objects", []),
            "nearest_obstacle_cm": result.get("nearest_obstacle_cm"),
            "risk_level": result.get("risk_level"),
            "summary_text": result.get("summary_text"),
        }
        resp = http_lib.post(
            internal_url,
            json=payload,
            headers={"Authorization": f"Bearer {settings.internal_worker_token}"},
            timeout=10,
        )
        print(f"[worker] Callback => {resp.status_code}")
    except Exception as e:
        print(f"[worker] Callback error: {e}")


def run_worker():
    print("[worker] PBL5 YOLO worker started")
    while True:
        try:
            # BullMQ stores jobs in Redis lists. Wait for a job from the queue.
            # BullMQ key format: "bull:<queue_name>:wait"
            raw = redis_client.brpoplpush(QUEUE_NAME, PROCESSING_QUEUE, timeout=5)
            if not raw:
                continue
            job_id = raw  # BullMQ stores job ID in wait list
            # Get job data from hash: "bull:<queue_name>:<job_id>"
            job_raw = redis_client.hget(f"bull:vision-jobs:{job_id}", "data")
            if not job_raw:
                # Fallback: try legacy pipe-separated format
                if "|" in job_id:
                    rid, okey = job_id.split("|", 1)
                    process_job({"request_id": rid, "object_key": okey})
                else:
                    print(f"[worker] Cannot parse job: {job_id}")
                redis_client.lrem(PROCESSING_QUEUE, 0, job_id)
                continue

            job_data = json.loads(job_raw)
            process_job(job_data)
            # Remove from active queue after success
            redis_client.lrem(PROCESSING_QUEUE, 0, job_id)
        except Exception as e:
            print(f"[worker] Unhandled error: {e}")
            time.sleep(2)
