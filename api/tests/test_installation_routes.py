import asyncio
from unittest import TestCase

from app.api.routers.notifications import save_push_token
from app.common.schemas.installation import PushTokenRequest


class _InstallationService:
    def __init__(self):
        self.saved = None

    def get_installation_by_fingerprint(self, device_fingerprint):
        if device_fingerprint == "fingerprint-1":
            return {"_id": "installation-1"}
        return None

    def save_push_token(self, installation_id, push_token, provider, platform=None):
        self.saved = {
            "installation_id": installation_id,
            "push_token": push_token,
            "provider": provider,
            "platform": platform,
        }
        return {
            "_id": installation_id,
            "push_token": push_token,
            "push_provider": provider,
            "platform": platform,
        }


class InstallationRouteTest(TestCase):
    def test_save_push_token_uses_installation_from_device_fingerprint(self):
        installation_service = _InstallationService()

        response = asyncio.run(
            save_push_token(
                PushTokenRequest(push_token="push-token-1", provider="fcm", platform="android"),
                x_device_fingerprint="fingerprint-1",
                installation_service=installation_service,
            )
        )

        self.assertEqual(
            installation_service.saved,
            {
                "installation_id": "installation-1",
                "push_token": "push-token-1",
                "provider": "fcm",
                "platform": "android",
            },
        )
        self.assertEqual(response["push_token"], "push-token-1")
