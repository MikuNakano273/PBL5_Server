from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class NotificationEventRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "notification_events")

    def create_event(self, payload: dict[str, Any]) -> str:
        payload.setdefault("created_at", datetime.now(UTC))
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def get_by_id(self, notification_event_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(notification_event_id)
        except InvalidId:
            return self.find_one({"_id": notification_event_id})

        event = self.find_one({"_id": object_id})
        if event is not None:
            return event
        return self.find_one({"_id": notification_event_id})
