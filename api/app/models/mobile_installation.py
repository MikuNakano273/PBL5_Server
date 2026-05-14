from datetime import datetime

from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "mobile_installations"
INDEXES = [
    IndexModel([("device_fingerprint", ASCENDING)], unique=True),
    IndexModel([("status", ASCENDING)]),
    IndexModel([("last_seen_at", ASCENDING)]),
]


class MobileInstallationDocument(TimestampedDocument):
    device_fingerprint: str
    device_name: str
    platform: str
    push_provider: str | None = None
    push_token: str | None = None
    status: str = Field(default="active")
    last_seen_at: datetime | None = None
