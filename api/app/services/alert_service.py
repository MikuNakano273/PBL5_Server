from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.alert_repository import AlertRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository
from app.services.notification_service import NotificationService


class AlertService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        settings = get_settings()
        self.alert_repository = AlertRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)
        self.notification_service = NotificationService(database)
        self.dedup_window_seconds = settings.alert_dedup_window_seconds

    def create_alert_from_vision_result(
        self,
        image_request: dict[str, Any],
        vision_result: dict[str, Any],
    ) -> dict[str, Any]:
        risk_level = vision_result.get("risk_level", "low")
        if risk_level == "low":
            return {"created": False, "reason": "risk_low"}

        triggered_at = vision_result.get("processed_at") or datetime.now(UTC)
        gps_snapshot = image_request.get("gps_snapshot") or {}
        return self._create_alert(
            user_id=image_request["user_id"],
            device_id=image_request["device_id"],
            alert_type="vision_obstacle",
            title="Obstacle detected",
            message=vision_result.get("summary_text") or "Obstacle detected from camera image.",
            risk_level=risk_level,
            triggered_at=triggered_at,
            image_request_id=str(image_request.get("_id") or image_request.get("id")),
            lat=gps_snapshot.get("lat"),
            lng=gps_snapshot.get("lng"),
            distance_cm=vision_result.get("nearest_obstacle_cm"),
            live_status="danger" if risk_level == "high" else "warning",
        )

    def create_alert_from_distance(
        self,
        *,
        user_id: str,
        device_id: str,
        distance_cm: float,
        recorded_at: datetime | None = None,
    ) -> dict[str, Any]:
        triggered_at = recorded_at or datetime.now(UTC)
        return self._create_alert(
            user_id=user_id,
            device_id=device_id,
            alert_type="distance_danger",
            title="Obstacle too close",
            message=f"Obstacle detected at {distance_cm:g} cm.",
            risk_level="high",
            triggered_at=triggered_at,
            distance_cm=distance_cm,
            live_status="danger",
        )

    def create_alert_from_offline_device(
        self,
        *,
        user_id: str,
        device_id: str,
        detected_at: datetime | None = None,
    ) -> dict[str, Any]:
        triggered_at = detected_at or datetime.now(UTC)
        return self._create_alert(
            user_id=user_id,
            device_id=device_id,
            alert_type="device_offline",
            title="Device offline",
            message="Smart cane has stopped sending heartbeat.",
            risk_level="warning",
            triggered_at=triggered_at,
            live_status="offline",
        )

    def _create_alert(
        self,
        *,
        user_id: str,
        device_id: str,
        alert_type: str,
        title: str,
        message: str,
        risk_level: str,
        triggered_at: datetime,
        live_status: str,
        image_request_id: str | None = None,
        lat: float | None = None,
        lng: float | None = None,
        distance_cm: float | None = None,
    ) -> dict[str, Any]:
        since = triggered_at - timedelta(seconds=self.dedup_window_seconds)
        duplicate = self.alert_repository.find_recent_duplicate(
            user_id,
            device_id,
            alert_type,
            since,
            image_request_id=image_request_id,
        )
        if duplicate is not None:
            return {"created": False, "deduplicated": True, "id": str(duplicate["_id"])}

        payload = {
            "user_id": user_id,
            "device_id": device_id,
            "image_request_id": image_request_id,
            "alert_type": alert_type,
            "title": title,
            "message": message,
            "risk_level": risk_level,
            "status": "open",
            "lat": lat,
            "lng": lng,
            "distance_cm": distance_cm,
            "triggered_at": triggered_at,
            "resolved_at": None,
        }
        alert_id = self.alert_repository.create_alert(payload)
        self.user_live_status_repository.update_alert_status(
            user_id,
            {
                "device_id": device_id,
                "current_safety_status": live_status,
                "nearest_distance_cm": distance_cm,
                "last_alert_at": triggered_at,
                "updated_at": datetime.now(UTC),
            },
        )
        alert = {"_id": alert_id, **payload}
        notification = self.notification_service.create_notification_event_from_alert(alert)
        return {"created": True, "id": alert_id, "alert": payload, "notification": notification}
