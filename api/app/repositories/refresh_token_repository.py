from datetime import UTC, datetime
from typing import Any

from app.common.utils.security import hash_token
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "refresh_tokens")

    def create_refresh_token(self, payload: dict[str, Any]) -> str:
        now = datetime.now(UTC)
        payload.setdefault("created_at", now)
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def get_active_token(self, refresh_token: str) -> dict[str, Any] | None:
        return self.find_one({"token_hash": hash_token(refresh_token), "revoked_at": None})

    def revoke_token(self, refresh_token: str) -> int:
        return self.update_one(
            {"token_hash": hash_token(refresh_token), "revoked_at": None},
            {"revoked_at": datetime.now(UTC)},
        )

    def revoke_all_for_user(self, user_id: str) -> int:
        result = self.collection.update_many(
            {"user_id": user_id, "revoked_at": None},
            {"$set": {"revoked_at": datetime.now(UTC)}},
        )
        return result.modified_count
