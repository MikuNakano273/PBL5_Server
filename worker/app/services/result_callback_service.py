from typing import Any

import requests

from app.config.settings import settings


class ResultCallbackService:
    def send_result(self, payload: dict[str, Any]) -> None:
        response = requests.post(
            f"{settings.internal_api_url}/api/internal/v1/vision/results",
            json=payload,
            headers={"Authorization": f"Bearer {settings.internal_worker_token}"},
            timeout=10,
        )
        response.raise_for_status()
