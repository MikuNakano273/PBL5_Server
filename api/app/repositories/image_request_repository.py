from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.repositories.base import BaseRepository


class ImageRequestRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "image_requests")

    def create_request(self, payload: dict[str, Any]) -> str:
        inserted_id = self.create_one(payload)
        return str(inserted_id)

    def get_by_id(self, request_id: str) -> dict[str, Any] | None:
        try:
            object_id = ObjectId(request_id)
        except InvalidId:
            return self.find_one({"_id": request_id})

        request = self.find_one({"_id": object_id})
        if request is not None:
            return request
        return self.find_one({"_id": request_id})

    def update_request(self, request_id: str, payload: dict[str, Any]) -> int:
        try:
            request_key = ObjectId(request_id)
        except InvalidId:
            request_key = request_id
        return self.update_one({"_id": request_key}, payload)

    def list_all(self, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        skip = max(page - 1, 0) * limit
        return list(self.collection.find({}).sort("created_at", -1).skip(skip).limit(limit))
