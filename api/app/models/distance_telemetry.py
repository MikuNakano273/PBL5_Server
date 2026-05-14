from datetime import datetime

from pydantic import Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "distance_telemetry"
INDEXES = [
    IndexModel([("user_id", ASCENDING), ("recorded_at", DESCENDING)]),
    IndexModel([("device_id", ASCENDING), ("recorded_at", DESCENDING)]),
]


class DistanceTelemetryDocument(MongoDocument):
    device_id: str
    user_id: str
    distance_cm: float
    detected: bool = Field(default=True)
    sensor_type: str | None = None
    recorded_at: datetime
