from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.base import TimestampedDocument

COLLECTION = "care_links"
INDEXES = [
    IndexModel([("blind_user_id", ASCENDING), ("family_user_id", ASCENDING)], unique=True),
    IndexModel([("blind_user_id", ASCENDING), ("status", ASCENDING)]),
    IndexModel([("family_user_id", ASCENDING), ("status", ASCENDING)]),
]


class CareLinkDocument(TimestampedDocument):
    blind_user_id: str
    family_user_id: str
    relation: str = Field(default="family")
    status: str = Field(default="active")
