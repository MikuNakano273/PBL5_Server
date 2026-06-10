import argparse
import json
import mimetypes
import time
from pathlib import Path

import requests

DEFAULT_IMAGE = Path(__file__).with_name("valdemarvan2003-vietnam-8121062_1920.jpg")
DEFAULT_DEVICE_ID = "pbl5-01"


def print_response(label: str, response: requests.Response) -> dict:
    print(f"\n=== {label} ===")
    print(f"HTTP {response.status_code}")
    try:
        body = response.json()
        print(json.dumps(body, indent=2, ensure_ascii=False))
    except ValueError:
        print(response.text)
        response.raise_for_status()
        return {}

    response.raise_for_status()
    return body


def run_pipeline(server_url: str, image_path: Path, device_id: str) -> None:
    server_url = server_url.rstrip("/")
    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    now_ms = int(time.time() * 1000)
    sensor_payload = {
        "device_id": device_id,
        "type": "sensor",
        "seq": now_ms % 1_000_000,
        "millis": now_ms,
        "distance_cm": 180.0,
        "distance_valid": True,
        "obstacle_in_1m": False,
        "alert_level": "clear",
        "gps": {
            "fix": False,
            "lat": 16.047079,
            "lng": 108.206230,
            "sats": 0,
        },
    }
    sensor_response = requests.post(
        f"{server_url}/api/v1/sensor",
        json=sensor_payload,
        timeout=30,
    )
    print_response("before frame: POST /api/v1/sensor", sensor_response)

    content_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    with image_path.open("rb") as image_file:
        frame_response = requests.post(
            f"{server_url}/api/v1/frame",
            data={
                "device_id": device_id,
                "type": "frame",
                "cam_seq": str(now_ms % 1_000_000),
                "millis": str(now_ms),
            },
            files={"image": (image_path.name, image_file, content_type)},
            timeout=180,
        )
    frame_body = print_response("POST /api/v1/frame", frame_response)

    state_response = requests.get(
        f"{server_url}/api/v1/state",
        params={"device_id": device_id},
        timeout=30,
    )
    state_body = print_response("GET /api/v1/state", state_response)

    sensor_after_response = requests.post(
        f"{server_url}/api/v1/sensor",
        json={**sensor_payload, "seq": sensor_payload["seq"] + 1},
        timeout=30,
    )
    sensor_after_body = print_response(
        "after frame: POST /api/v1/sensor", sensor_after_response
    )

    print("\n=== Final result ===")
    print(
        json.dumps(
            {
                "frame_id": frame_body.get("frame_id"),
                "detection": frame_body.get("detection"),
                "scene_context_from_state": state_body.get("scene_context"),
                "scene_context_returned_to_cane": sensor_after_body.get(
                    "scene_context"
                ),
            },
            indent=2,
            ensure_ascii=False,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the complete ESP32 demo image pipeline."
    )
    parser.add_argument(
        "--server", default="http://localhost:8000", help="Server base URL"
    )
    parser.add_argument(
        "--image", type=Path, default=DEFAULT_IMAGE, help="JPEG image path"
    )
    parser.add_argument("--device-id", default=DEFAULT_DEVICE_ID, help="Demo device ID")
    args = parser.parse_args()

    run_pipeline(args.server, args.image.resolve(), args.device_id)


if __name__ == "__main__":
    main()
