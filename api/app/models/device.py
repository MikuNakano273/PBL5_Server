from datetime import datetime

from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "devices"
INDEXES = [
    IndexModel([("device_code", ASCENDING)], unique=True),
    IndexModel([("serial_number", ASCENDING)], unique=True),
    IndexModel([("owner_user_id", ASCENDING), ("status", ASCENDING)]),
]


class DeviceDocument(TimestampedDocument):
    device_code: str
    serial_number: str
    owner_user_id: str
    name: str
    firmware_version: str | None = None
    status: str = Field(default="offline")
    last_seen_at: datetime | None = None
    last_battery: int | None = None
    device_secret_hash: str | None = None
