from datetime import UTC, datetime
from pathlib import Path
from time import monotonic

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services.demo_picture_store import DemoPictureStore
from app.services.demo_frame_persistence_service import DemoFramePersistenceService
from app.services.demo_scene_context import build_scene_context_from_yolo, detect_image_bytes
from app.services.demo_sensor_persistence_service import DemoSensorPersistenceService

router = APIRouter()

CONTEXT_MAX_AGE_MS = 7000


class DemoGpsPayload(BaseModel):
    fix: bool = False
    lat: float
    lng: float
    sats: int = Field(default=0, ge=0)


class DemoSensorPayload(BaseModel):
    device_id: str = Field(min_length=1, max_length=100)
    type: str = "sensor"
    seq: int = Field(ge=0)
    millis: int = Field(ge=0)
    distance_cm: float = Field(ge=0)
    distance_valid: bool = True
    obstacle_in_1m: bool = False
    alert_level: str = "clear"
    gps: DemoGpsPayload


_latest_sensor_by_device: dict[str, dict] = {}
_latest_frame_by_device: dict[str, dict] = {}
_latest_event_at_by_device: dict[str, datetime] = {}
_frame_bytes_by_id: dict[str, bytes] = {}
_scene_context_by_device: dict[str, dict] = {}


def get_picture_store() -> DemoPictureStore:
    return DemoPictureStore(Path(get_settings().pictures_dir))


def get_demo_frame_persistence_service() -> DemoFramePersistenceService:
    return DemoFramePersistenceService()


def get_demo_sensor_persistence_service() -> DemoSensorPersistenceService:
    return DemoSensorPersistenceService()


def _now_ms() -> int:
    return int(monotonic() * 1000)


def _default_scene_context() -> dict:
    return {
        "type": "stale",
        "risk_level": "clear",
        "confidence": 0,
        "age_ms": CONTEXT_MAX_AGE_MS + 1,
        "fresh": False,
    }


def _context_for_device(device_id: str) -> dict:
    stored = _scene_context_by_device.get(device_id)
    if not stored:
        return _default_scene_context()

    context = dict(stored["context"])
    context["age_ms"] = max(0, _now_ms() - stored["updated_at_ms"])
    context["fresh"] = context["age_ms"] <= CONTEXT_MAX_AGE_MS
    if not context["fresh"]:
        context["type"] = "stale"
        context["risk_level"] = "clear"
    return context


def _store_scene_context(device_id: str, detection: dict) -> None:
    _scene_context_by_device[device_id] = {
        "context": {
            "type": detection["type"],
            "risk_level": detection["risk_level"],
            "confidence": detection["confidence"],
            "age_ms": 0,
            "fresh": True,
        },
        "updated_at_ms": _now_ms(),
    }


def _latest_picture_for_device(device_id: str | None = None) -> dict | None:
    pictures = get_picture_store().list_pictures()
    if device_id is None:
        return pictures[0] if pictures else None
    return next((picture for picture in pictures if picture.get("device_id") == device_id), None)


