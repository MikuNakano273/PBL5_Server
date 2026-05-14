from datetime import datetime

from pymongo import ASCENDING, DESCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "installation_notifications"
INDEXES = [
    IndexModel([("installation_id", ASCENDING), ("created_at", DESCENDING)]),
    IndexModel([("installation_id", ASCENDING), ("read_at", ASCENDING)]),
    IndexModel([("installation_id", ASCENDING), ("notification_event_id", ASCENDING)], unique=True),
]


class InstallationNotificationDocument(MongoDocument):
    installation_id: str
    notification_event_id: str
    read_at: datetime | None = None
    created_at: datetime
