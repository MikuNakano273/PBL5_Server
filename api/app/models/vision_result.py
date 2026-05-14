from datetime import datetime
from typing import Any

from pydantic import Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "vision_results"
INDEXES = [
    IndexModel([("image_request_id", ASCENDING)], unique=True),
    IndexModel([("user_id", ASCENDING), ("processed_at", DESCENDING)]),
    IndexModel([("risk_level", ASCENDING), ("processed_at", DESCENDING)]),
]


class VisionResultDocument(MongoDocument):
    image_request_id: str
    user_id: str
    model_name: str
    model_version: str
    objects: list[dict[str, Any]] = Field(default_factory=list)
    nearest_obstacle_cm: float | None = None
    risk_level: str
    summary_text: str
    processed_at: datetime
