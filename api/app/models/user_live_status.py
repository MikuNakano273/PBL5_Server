from datetime import datetime

from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel

from app.models.base import MongoDocument
from app.models.gps_log import LocationPoint

COLLECTION = "user_live_status"
INDEXES = [
    IndexModel([("blind_user_id", ASCENDING)], unique=True),
]


class UserLiveStatusDocument(MongoDocument):
    blind_user_id: str
    device_id: str
    current_safety_status: str
    nearest_distance_cm: float | None = None
    last_location: LocationPoint | None = None
    last_alert_at: datetime | None = None
    last_seen_at: datetime | None = None
    updated_at: datetime
