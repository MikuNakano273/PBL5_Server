from datetime import datetime

from pydantic import Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "alerts"
INDEXES = [
    IndexModel([("blind_user_id", ASCENDING), ("triggered_at", DESCENDING)]),
    IndexModel([("device_id", ASCENDING), ("triggered_at", DESCENDING)]),
    IndexModel([("risk_level", ASCENDING), ("triggered_at", DESCENDING)]),
]


class AlertDocument(MongoDocument):
    blind_user_id: str
    device_id: str
    image_request_id: str | None = None
    alert_type: str
    title: str
    message: str
    risk_level: str
    status: str = Field(default="open")
    lat: float | None = None
    lng: float | None = None
    distance_cm: float | None = None
    triggered_at: datetime
    resolved_at: datetime | None = None
