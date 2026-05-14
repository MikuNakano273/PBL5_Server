from datetime import datetime

from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "users"
INDEXES = [
    IndexModel([("email", ASCENDING)], unique=True),
    IndexModel([("role", ASCENDING), ("user_type", ASCENDING), ("status", ASCENDING)]),
]


class UserDocument(TimestampedDocument):
    email: str
    password_hash: str
    full_name: str
    phone: str | None = None
    role: str
    user_type: str | None = None
    status: str = Field(default="active")
