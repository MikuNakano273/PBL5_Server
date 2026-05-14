from __future__ import annotations

import sys
from pathlib import Path

from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.core.config import get_settings


def rename_field(collection, old_name: str, new_name: str) -> int:
    result = collection.update_many({old_name: {"$exists": True}}, {"$rename": {old_name: new_name}})
    return result.modified_count


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_db_name]

    unset_result = database.users.update_many({"user_type": {"$exists": True}}, {"$unset": {"user_type": ""}})
    print(f"users: removed user_type from {unset_result.modified_count} documents")

    for name in [
        "alerts",
        "distance_telemetry",
        "gps_logs",
        "image_requests",
        "notification_events",
        "user_live_status",
        "vision_results",
    ]:
        print(f"{name}: renamed {rename_field(database[name], 'blind_user_id', 'user_id')} documents")

    print(f"devices: renamed {rename_field(database.devices, 'owner_blind_user_id', 'owner_user_id')} documents")


if __name__ == "__main__":
    main()
