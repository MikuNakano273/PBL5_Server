from typing import Any

from pydantic import BaseModel, Field


class VisionResultCallbackRequest(BaseModel):
    request_id: str = Field(min_length=1)
    model_name: str = Field(min_length=1, max_length=100)
    model_version: str = Field(min_length=1, max_length=100)
    objects: list[dict[str, Any]] = Field(default_factory=list)
    nearest_obstacle_cm: float | None = None
    risk_level: str = Field(min_length=1, max_length=50)
    summary_text: str = Field(default="", max_length=1000)
