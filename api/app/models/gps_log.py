from datetime import datetime

from pydantic import BaseModel
from pymongo import ASCENDING, DESCENDING, GEOSPHERE, IndexModel

from app.models.base import MongoDocument

COLLECTION = "gps_logs"
INDEXES = [
    IndexModel([("blind_user_id", ASCENDING), ("recorded_at", DESCENDING)]),
    IndexModel([("device_id", ASCENDING), ("recorded_at", DESCENDING)]),
    IndexModel([("location", GEOSPHERE)]),
]


class LocationPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float]


class GpsLogDocument(MongoDocument):
    device_id: str
    blind_user_id: str
    lat: float
    lng: float
    location: LocationPoint
    accuracy: float | None = None
    speed: float | None = None
    heading: float | None = None
    recorded_at: datetime
