from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.db.mongo import db


def _request_key(request_id: str):
    try:
        return ObjectId(request_id)
    except Exception:
        return request_id


class ImageRequestRepository:
    def __init__(self, database=None) -> None:
        self.db = database or db

    def mark_processing(self, request_id: str) -> None:
        self.db.image_requests.update_one(
            {"_id": _request_key(request_id)},
            {"$set": {"status": "processing", "ai_status": "processing", "updated_at": datetime.now(UTC)}},
        )

    def mark_done(self, request_id: str) -> None:
        now = datetime.now(UTC)
        self.db.image_requests.update_one(
            {"_id": _request_key(request_id)},
            {"$set": {"status": "done", "ai_status": "done", "completed_at": now, "updated_at": now}},
        )

    def mark_failed(self, request_id: str, reason: str) -> None:
        now = datetime.now(UTC)
        self.db.image_requests.update_one(
            {"_id": _request_key(request_id)},
            {
                "$set": {
                    "status": "failed",
                    "ai_status": "failed",
                    "error_message": reason,
                    "failed_at": now,
                    "updated_at": now,
                }
            },
        )


class VisionResultRepository:
    def __init__(self, database=None) -> None:
        self.db = database or db

    def save_if_absent(self, payload: dict[str, Any]) -> None:
        image_request_id = payload["image_request_id"]
        existing = self.db.vision_results.find_one({"image_request_id": image_request_id})
        if existing is None:
            self.db.vision_results.insert_one(payload)
