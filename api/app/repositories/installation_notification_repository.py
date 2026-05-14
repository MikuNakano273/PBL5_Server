from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class InstallationNotificationRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "installation_notifications")

    def create_notification(self, payload: dict[str, Any]) -> str:
        payload.setdefault("created_at", datetime.now(UTC))
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def list_by_installation(self, installation_id: str) -> list[dict[str, Any]]:
        return list(self.collection.find({"installation_id": installation_id}).sort("created_at", -1))

    def get_by_id(self, installation_notification_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(installation_notification_id)
        except InvalidId:
            return self.find_one({"_id": installation_notification_id})

        notification = self.find_one({"_id": object_id})
        if notification is not None:
            return notification
        return self.find_one({"_id": installation_notification_id})

    def mark_as_read(self, installation_notification_id: str) -> int:
        try:
            notification_id = ObjectId(installation_notification_id)
        except InvalidId:
            notification_id = installation_notification_id
        return self.update_one(
            {"_id": notification_id},
            {"read_at": datetime.now(UTC)},
        )

    def delete_older_than(self, cutoff) -> int:
        result = self.collection.delete_many({"created_at": {"$lt": cutoff}})
        return result.deleted_count
