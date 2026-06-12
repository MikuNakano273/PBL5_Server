from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path

from pymongo import MongoClient
from redis import Redis

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.common.utils.security import hash_password
from app.core.config import get_settings
from app.core.minio import connect_minio, ensure_bucket_exists


ADMIN_EMAIL = "seed-admin@example.com"
USER_EMAIL = "namqd2000@gmail.com"
USER_PASSWORD = "namdq"
DEVICE_CODE = "pbl5-01"
DEVICE_SECRET = "pbl5-01"


def reset_mongo() -> tuple[str, str]:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_db_name]
    admin = database.users.find_one({"email": ADMIN_EMAIL, "role": "admin"})
    if admin is None:
        raise RuntimeError(f"Required seed admin {ADMIN_EMAIL} was not found.")

    for collection_name in database.list_collection_names():
        if collection_name != "users":
            database[collection_name].delete_many({})
    database.users.delete_many({"_id": {"$ne": admin["_id"]}})

    now = datetime.now(UTC)
    user_id = database.users.insert_one(
        {
            "email": USER_EMAIL,
            "password_hash": hash_password(USER_PASSWORD),
            "full_name": "Đặng Quốc Nam",
            "phone": None,
            "role": "user",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
    ).inserted_id
    device_id = database.devices.insert_one(
        {
            "device_code": DEVICE_CODE,
            "serial_number": DEVICE_CODE,
            "owner_user_id": str(user_id),
            "name": DEVICE_CODE,
            "firmware_version": None,
            "status": "offline",
            "last_seen_at": None,
            "last_battery": None,
            "device_secret_hash": hash_password(DEVICE_SECRET),
            "created_at": now,
            "updated_at": now,
        }
    ).inserted_id
    client.close()
    return str(user_id), str(device_id)


def clear_minio() -> int:
    settings = get_settings()
    ensure_bucket_exists()
    client = connect_minio()
    objects = list(client.list_objects(settings.minio_bucket, recursive=True))
    for item in objects:
        client.remove_object(settings.minio_bucket, item.object_name)
    return len(objects)


def clear_redis() -> None:
    settings = get_settings()
    client = Redis.from_url(settings.redis_url)
    client.flushall()
    client.close()


def main() -> None:
    user_id, device_id = reset_mongo()
    removed_images = clear_minio()
    clear_redis()
    print(f"Created user {USER_EMAIL}: {user_id}")
    print(f"Created device {DEVICE_CODE}: {device_id}")
    print(f"Removed {removed_images} MinIO object(s) and flushed Redis.")


if __name__ == "__main__":
    main()
