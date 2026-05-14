from datetime import UTC, datetime, time
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, 'alerts')

    def create_alert(self, payload: dict[str, Any]) -> str:
        return str(self.create_one(payload))

    def find_recent_duplicate(
        self,
        user_id: str,
        device_id: str,
        alert_type: str,
        since: datetime,
        image_request_id: str | None = None,
    ) -> dict[str, Any] | None:
        if image_request_id is not None:
            duplicate = self.find_one(
                {
                    'user_id': user_id,
                    'device_id': device_id,
                    'alert_type': alert_type,
                    'image_request_id': image_request_id,
                    'status': 'open',
                }
            )
            if duplicate is not None:
                return duplicate

        return self.collection.find_one(
            {
                'user_id': user_id,
                'device_id': device_id,
                'alert_type': alert_type,
                'status': 'open',
                'triggered_at': {'$gte': since},
            },
            sort=[('triggered_at', -1)],
        )

    def count_today_for_user(self, user_id: str) -> int:
        start_of_day = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
        return self.collection.count_documents({'user_id': user_id, 'triggered_at': {'$gte': start_of_day}})

    def list_today_for_user(self, user_id: str) -> list[dict[str, Any]]:
        start_of_day = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
        return list(self.collection.find({'user_id': user_id, 'triggered_at': {'$gte': start_of_day}}).sort('triggered_at', -1))

    def list_recent_for_user(self, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
        return list(self.collection.find({'user_id': user_id}).sort('triggered_at', -1).limit(limit))

    def list_for_user(self, user_id: str, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        skip = max(page - 1, 0) * limit
        return list(self.collection.find({'user_id': user_id}).sort('triggered_at', -1).skip(skip).limit(limit))

    def list_all(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        skip = max(page - 1, 0) * limit
        return list(self.collection.find({}).sort('triggered_at', -1).skip(skip).limit(limit))

    def get_by_id(self, alert_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(alert_id)
        except InvalidId:
            return self.find_one({'_id': alert_id})

        alert = self.find_one({'_id': object_id})
        if alert is not None:
            return alert
        return self.find_one({'_id': alert_id})
