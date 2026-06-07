from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app


class DemoCaneApiTest(TestCase):
    def setUp(self):
        self.client = TestClient(create_app())

    def _post_sensor(self):
        return self.client.post(
            "/api/v1/sensor",
            json={
                "device_id": "pbl5-01",
                "type": "sensor",
                "seq": 123,
                "millis": 456789,
                "distance_cm": 72.4,
                "distance_valid": True,
                "obstacle_in_1m": True,
                "alert_level": "warning",
                "gps": {
                    "fix": False,
                    "lat": 16.047079,
                    "lng": 108.206230,
                    "sats": 0,
                },
            },
        )

    def _post_frame(self):
        return self.client.post(
            "/api/v1/frame",
            data={
                "device_id": "pbl5-01",
                "type": "frame",
                "cam_seq": "45",
                "millis": "987654",
            },
            files={"image": ("esp32cam.jpg", b"\xff\xd8jpeg-bytes\xff\xd9", "image/jpeg")},
        )

    def test_sensor_endpoint_accepts_plan_payload_and_returns_scene_context(self):
        response = self._post_sensor()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertEqual(
            set(body["scene_context"]),
            {"type", "risk_level", "confidence", "age_ms", "fresh"},
        )

    def test_frame_endpoint_accepts_plan_multipart_upload(self):
        self._post_sensor()

        response = self._post_frame()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["frame_id"], "frame_45")
        self.assertEqual(body["matched_sensor"]["seq"], 123)
        self.assertIn("detection", body)

    def test_state_endpoint_returns_latest_sensor_frame_and_context(self):
        self._post_sensor()
        self._post_frame()

        response = self.client.get("/api/v1/state", params={"device_id": "pbl5-01"})

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["device_id"], "pbl5-01")
        self.assertEqual(body["latest_sensor"]["seq"], 123)
        self.assertEqual(body["latest_frame"]["frame_id"], "frame_45")
        self.assertEqual(
            set(body["scene_context"]),
            {"type", "risk_level", "confidence", "age_ms", "fresh"},
        )

    def test_latest_frame_image_url_serves_uploaded_jpeg(self):
        self._post_sensor()
        self._post_frame()

        state = self.client.get("/api/v1/state", params={"device_id": "pbl5-01"}).json()
        image_response = self.client.get(state["latest_frame"]["image_url"])

        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(image_response.headers["content-type"], "image/jpeg")
        self.assertEqual(image_response.content, b"\xff\xd8jpeg-bytes\xff\xd9")

    def test_frame_endpoint_uses_yolo_output_for_detection_and_scene_context(self):
        self.client.post(
            "/api/v1/sensor",
            json={
                "device_id": "pbl5-01",
                "type": "sensor",
                "seq": 124,
                "millis": 456999,
                "distance_cm": 180.0,
                "distance_valid": True,
                "obstacle_in_1m": False,
                "alert_level": "clear",
                "gps": {"fix": False, "lat": 16.047079, "lng": 108.206230, "sats": 0},
            },
        )

        with patch("app.api.routers.demo_cane.detect_image_bytes") as detect:
            detect.return_value = {
                "objects": [{"label": "motorcycle", "confidence": 0.83}],
                "risk_level": "high",
            }
            response = self._post_frame()

        body = response.json()
        state = self.client.get("/api/v1/state", params={"device_id": "pbl5-01"}).json()

        self.assertEqual(body["detection"]["type"], "vehicle")
        self.assertEqual(body["detection"]["risk_level"], "danger")
        self.assertEqual(body["detection"]["confidence"], 0.83)
        self.assertEqual(state["scene_context"]["type"], "vehicle")
        self.assertEqual(state["scene_context"]["risk_level"], "danger")
