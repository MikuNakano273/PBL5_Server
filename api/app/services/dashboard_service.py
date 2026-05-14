from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.auth import AuthContext
from app.core.database import get_database
from app.repositories.alert_repository import AlertRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.gps_repository import GpsRepository
from app.repositories.user_live_status_repository import UserLiveStatusRepository


class DashboardService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.alert_repository = AlertRepository(database)
        self.device_repository = DeviceRepository(database)
        self.gps_repository = GpsRepository(database)
        self.user_live_status_repository = UserLiveStatusRepository(database)

    def get_dashboard(self, user_id: str, auth_context: AuthContext) -> dict[str, Any]:
        self._assert_can_access_user(auth_context, user_id)

        live_status = self.user_live_status_repository.get_by_user(user_id) or {}
        devices = self.device_repository.list_by_user(user_id)
        recent_alerts = self.alert_repository.list_recent_for_user(user_id, limit=5)
        current_safety_status = live_status.get('current_safety_status')
        latest_device_seen_at = self._latest_datetime(device.get('last_seen_at') for device in devices)

        return {
            'user_id': user_id,
            'is_safe': current_safety_status == 'safe',
            'current_safety_status': current_safety_status,
            'nearest_distance_cm': live_status.get('nearest_distance_cm'),
            'today_alert_count': self.alert_repository.count_today_for_user(user_id),
            'device_count': len(devices),
            'device_last_seen_at': self._serialize_datetime(latest_device_seen_at),
            'last_seen_at': self._serialize_datetime(live_status.get('last_seen_at')),
            'last_location': live_status.get('last_location'),
            'recent_alerts': [self._serialize_alert(alert) for alert in recent_alerts],
        }

    def get_devices(self, user_id: str, auth_context: AuthContext) -> list[dict[str, Any]]:
        self._assert_can_access_user(auth_context, user_id)
        return [self._serialize_document(device) for device in self.device_repository.list_by_user(user_id)]

    def get_locations(self, user_id: str, auth_context: AuthContext, limit: int = 20) -> list[dict[str, Any]]:
        self._assert_can_access_user(auth_context, user_id)
        return [self._serialize_document(location) for location in self.gps_repository.list_for_user(user_id, limit=limit)]

    def get_today_alerts(self, user_id: str, auth_context: AuthContext) -> list[dict[str, Any]]:
        self._assert_can_access_user(auth_context, user_id)
        return [self._serialize_alert(alert) for alert in self.alert_repository.list_today_for_user(user_id)]

    def get_alerts(self, user_id: str, auth_context: AuthContext, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
        self._assert_can_access_user(auth_context, user_id)
        return [self._serialize_alert(alert) for alert in self.alert_repository.list_for_user(user_id, page=page, limit=limit)]

    def get_recent_alerts(self, user_id: str, auth_context: AuthContext, limit: int = 5) -> list[dict[str, Any]]:
        self._assert_can_access_user(auth_context, user_id)
        return [self._serialize_alert(alert) for alert in self.alert_repository.list_recent_for_user(user_id, limit=limit)]

    def get_alert_detail(self, alert_id: str, auth_context: AuthContext) -> dict[str, Any]:
        alert = self.alert_repository.get_by_id(alert_id)
        if alert is None:
            raise AppError(code='alert_not_found', message='Alert not found.', status_code=404)
        self._assert_can_access_user(auth_context, alert['user_id'])
        return self._serialize_alert(alert)

    def _assert_can_access_user(self, auth_context: AuthContext, user_id: str) -> None:
        if auth_context.role == 'user' and auth_context.user_id == user_id:
            return
        raise AppError(code='dashboard_forbidden', message='You cannot access this user data.', status_code=403)

    def _serialize_alert(self, alert: dict[str, Any]) -> dict[str, Any]:
        return self._serialize_document(alert)

    def _serialize_document(self, document: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(document)
        serialized['id'] = str(serialized.pop('_id'))
        for key, value in list(serialized.items()):
            if hasattr(value, 'isoformat'):
                serialized[key] = value.isoformat()
        return serialized

    def _latest_datetime(self, values) -> Any:
        datetimes = [value for value in values if value is not None]
        if not datetimes:
            return None
        return max(datetimes)

    def _serialize_datetime(self, value: Any) -> str | None:
        if value is None:
            return None
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        return str(value)
