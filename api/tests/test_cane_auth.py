from unittest import TestCase

from fastapi.routing import APIRoute

from app.api.routers import cane
from app.common.exceptions.base import AppError
from app.common.utils.security import hash_password
from app.services.cane_auth_service import CaneAuthService


class _DeviceRepo:
    def __init__(self, device):
        self.device = device

    def get_by_device_code(self, device_code):
        if self.device and self.device["device_code"] == device_code:
            return self.device
        return None


class CaneAuthServiceTest(TestCase):
    def _service(self, device):
        service = CaneAuthService.__new__(CaneAuthService)
        service.device_repository = _DeviceRepo(device)
        return service

    def test_authenticates_device_code_and_secret_without_mobile_jwt(self):
        service = self._service(
            {
                "_id": "device-1",
                "device_code": "STICK-001",
                "owner_blind_user_id": "blind-1",
                "device_secret_hash": hash_password("device-secret"),
            }
        )

        context = service.authenticate_device("STICK-001", "device-secret")

        self.assertEqual(context.device_id, "device-1")
        self.assertEqual(context.device_code, "STICK-001")
        self.assertEqual(context.blind_user_id, "blind-1")

    def test_rejects_invalid_device_secret(self):
        service = self._service(
            {
                "_id": "device-1",
                "device_code": "STICK-001",
                "owner_blind_user_id": "blind-1",
                "device_secret_hash": hash_password("device-secret"),
            }
        )

        with self.assertRaises(AppError) as error:
            service.authenticate_device("STICK-001", "wrong-secret")

        self.assertEqual(error.exception.status_code, 401)


class CaneRouterAuthTest(TestCase):
    def test_all_cane_routes_require_cane_auth_dependency(self):
        routes = [route for route in cane.router.routes if isinstance(route, APIRoute)]

        for route in routes:
            dependency_names = {dependency.call.__name__ for dependency in route.dependant.dependencies}
            self.assertIn("get_current_cane_context", dependency_names, route.path)
