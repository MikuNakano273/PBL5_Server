from datetime import datetime

from pymongo import ASCENDING, IndexModel

from app.models.base import MongoDocument

COLLECTION = "refresh_tokens"
INDEXES = [
    IndexModel([("user_id", ASCENDING)]),
    IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
    IndexModel([("token_hash", ASCENDING)]),
]


class RefreshTokenDocument(MongoDocument):
    user_id: str
    token_hash: str
    installation_id: str | None = None
    expires_at: datetime
    revoked_at: datetime | None = None
