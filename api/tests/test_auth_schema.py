import asyncio
from unittest import TestCase

from app.api.routers.auth import login
from app.common.schemas.auth import LoginRequest


class _AuthService:
    def __init__(self):
        self.issued = None

    def authenticate_user(self, email, password):
        return {"_id": "user-1", "email": email}

    def issue_token_pair_for_user(self, user_id, installation_id=None):
        self.issued = (user_id, installation_id)
        return {"access_token": "access", "refresh_token": "refresh", "token_type": "bearer"}


class AuthSchemaTest(TestCase):
    def test_login_accepts_existing_short_password(self):
        request = LoginRequest(email="namqd2000@gmail.com", password="namdq")

        self.assertEqual(request.password, "namdq")

    def test_login_schema_only_contains_email_and_password(self):
        self.assertEqual(set(LoginRequest.model_fields), {"email", "password"})

    def test_login_accepts_only_email_and_password(self):
        request = LoginRequest(email="namqd2000@gmail.com", password="namdq")
        auth_service = _AuthService()

        response = asyncio.run(login(request, auth_service))

        self.assertEqual(response["access_token"], "access")
        self.assertEqual(auth_service.issued, ("user-1", None))
