import asyncio
from unittest import TestCase

from app.api.deps import get_current_admin_context
from app.api.routers.admin import admin_login
from app.common.exceptions.base import AppError
from app.common.schemas.admin import AdminLoginRequest
from app.common.utils.security import create_access_token, decode_token, hash_password
from app.services.admin_auth_service import AdminAuthService
from app.services.auth_service import AuthService


class _UserRepo:
    def __init__(self, user):
        self.user = user

    def get_by_email(self, email):
        if self.user and self.user["email"] == email:
            return self.user
        return None


class _AdminAuthService:
    def __init__(self):
        self.login_args = None

    def login(self, email, password):
        self.login_args = (email, password)
        return {"access_token": "admin-token", "token_type": "bearer"}


class _RefreshTokenRepo:
    def __init__(self):
        self.created_token = None

    def create_refresh_token(self, payload):
        self.created_token = payload


class AdminAuthTest(TestCase):
    def test_admin_login_issues_admin_scoped_access_token(self):
        service = AdminAuthService.__new__(AdminAuthService)
        service.user_repository = _UserRepo(
            {
                "_id": "admin-1",
                "email": "admin@example.com",
                "password_hash": hash_password("password123"),
                "role": "admin",
                "status": "active",
            }
        )

        response = service.login("admin@example.com", "password123")
        payload = decode_token(response["access_token"])

        self.assertEqual(response["token_type"], "bearer")
        self.assertEqual(payload["sub"], "admin-1")
        self.assertEqual(payload["role"], "admin")
        self.assertEqual(payload["token_use"], "admin")
        self.assertNotIn("user_type", payload)

    def test_admin_login_rejects_non_admin_user(self):
        service = AdminAuthService.__new__(AdminAuthService)
        service.user_repository = _UserRepo(
            {
                "_id": "user-1",
                "email": "user@example.com",
                "password_hash": hash_password("password123"),
                "role": "user",
                "status": "active",
            }
        )

        with self.assertRaises(AppError) as error:
            service.login("user@example.com", "password123")

        self.assertEqual(error.exception.status_code, 403)

    def test_admin_guard_accepts_only_admin_scoped_token(self):
        token = create_access_token("admin-1", {"role": "admin", "token_use": "admin"})

        context = get_current_admin_context(authorization=f"Bearer {token}")

        self.assertEqual(context["user_id"], "admin-1")
        self.assertEqual(context["role"], "admin")

    def test_admin_guard_rejects_mobile_user_token(self):
        token = create_access_token("user-1", {"role": "user", "token_use": "mobile"})

        with self.assertRaises(AppError) as error:
            get_current_admin_context(authorization=f"Bearer {token}")

        self.assertEqual(error.exception.status_code, 403)

    def test_admin_login_route_delegates_to_admin_auth_service(self):
        service = _AdminAuthService()

        response = asyncio.run(admin_login(AdminLoginRequest(email="admin@example.com", password="password123"), service))

        self.assertEqual(response["access_token"], "admin-token")
        self.assertEqual(service.login_args, ("admin@example.com", "password123"))

    def test_mobile_access_token_does_not_include_user_type(self):
        service = AuthService.__new__(AuthService)
        service.refresh_token_repository = _RefreshTokenRepo()

        response = service._issue_token_pair(
            {
                "_id": "user-1",
                "email": "user@example.com",
                "password_hash": hash_password("password123"),
                "role": "user",
                "status": "active",
            },
            installation_id="inst-1",
        )
        payload = decode_token(response.access_token)

        self.assertEqual(payload["sub"], "user-1")
        self.assertEqual(payload["role"], "user")
        self.assertEqual(payload["installation_id"], "inst-1")
        self.assertNotIn("user_type", payload)
