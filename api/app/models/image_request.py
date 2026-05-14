from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "image_requests"
INDEXES = [
    IndexModel([("request_code", ASCENDING)], unique=True),
    IndexModel([("ai_status", ASCENDING), ("created_at", ASCENDING)]),
    IndexModel([("blind_user_id", ASCENDING), ("created_at", DESCENDING)]),
]


class GpsSnapshot(BaseModel):
    lat: float | None = None
    lng: float | None = None
    accuracy: float | None = None


class ImageRequestDocument(TimestampedDocument):
    request_code: str
    device_id: str
    blind_user_id: str
    captured_at: datetime
    distance_cm: float | None = None
    gps_snapshot: GpsSnapshot | None = None
    image_path: str | None = None
    status: str = Field(default="created")
    ai_status: str = Field(default="created")
    error_message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
