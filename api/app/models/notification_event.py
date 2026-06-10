from datetime import datetime

from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "notification_events"
INDEXES = [
    IndexModel([("created_at", ASCENDING)]),
    IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
    IndexModel([("event_type", ASCENDING), ("created_at", DESCENDING)]),
]


class NotificationEventDocument(MongoDocument):
    event_type: str
    user_id: str
    category: str
    title: str
    message: str
    priority: str = "normal"
    created_at: datetime
