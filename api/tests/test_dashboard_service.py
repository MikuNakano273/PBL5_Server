from datetime import UTC, datetime
from unittest import TestCase

from app.common.exceptions.base import AppError
from app.common.schemas.auth import AuthContext
from app.services.dashboard_service import DashboardService


class _LiveStatusRepo:
    def __init__(self, live_status):
        self.live_status = live_status

    def get_by_blind_user(self, blind_user_id):
        return self.live_status


class _DeviceRepo:
    def __init__(self, devices):
        self.devices = devices

    def list_by_blind_user(self, blind_user_id):
        return self.devices


class _AlertRepo:
    def __init__(self, recent_alerts, today_count, today_alerts=None, history_alerts=None, detail_alert=None):
        self.recent_alerts = recent_alerts
        self.today_count = today_count
        self.today_alerts = today_alerts if today_alerts is not None else recent_alerts
        self.history_alerts = history_alerts if history_alerts is not None else recent_alerts
        self.detail_alert = detail_alert

    def count_today_for_blind_user(self, blind_user_id):
        return self.today_count

    def list_recent_for_blind_user(self, blind_user_id, limit=5):
        return self.recent_alerts[:limit]

    def list_today_for_blind_user(self, blind_user_id):
        return self.today_alerts

    def list_for_blind_user(self, blind_user_id, page=1, limit=20):
        return self.history_alerts[:limit]

    def get_by_id(self, alert_id):
        return self.detail_alert


class _GpsRepo:
    def __init__(self, locations):
        self.locations = locations

    def list_for_blind_user(self, blind_user_id, limit=20):
        return self.locations[:limit]


class _CareLinkRepo:
    def __init__(self, care_link):
        self.care_link = care_link

    def get_by_pair(self, blind_user_id, family_user_id):
        return self.care_link


class DashboardServiceTest(TestCase):
    def _service(
        self,
        live_status=None,
        devices=None,
        alerts=None,
        today_count=0,
        care_link=None,
        locations=None,
        today_alerts=None,
        history_alerts=None,
        detail_alert=None,
    ):
        service = DashboardService.__new__(DashboardService)
        service.user_live_status_repository = _LiveStatusRepo(live_status)
        service.device_repository = _DeviceRepo(devices or [])
        service.alert_repository = _AlertRepo(
            alerts or [],
            today_count,
            today_alerts=today_alerts,
            history_alerts=history_alerts,
            detail_alert=detail_alert,
        )
        service.gps_repository = _GpsRepo(locations or [])
        service.care_link_repository = _CareLinkRepo(care_link)
        return service

    def test_dashboard_aggregates_live_status_alerts_and_latest_device_state(self):
        first_seen = datetime(2026, 4, 25, 7, 0, tzinfo=UTC)
        latest_seen = datetime(2026, 4, 25, 7, 5, tzinfo=UTC)
        last_user_seen = datetime(2026, 4, 25, 7, 6, tzinfo=UTC)
        alert_time = datetime(2026, 4, 25, 7, 7, tzinfo=UTC)
        location = {"type": "Point", "coordinates": [108.2022, 16.0544]}
        service = self._service(
            live_status={
                "blind_user_id": "blind-1",
                "current_safety_status": "safe",
                "nearest_distance_cm": 120,
                "last_location": location,
                "last_seen_at": last_user_seen,
            },
            devices=[
                {"_id": "device-1", "last_seen_at": first_seen},
                {"_id": "device-2", "last_seen_at": latest_seen},
            ],
            alerts=[
                {
                    "_id": "alert-1",
                    "title": "Obstacle",
                    "message": "Obstacle ahead",
                    "risk_level": "warning",
                    "triggered_at": alert_time,
                }
            ],
            today_count=3,
        )

        dashboard = service.get_dashboard(
            "blind-1",
            AuthContext(user_id="blind-1", role="user", user_type="blind", installation_id="inst-1"),
        )

        self.assertEqual(dashboard["blind_user_id"], "blind-1")
        self.assertTrue(dashboard["is_safe"])
        self.assertEqual(dashboard["current_safety_status"], "safe")
        self.assertEqual(dashboard["nearest_distance_cm"], 120)
        self.assertEqual(dashboard["today_alert_count"], 3)
        self.assertEqual(dashboard["device_count"], 2)
        self.assertEqual(dashboard["device_last_seen_at"], latest_seen.isoformat())
        self.assertEqual(dashboard["last_seen_at"], last_user_seen.isoformat())
        self.assertEqual(dashboard["last_location"], location)
        self.assertEqual(dashboard["recent_alerts"][0]["triggered_at"], alert_time.isoformat())

    def test_family_user_requires_active_care_link_for_dashboard_access(self):
        service = self._service(care_link={"status": "inactive"})

        with self.assertRaises(AppError) as error:
            service.get_dashboard(
                "blind-1",
                AuthContext(user_id="family-1", role="user", user_type="family", installation_id="inst-1"),
            )

        self.assertEqual(error.exception.status_code, 403)

    def test_blind_user_read_apis_return_serialized_devices_locations_alerts_and_detail(self):
        recorded_at = datetime(2026, 4, 25, 8, 0, tzinfo=UTC)
        triggered_at = datetime(2026, 4, 25, 8, 1, tzinfo=UTC)
        alert = {
            "_id": "alert-1",
            "blind_user_id": "blind-1",
            "title": "Obstacle",
            "message": "Obstacle ahead",
            "risk_level": "warning",
            "triggered_at": triggered_at,
        }
        service = self._service(
            devices=[{"_id": "device-1", "name": "Primary cane", "last_seen_at": recorded_at}],
            locations=[{"_id": "gps-1", "blind_user_id": "blind-1", "recorded_at": recorded_at}],
            alerts=[alert],
            today_alerts=[alert],
            history_alerts=[alert],
            detail_alert=alert,
        )
        auth_context = AuthContext(user_id="blind-1", role="user", user_type="blind", installation_id="inst-1")

        devices = service.get_devices("blind-1", auth_context)
        locations = service.get_locations("blind-1", auth_context, limit=10)
        today_alerts = service.get_today_alerts("blind-1", auth_context)
        history_alerts = service.get_alerts("blind-1", auth_context, page=1, limit=10)
        recent_alerts = service.get_recent_alerts("blind-1", auth_context, limit=10)
        detail = service.get_alert_detail("alert-1", auth_context)

        self.assertEqual(devices[0]["id"], "device-1")
        self.assertEqual(devices[0]["last_seen_at"], recorded_at.isoformat())
        self.assertEqual(locations[0]["id"], "gps-1")
        self.assertEqual(locations[0]["recorded_at"], recorded_at.isoformat())
        self.assertEqual(today_alerts[0]["id"], "alert-1")
        self.assertEqual(history_alerts[0]["id"], "alert-1")
        self.assertEqual(recent_alerts[0]["id"], "alert-1")
        self.assertEqual(detail["id"], "alert-1")
        self.assertEqual(detail["triggered_at"], triggered_at.isoformat())
