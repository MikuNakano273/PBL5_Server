from typing import Any


class PushNotificationService:
    def send(self, installation: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
        push_token = installation.get("push_token")
        if not push_token:
            return {"sent": False, "reason": "missing_push_token"}
        return {
            "sent": True,
            "provider": installation.get("push_provider"),
            "push_token": push_token,
            "event_id": str(event["_id"]),
        }
