from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class MobileInstallationRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "mobile_installations")

    def get_by_fingerprint(self, device_fingerprint: str) -> dict[str, Any] | None:
        return self.find_one({"device_fingerprint": device_fingerprint})

    def get_by_id(self, installation_id: str) -> dict[str, Any] | None:
        return self.find_one({"_id": ObjectId(installation_id)})

    def create_installation(self, payload: dict[str, Any]) -> str:
        now = datetime.now(UTC)
        payload.setdefault("status", "active")
        payload.setdefault("created_at", now)
        payload.setdefault("updated_at", now)
        payload.setdefault("last_seen_at", now)
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def update_installation(self, installation_id: str, payload: dict[str, Any]) -> int:
        payload.setdefault("updated_at", datetime.now(UTC))
        return self.update_one({"_id": ObjectId(installation_id)}, payload)

    def list_by_ids(self, installation_ids: list[str]) -> list[dict[str, Any]]:
        query_ids: list[Any] = []
        for installation_id in installation_ids:
            query_ids.append(installation_id)
            try:
                query_ids.append(ObjectId(installation_id))
            except InvalidId:
                pass
        return list(self.collection.find({"_id": {"$in": query_ids}}))
