import json
import re
from pathlib import Path
from typing import Any

FRAME_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


class DemoPictureStore:
    def __init__(self, pictures_dir: Path):
        self.pictures_dir = pictures_dir

    def _ensure_dir(self) -> None:
        self.pictures_dir.mkdir(parents=True, exist_ok=True)

    def _validate_frame_id(self, frame_id: str) -> None:
        if not FRAME_ID_PATTERN.fullmatch(frame_id):
            raise ValueError("Invalid frame ID")

    def reserve_frame_id(self, base_frame_id: str) -> str:
        self._validate_frame_id(base_frame_id)
        self._ensure_dir()
        if not (self.pictures_dir / f"{base_frame_id}.jpg").exists() and not (self.pictures_dir / f"{base_frame_id}.json").exists():
            return base_frame_id

        index = 1
        while True:
            frame_id = f"{base_frame_id}_{index}"
            if not (self.pictures_dir / f"{frame_id}.jpg").exists() and not (self.pictures_dir / f"{frame_id}.json").exists():
                return frame_id
            index += 1

    def save(self, frame_id: str, image_bytes: bytes, metadata: dict[str, Any]) -> dict[str, Any]:
        self._validate_frame_id(frame_id)
        self._ensure_dir()
        image_path = self.pictures_dir / f"{frame_id}.jpg"
        metadata_path = self.pictures_dir / f"{frame_id}.json"
        stored_metadata = {
            **metadata,
            "frame_id": frame_id,
            "image_url": f"/api/v1/uploads/{frame_id}.jpg",
        }
        image_path.write_bytes(image_bytes)
        metadata_path.write_text(
            json.dumps(stored_metadata, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return stored_metadata

    def list_pictures(self) -> list[dict[str, Any]]:
        self._ensure_dir()
        pictures = []
        for metadata_path in self.pictures_dir.glob("*.json"):
            try:
                pictures.append(json.loads(metadata_path.read_text(encoding="utf-8")))
            except (OSError, ValueError, TypeError):
                continue
        return sorted(pictures, key=lambda item: str(item.get("created_at", "")), reverse=True)

    def get_metadata(self, frame_id: str) -> dict[str, Any] | None:
        self._validate_frame_id(frame_id)
        metadata_path = self.pictures_dir / f"{frame_id}.json"
        if not metadata_path.is_file():
            return None
        try:
            return json.loads(metadata_path.read_text(encoding="utf-8"))
        except (OSError, ValueError, TypeError):
            return None

    def get_image_path(self, frame_id: str) -> Path | None:
        self._validate_frame_id(frame_id)
        image_path = self.pictures_dir / f"{frame_id}.jpg"
        return image_path if image_path.is_file() else None
