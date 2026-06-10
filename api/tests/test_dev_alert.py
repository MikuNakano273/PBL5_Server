import asyncio
from unittest import TestCase
from unittest.mock import patch

from app.api.deps import get_current_auth_context
from app.api.routers import dev
from app.common.exceptions.base import AppError
from app.common.schemas.auth import AuthContext
from app.core.config import Settings
from app.main import create_app
from app.services.dev_service import DevService


class _DevService:
    def __init__(self):
        self.user_id = None

    def create_test_alert(self, user_id):
        self.user_id = user_id
        return {
            "id": "alert-1",
            "user_id": user_id,
            "device_id": "device-1",
            "risk_level": "high",
            "alert_type": "OBSTACLE",
        }


class _DeviceRepo:
    def __init__(self, devices):
        self.devices = devices

    def list_by_user(self, user_id):
        self.user_id = user_id
        return self.devices


class _AlertService:
    def __init__(self):
        self.args = None

    def create_test_alert(self, *, user_id, device_id):
        self.args = {"user_id": user_id, "device_id": device_id}
        return {
            "created": True,
            "id": "alert-1",
            "alert": {
                "user_id": user_id,
                "device_id": device_id,
                "risk_level": "high",
                "alert_type": "OBSTACLE",
            },
        }


class DevAlertRouteTest(TestCase):
    def test_route_uses_authenticated_mobile_user_and_returns_alert(self):
        auth_context = AuthContext(user_id="user-from-token", role="user", installation_id="installation-1")
        service = _DevService()

        response = asyncio.run(dev.create_test_alert(auth_context, service))

        self.assertEqual(service.user_id, "user-from-token")
        self.assertEqual(response["id"], "alert-1")
        self.assertEqual(response["risk_level"], "high")
        self.assertEqual(response["alert_type"], "OBSTACLE")

    def test_route_requires_mobile_auth_dependency(self):
        route = next(route for route in dev.router.routes if route.path == "/test-alert")
        dependency_calls = {dependency.call for dependency in route.dependant.dependencies}

        self.assertIn(get_current_auth_context, dependency_calls)
        self.assertEqual(len(route.dependant.dependencies), 3)

    def test_route_is_not_registered_in_production(self):
        settings = Settings(_env_file=None, APP_ENV="production", ENABLE_DEV_ENDPOINTS=False)

        with patch("app.main.get_settings", return_value=settings):
            app = create_app()

        self.assertNotIn("/api/mobile/v1/dev/test-alert", {route.path for route in app.routes})

    def test_route_is_registered_outside_production(self):
        settings = Settings(_env_file=None, APP_ENV="development")

        with patch("app.main.get_settings", return_value=settings):
            app = create_app()

        self.assertIn("/api/mobile/v1/dev/test-alert", {route.path for route in app.routes})

    def test_route_can_be_explicitly_enabled_in_production(self):
        settings = Settings(_env_file=None, APP_ENV="production", ENABLE_DEV_ENDPOINTS=True)

        with patch("app.main.get_settings", return_value=settings):
            app = create_app()

        self.assertIn("/api/mobile/v1/dev/test-alert", {route.path for route in app.routes})


class DevServiceTest(TestCase):
    def _service(self, devices):
        service = DevService.__new__(DevService)
        service.device_repository = _DeviceRepo(devices)
        service.alert_service = _AlertService()
        return service

    def test_create_test_alert_uses_current_users_device_and_returns_alert_object(self):
        service = self._service([{"_id": "device-1", "owner_user_id": "user-1"}])

        alert = service.create_test_alert("user-1")

        self.assertEqual(service.alert_service.args, {"user_id": "user-1", "device_id": "device-1"})
        self.assertEqual(alert["id"], "alert-1")
        self.assertEqual(alert["risk_level"], "high")
        self.assertEqual(alert["alert_type"], "OBSTACLE")

    def test_create_test_alert_rejects_user_without_device(self):
        service = self._service([])

        with self.assertRaises(AppError) as error:
            service.create_test_alert("user-1")

        self.assertEqual(error.exception.code, "device_not_found")
        self.assertEqual(error.exception.status_code, 404)
