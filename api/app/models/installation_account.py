from datetime import datetime

from pymongo import ASCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "installation_accounts"
INDEXES = [
    IndexModel([("installation_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
    IndexModel([("installation_id", ASCENDING), ("is_active", ASCENDING)]),
]


class InstallationAccountDocument(TimestampedDocument):
    installation_id: str
    user_id: str
    is_active: bool
    last_switched_at: datetime | None = None
