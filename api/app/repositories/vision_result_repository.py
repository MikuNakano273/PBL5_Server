from typing import Any

from pymongo.errors import DuplicateKeyError

from app.repositories.base import BaseRepository


class VisionResultRepository(BaseRepository):
    def __init__(self, database) -> None:
        super().__init__(database, "vision_results")

    def save_if_absent(self, payload: dict[str, Any]) -> str:
        image_request_id = payload["image_request_id"]
        existing = self.find_one({"image_request_id": image_request_id})
        if existing is not None:
            return str(existing["_id"])

        try:
            inserted_id = self.create_one(payload)
        except DuplicateKeyError:
            existing = self.find_one({"image_request_id": image_request_id})
            if existing is not None:
                return str(existing["_id"])
            raise
        return str(inserted_id)
