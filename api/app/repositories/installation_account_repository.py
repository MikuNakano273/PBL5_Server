from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.repositories.base import BaseRepository


class InstallationAccountRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "installation_accounts")

    def get_by_id(self, installation_account_id: str) -> dict[str, Any] | None:
        return self.find_one({"_id": ObjectId(installation_account_id)})

    def get_by_installation_and_user(self, installation_id: str, user_id: str) -> dict[str, Any] | None:
        return self.find_one({"installation_id": installation_id, "user_id": user_id})

    def get_active_account(self, installation_id: str) -> dict[str, Any] | None:
        return self.find_one({"installation_id": installation_id, "is_active": True})

    def list_by_installation(self, installation_id: str) -> list[dict[str, Any]]:
        return list(self.collection.find({"installation_id": installation_id}).sort("created_at", 1))

    def list_installation_ids_for_users(self, user_ids: list[str]) -> list[str]:
        accounts = self.collection.find({"user_id": {"$in": user_ids}})
        installation_ids = []
        seen = set()
        for account in accounts:
            installation_id = account["installation_id"]
            if installation_id not in seen:
                seen.add(installation_id)
                installation_ids.append(installation_id)
        return installation_ids

    def create_account(self, payload: dict[str, Any]) -> str:
        now = datetime.now(UTC)
        payload.setdefault("created_at", now)
        payload.setdefault("updated_at", now)
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def deactivate_all(self, installation_id: str) -> int:
        result = self.collection.update_many(
            {"installation_id": installation_id, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.now(UTC)}},
        )
        return result.modified_count

    def activate_account(self, installation_account_id: str) -> int:
        now = datetime.now(UTC)
        result = self.collection.update_one(
            {"_id": ObjectId(installation_account_id)},
            {"$set": {"is_active": True, "last_switched_at": now, "updated_at": now}},
        )
        return result.modified_count
