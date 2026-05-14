from __future__ import annotations

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.common.utils.security import hash_password
from app.core.database import close_mongo, connect_mongo


DEMO_PASSWORD = "password123"
USER_ID = "user-1"
ADMIN_USER_ID = "admin-1"
DEVICE_ID = "device-1"


def upsert(collection, document_id: str, payload: dict) -> None:
    collection.replace_one({"_id": document_id}, {"_id": document_id, **payload}, upsert=True)


def seed_users(db, now: datetime) -> None:
    password_hash = hash_password(DEMO_PASSWORD)
    users = db["users"]

    upsert(
        users,
        USER_ID,
        {
            "email": "user@example.com",
            "password_hash": password_hash,
            "full_name": "Demo User",
            "phone": "0900000001",
            "role": "user",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        },
    )
    upsert(
        users,
        ADMIN_USER_ID,
        {
            "email": "admin@example.com",
            "password_hash": password_hash,
            "full_name": "Demo Admin",
            "phone": "0900000002",
            "role": "admin",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        },
    )


def seed_device_and_status(db, now: datetime) -> None:
    upsert(
        db["devices"],
        DEVICE_ID,
        {
            "device_code": "STICK-001",
            "serial_number": "DEMO-STICK-001",
            "owner_user_id": USER_ID,
            "name": "Demo Smart Cane",
            "firmware_version": "demo-1.0.0",
            "status": "online",
            "last_seen_at": now,
            "last_battery": 78,
            "device_secret_hash": hash_password("device-secret"),
            "created_at": now,
            "updated_at": now,
        },
    )
    upsert(
        db["user_live_status"],
        "live-status-1",
        {
            "user_id": USER_ID,
            "device_id": DEVICE_ID,
            "current_safety_status": "warning",
            "nearest_distance_cm": 85.0,
            "last_location": {
                "type": "Point",
                "coordinates": [108.2022, 16.0544],
            },
            "last_alert_at": now - timedelta(minutes=5),
            "last_seen_at": now,
            "updated_at": now,
        },
    )


def seed_gps_logs(db, now: datetime) -> None:
    points = [
        ("gps-1", 16.0544, 108.2022, now - timedelta(minutes=1)),
        ("gps-2", 16.0540, 108.2026, now - timedelta(minutes=8)),
        ("gps-3", 16.0536, 108.2030, now - timedelta(minutes=15)),
    ]
    for document_id, lat, lng, recorded_at in points:
        upsert(
            db["gps_logs"],
            document_id,
            {
                "device_id": DEVICE_ID,
                "user_id": USER_ID,
                "lat": lat,
                "lng": lng,
                "location": {"type": "Point", "coordinates": [lng, lat]},
                "accuracy": 4.5,
                "speed": 0.7,
                "heading": 92.0,
                "recorded_at": recorded_at,
            },
        )


def seed_alerts(db, now: datetime) -> None:
    alerts = [
        (
            "alert-1",
            "OBSTACLE",
            "Vat can gan phia truoc",
            "Phat hien vat can cach gay 0.85m.",
            "high",
            85.0,
            now - timedelta(minutes=5),
        ),
        (
            "alert-2",
            "SAFE_ZONE",
            "Gan ra khoi vung an toan",
            "Nguoi dung dang di gan ranh gioi an toan.",
            "medium",
            180.0,
            now - timedelta(hours=1),
        ),
        (
            "alert-3",
            "BATTERY",
            "Pin thiet bi can theo doi",
            "Pin gay con 78 phan tram.",
            "low",
            None,
            now - timedelta(hours=2),
        ),
    ]
    for document_id, alert_type, title, message, risk_level, distance_cm, triggered_at in alerts:
        upsert(
            db["alerts"],
            document_id,
            {
                "user_id": USER_ID,
                "device_id": DEVICE_ID,
                "image_request_id": None,
                "alert_type": alert_type,
                "title": title,
                "message": message,
                "risk_level": risk_level,
                "status": "open",
                "lat": 16.0544,
                "lng": 108.2022,
                "distance_cm": distance_cm,
                "triggered_at": triggered_at,
                "resolved_at": None,
            },
        )


def seed_demo_data() -> None:
    db = connect_mongo()
    now = datetime.now(UTC)
    seed_users(db, now)
    seed_device_and_status(db, now)
    seed_gps_logs(db, now)
    seed_alerts(db, now)
    close_mongo()


if __name__ == "__main__":
    seed_demo_data()
    print("Seeded demo data.")
    print("Mobile login: user@example.com / password123")
    print("Admin login: admin@example.com / password123")