def _parse_created_at(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _latest_device_id(picture: dict | None) -> str:
    candidates = dict(_latest_event_at_by_device)
    if picture and picture.get("device_id"):
        created_at = _parse_created_at(picture.get("created_at"))
        if created_at is not None:
            device_id = str(picture["device_id"])
            candidates[device_id] = max(candidates.get(device_id, created_at), created_at)
    if not candidates:
        return "unknown"
    return max(candidates, key=candidates.__getitem__)


@router.post("/sensor")
async def ingest_sensor(payload: DemoSensorPayload) -> dict:
    sensor = payload.model_dump()
    _latest_sensor_by_device[payload.device_id] = sensor
    _latest_event_at_by_device[payload.device_id] = datetime.now(UTC)
    persistence = get_demo_sensor_persistence_service().persist_sensor(sensor)
    return {
        "ok": True,
        "persistence": persistence,
        "scene_context": _context_for_device(payload.device_id),
    }


@router.post("/frame")
async def upload_frame(
    device_id: str = Form(...),
    type: str = Form("frame"),
    cam_seq: int = Form(...),
    millis: int = Form(...),
    image: UploadFile = File(...),
) -> dict:
    image_bytes = await image.read()

    sensor = _latest_sensor_by_device.get(device_id)
    yolo_result = detect_image_bytes(image_bytes)
    detection = build_scene_context_from_yolo(yolo_result, sensor)
    _store_scene_context(device_id, detection)

    picture_store = get_picture_store()
    frame_id = picture_store.reserve_frame_id(f"frame_{cam_seq}")
    created_at_value = datetime.now(UTC)
    created_at = created_at_value.isoformat()
    metadata = picture_store.save(
        frame_id,
        image_bytes,
        {
            "device_id": device_id,
            "type": type,
            "cam_seq": cam_seq,
            "millis": millis,
            "created_at": created_at,
            "matched_sensor": {
                "seq": sensor["seq"] if sensor else None,
                "distance_cm": sensor["distance_cm"] if sensor else None,
                "gps": sensor["gps"] if sensor else None,
            },
            "objects": yolo_result.get("objects", []),
            "image_width": yolo_result.get("image_width"),
            "image_height": yolo_result.get("image_height"),
            "scene_context": detection,
        },
    )
    _frame_bytes_by_id[frame_id] = image_bytes
    frame = {
        "frame_id": frame_id,
        "image_url": metadata["image_url"],
        "type": type,
        "cam_seq": cam_seq,
        "millis": millis,
    }
    _latest_frame_by_device[device_id] = frame
    _latest_event_at_by_device[device_id] = datetime.now(UTC)
    persistence = get_demo_frame_persistence_service().persist_frame(
        device_code=device_id,
        frame_id=frame_id,
        image_url=metadata["image_url"],
        created_at=created_at_value,
        sensor=sensor,
        yolo_result=yolo_result,
        scene_context=detection,
    )

    return {
        "ok": True,
        "frame_id": frame_id,
        "persistence": persistence,
        "matched_sensor": {
            "seq": sensor["seq"] if sensor else None,
            "distance_cm": sensor["distance_cm"] if sensor else None,
            "gps": sensor["gps"] if sensor else None,
        },
        "detection": detection,
    }


@router.get("/state")
async def get_state(device_id: str | None = None) -> dict:
    picture = _latest_picture_for_device(device_id)
    if device_id is None:
        device_id = _latest_device_id(picture)
        picture = _latest_picture_for_device(device_id)

    sensor = _latest_sensor_by_device.get(device_id)
    frame = _latest_frame_by_device.get(device_id)
    if frame is None and picture is not None:
        frame = {
            "frame_id": picture.get("frame_id"),
            "image_url": picture.get("image_url"),
        }
    if sensor is None and picture is not None:
        sensor = picture.get("matched_sensor")

    scene_context = _context_for_device(device_id)
    if scene_context["type"] == "stale" and picture and picture.get("scene_context"):
        scene_context = {
            **_default_scene_context(),
            **picture["scene_context"],
            "fresh": False,
        }

    return {
        "device_id": device_id,
        "latest_sensor": {
            "seq": sensor["seq"] if sensor else None,
            "distance_cm": sensor["distance_cm"] if sensor else None,
            "obstacle_in_1m": sensor.get("obstacle_in_1m", False) if sensor else False,
            "alert_level": sensor.get("alert_level", "clear") if sensor else "clear",
            "gps": sensor.get("gps") if sensor else None,
        },
        "latest_frame": {
            "frame_id": frame["frame_id"] if frame else None,
            "image_url": frame["image_url"] if frame else None,
        },
        "scene_context": scene_context,
    }


@router.get("/pictures")
async def list_pictures() -> list[dict]:
    return get_picture_store().list_pictures()


@router.get("/pictures/{frame_id}")
async def get_picture(frame_id: str) -> dict:
    metadata = get_picture_store().get_metadata(frame_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Picture not found")
    return metadata


@router.get("/uploads/{frame_id}.jpg")
async def get_uploaded_frame(frame_id: str) -> Response:
    image_path = get_picture_store().get_image_path(frame_id)
    if image_path is not None:
        return FileResponse(image_path, media_type="image/jpeg")
    image_bytes = _frame_bytes_by_id.get(frame_id)
    if image_bytes is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    return Response(content=image_bytes, media_type="image/jpeg")
