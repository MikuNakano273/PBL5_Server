from unittest import TestCase

from app.main import app
from app.common.schemas.user import UserResponse
from app.services.user_service import UserService


class _UserRepository:
    def get_by_id(self, user_id):
        return {
            "_id": user_id,
            "email": "user@example.com",
            "full_name": "Demo User",
            "phone": "0900000001",
            "role": "user",
            "status": "active",
        }


class UserProfileResponseTest(TestCase):
    def test_user_service_returns_id_and_legacy_id_with_same_value(self):
        service = UserService.__new__(UserService)
        service.user_repository = _UserRepository()

        profile = service.get_profile("user-1")

        self.assertEqual(profile["id"], "user-1")
        self.assertEqual(profile["_id"], "user-1")

    def test_user_response_serializes_id_and_legacy_id(self):
        response = UserResponse.model_validate(
            {
                **_UserRepository().get_by_id("user-1"),
                "id": "user-1",
            }
        )

        payload = response.model_dump(by_alias=True, mode="json")

        self.assertEqual(payload["id"], "user-1")
        self.assertEqual(payload["_id"], "user-1")

    def test_get_me_openapi_response_requires_id_and_legacy_id(self):
        response_schema = app.openapi()["components"]["schemas"]["UserResponse"]

        self.assertIn("id", response_schema["properties"])
        self.assertIn("_id", response_schema["properties"])
        self.assertTrue({"id", "_id"}.issubset(response_schema["required"]))
