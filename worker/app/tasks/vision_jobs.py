from typing import Any

from app.services.vision_worker import VisionJobProcessor


def process_vision_job(payload: dict[str, Any]) -> dict[str, Any]:
    return VisionJobProcessor().process(payload)
