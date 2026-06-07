import os
import tempfile
from functools import lru_cache
from typing import Any

from app.core.config import get_settings

VEHICLE_LABELS = {
    "bicycle",
    "car",
    "motorbike",
    "motorcycle",
    "bus",
    "truck",
    "train",
}
PERSON_LABELS = {"person"}
STATIC_OBSTACLE_LABELS = {
    "bench",
    "chair",
    "couch",
    "dining table",
    "potted plant",
    "suitcase",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
}


def _normalize_label(value: Any) -> str:
    return str(value or "").strip().lower().replace("_", " ")


def _confidence(item: dict[str, Any]) -> float:
    try:
        return float(item.get("confidence", 0) or 0)
    except (TypeError, ValueError):
        return 0


def _best_confidence(objects: list[dict[str, Any]], labels: set[str]) -> float:
    values = [_confidence(item) for item in objects if _normalize_label(item.get("label") or item.get("class")) in labels]
    return max(values, default=0)


def _scene_type(objects: list[dict[str, Any]]) -> tuple[str, float]:
    if not objects:
        return "clear", 0

    vehicle_confidence = _best_confidence(objects, VEHICLE_LABELS)
    if vehicle_confidence:
        return "vehicle", vehicle_confidence

    person_confidence = _best_confidence(objects, PERSON_LABELS)
    if person_confidence:
        return "person", person_confidence

    static_confidence = _best_confidence(objects, STATIC_OBSTACLE_LABELS)
    if static_confidence:
        return "static_obstacle", static_confidence

    return "unknown", max((_confidence(item) for item in objects), default=0)


def _risk_level(scene_type: str, yolo_result: dict[str, Any]) -> str:
    if scene_type == "clear":
        return "clear"

    raw_risk = _normalize_label(yolo_result.get("risk_level"))
    nearest_obstacle_cm = yolo_result.get("nearest_obstacle_cm")
    if raw_risk in {"high", "danger", "critical"}:
        return "danger"
    if isinstance(nearest_obstacle_cm, int | float) and nearest_obstacle_cm <= 100:
        return "danger"
    if scene_type == "unknown":
        return "info"
    return "warning"


def build_scene_context_from_yolo(yolo_result: dict[str, Any]) -> dict[str, Any]:
    objects = yolo_result.get("objects") or []
    scene_type, confidence = _scene_type(objects)
    return {
        "type": scene_type,
        "risk_level": _risk_level(scene_type, yolo_result),
        "confidence": round(confidence, 4),
        "age_ms": 0,
        "fresh": True,
    }


@lru_cache(maxsize=1)
def _load_yolo_model():
    from ultralytics import YOLO

    settings = get_settings()
    model_path = settings.yolo_model_path
    if os.path.isabs(model_path) and not os.path.isdir(os.path.dirname(model_path)):
        model_path = os.path.basename(model_path)
    return YOLO(model_path)


def detect_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    try:
        model = _load_yolo_model()
    except Exception as exc:
        return {"objects": [], "risk_level": "low", "summary_text": f"YOLO unavailable: {exc}"}

    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, "wb") as file:
            file.write(image_bytes)

        settings = get_settings()
        results = model(path, conf=settings.yolo_confidence_threshold)
        objects = []
        for result in results:
            names = result.names
            for box in result.boxes:
                cls_idx = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                objects.append(
                    {
                        "label": names.get(cls_idx, str(cls_idx)),
                        "confidence": confidence,
                        "bbox": {"x1": xyxy[0], "y1": xyxy[1], "x2": xyxy[2], "y2": xyxy[3]},
                    }
                )
        return {
            "model_name": "yolov8s",
            "model_version": "1.0",
            "objects": objects,
            "nearest_obstacle_cm": 80 if objects else None,
            "risk_level": "high" if objects else "low",
            "summary_text": f"Detected {len(objects)} object(s)",
        }
    except Exception as exc:
        return {"objects": [], "risk_level": "low", "summary_text": f"YOLO failed: {exc}"}
    finally:
        if os.path.exists(path):
            os.unlink(path)
