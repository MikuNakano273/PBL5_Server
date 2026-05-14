from datetime import datetime

from pydantic import BaseModel, Field


class CaneAuthContext(BaseModel):
    device_id: str
    device_code: str
    user_id: str


class CaneGpsRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)
    speed: float | None = Field(default=None, ge=0)
    heading: float | None = Field(default=None, ge=0, le=360)
    recorded_at: datetime | None = None


class CaneDistanceRequest(BaseModel):
    distance_cm: float = Field(ge=0)
    detected: bool = True
    sensor_type: str | None = Field(default=None, max_length=50)
    recorded_at: datetime | None = None


class CaneHeartbeatRequest(BaseModel):
    battery: int | None = Field(default=None, ge=0, le=100)
    firmware_version: str | None = Field(default=None, max_length=50)
    seen_at: datetime | None = None


class CaneImageRequestCreate(BaseModel):
    captured_at: datetime | None = None
    distance_cm: float | None = Field(default=None, ge=0)
    gps_snapshot: dict | None = None
    metadata: dict = Field(default_factory=dict)


class CaneImageUploadRequest(BaseModel):
    image_path: str | None = Field(default=None, min_length=1, max_length=1024)
