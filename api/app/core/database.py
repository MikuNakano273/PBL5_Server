from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import get_settings

_mongo_client: MongoClient | None = None
_database: Database | None = None


MONGO_TIMEOUT_MS = 2000


def connect_mongo() -> Database:
    global _mongo_client, _database
    if _database is not None:
        return _database

    settings = get_settings()
    _mongo_client = MongoClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=MONGO_TIMEOUT_MS,
        connectTimeoutMS=MONGO_TIMEOUT_MS,
        socketTimeoutMS=MONGO_TIMEOUT_MS,
    )
    _mongo_client.admin.command("ping")
    _database = _mongo_client[settings.mongodb_db_name]
    return _database


def get_database() -> Database:
    if _database is None:
        return connect_mongo()
    return _database


def close_mongo() -> None:
    global _mongo_client, _database
    if _mongo_client is not None:
        _mongo_client.close()
    _mongo_client = None
    _database = None
