from collections.abc import Mapping
from typing import Any

from pymongo.collection import Collection
from pymongo.database import Database


class BaseRepository:
    def __init__(self, database: Database, collection_name: str) -> None:
        self._database = database
        self._collection: Collection = database[collection_name]

    @property
    def collection(self) -> Collection:
        return self._collection

    def find_one(self, filters: Mapping[str, Any]) -> dict[str, Any] | None:
        return self._collection.find_one(dict(filters))

    def create_one(self, payload: Mapping[str, Any]) -> Any:
        result = self._collection.insert_one(dict(payload))
        return result.inserted_id

    def update_one(self, filters: Mapping[str, Any], payload: Mapping[str, Any]) -> int:
        result = self._collection.update_one(dict(filters), {"$set": dict(payload)})
        return result.modified_count
