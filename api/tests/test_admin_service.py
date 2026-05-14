import asyncio
from datetime import UTC, datetime
from unittest import TestCase

from app.api.routers.admin import list_users
from app.common.schemas.admin import AdminUserUpdateRequest
from app.services.admin_service import AdminService


class _UserRepo:
    def __init__(self):
        self.updated = None

    def list_users(self, page=1, limit=20):
        return [
            {
                "_id": "user-1",
                "email": "blind@example.com",
                "full_name": "Blind User",
                "phone": None,
                "role": "user",
                "status": "active",
                "created_at": datetime(2026, 4, 25, 8, 0, tzinfo=UTC),
            }
        ]

    def get_by_id(self, user_id):
        return {
            "_id": user_id,
            "email": "blind@example.com",
            "full_name": "Updated User" if self.updated else "Blind User",
            "role": "user",
            "status": "active",
        }

    def update_admin_fields(self, user_id, payload):
        self.updated = {"user_id": user_id, **payload}
        return 1


class _DeviceRepo:
    def __init__(self):
        self.assigned = None

    def list_all(self, page=1, limit=20):
        return [{"_id": "device-1", "device_code": "STICK-001", "owner_user_id": None}]

    def get_by_id(self, device_id):
        return {"_id": device_id, "device_code": "STICK-001", "owner_user_id": self.assigned}

    def assign_device(self, device_id, user_id):
        self.assigned = user_id
        return 1


class _ImageRequestRepo:
    def list_all(self, page=1, limit=20):
        return [{"_id": "request-1", "status": "done", "ai_status": "done"}]


class _AlertRepo:
    def list_all(self, page=1, limit=20):
        return [{"_id": "alert-1", "title": "Obstacle", "risk_level": "high"}]


class _AdminService:
    def list_users(self, page=1, limit=20):
        self.list_args = (page, limit)
        return [{"id": "user-1"}]


class AdminServiceTest(TestCase):
    def _service(self):
        service = AdminService.__new__(AdminService)
        service.user_repository = _UserRepo()
        service.device_repository = _DeviceRepo()
        service.image_request_repository = _ImageRequestRepo()
        service.alert_repository = _AlertRepo()
        return service

    def test_lists_admin_resources_with_serialized_ids_and_datetimes(self):
        service = self._service()

        self.assertEqual(service.list_users()[0]["id"], "user-1")
        self.assertEqual(service.list_users()[0]["created_at"], "2026-04-25T08:00:00+00:00")
        self.assertEqual(service.list_devices()[0]["id"], "device-1")
        self.assertEqual(service.list_image_requests()[0]["id"], "request-1")
        self.assertEqual(service.list_alerts()[0]["id"], "alert-1")

    def test_update_user_and_assign_device_return_reloaded_documents(self):
        service = self._service()

        updated_user = service.update_user(
            "user-1",
            AdminUserUpdateRequest(full_name="Updated User", phone=None, status="active"),
        )
        assigned_device = service.assign_device("device-1", "user-1")

        self.assertEqual(service.user_repository.updated["full_name"], "Updated User")
        self.assertEqual(updated_user["full_name"], "Updated User")
        self.assertEqual(service.device_repository.assigned, "user-1")
        self.assertEqual(assigned_device["owner_user_id"], "user-1")

    def test_list_users_route_delegates_after_admin_context(self):
        service = _AdminService()

        response = asyncio.run(list_users({"role": "admin", "user_id": "admin-1"}, service))

        self.assertEqual(response, [{"id": "user-1"}])
        self.assertEqual(service.list_args, (1, 20))
