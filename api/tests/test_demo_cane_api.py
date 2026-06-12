import tempfile
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

from app.main import create_app
from app.services.demo_picture_store import DemoPictureStore
from fastapi.testclient import TestClient


class DemoCaneApiTest(TestCase):
    def setUp(self):
        self.picture_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.picture_dir.cleanup)
        store_patcher = patch(
            "app.api.routers.demo_cane.get_picture_store",
            return_value=DemoPictureStore(Path(self.picture_dir.name)),
        )
        store_patcher.start()
        self.addCleanup(store_patcher.stop)
        persistence_patcher = patch("app.api.routers.demo_cane.get_demo_frame_persistence_service")
        persistence_service = persistence_patcher.start().return_value
        persistence_service.persist_frame.return_value = {"persisted": True}
        self.addCleanup(persistence_patcher.stop)
        sensor_persistence_patcher = patch("app.api.routers.demo_cane.get_demo_sensor_persistence_service")
        sensor_persistence_service = sensor_persistence_patcher.start().return_value
        sensor_persistence_service.persist_sensor.return_value = {"persisted": True}
        self.addCleanup(sensor_persistence_patcher.stop)
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
            files={
                "image": ("esp32cam.jpg", b"\xff\xd8jpeg-bytes\xff\xd9", "image/jpeg")
            },
        )

    def test_sensor_endpoint_accepts_plan_payload_and_returns_scene_context(self):
        response = self._post_sensor()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertTrue(body["persistence"]["persisted"])
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

    def test_state_without_device_id_returns_most_recent_frame_device(self):
        self._post_frame()
        self.client.post(
            "/api/v1/frame",
            data={
                "device_id": "pbl5-02",
                "type": "frame",
                "cam_seq": "46",
                "millis": "987655",
            },
            files={"image": ("newest.jpg", b"\xff\xd8newest\xff\xd9", "image/jpeg")},
        )

        response = self.client.get("/api/v1/state")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["device_id"], "pbl5-02")
        self.assertEqual(body["latest_frame"]["frame_id"], "frame_46")

    def test_state_without_device_id_returns_most_recent_sensor_device_without_frame(self):
        response = self.client.post(
            "/api/v1/sensor",
            json={
                "device_id": "sensor-only-cane",
                "type": "sensor",
                "seq": 901,
                "millis": 654321,
                "distance_cm": 38.5,
                "distance_valid": True,
                "obstacle_in_1m": True,
                "alert_level": "danger",
                "gps": {
                    "fix": True,
                    "lat": 16.123456,
                    "lng": 108.654321,
                    "sats": 7,
                },
            },
        )
        self.assertEqual(response.status_code, 200)

        state = self.client.get("/api/v1/state").json()

        self.assertEqual(state["device_id"], "sensor-only-cane")
        self.assertEqual(state["latest_sensor"]["seq"], 901)
        self.assertEqual(state["latest_sensor"]["distance_cm"], 38.5)
        self.assertEqual(state["latest_sensor"]["gps"]["lat"], 16.123456)
        self.assertIsNone(state["latest_frame"]["frame_id"])

    def test_latest_frame_image_url_serves_uploaded_jpeg(self):
        self._post_sensor()
        self._post_frame()

        state = self.client.get("/api/v1/state", params={"device_id": "pbl5-01"}).json()
        self.assertEqual(state["latest_frame"]["image_url"], "/uploads/frame_45.jpg")
        image_response = self.client.get(state["latest_frame"]["image_url"])

        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(image_response.headers["content-type"], "image/jpeg")
        self.assertEqual(image_response.content, b"\xff\xd8jpeg-bytes\xff\xd9")

    def test_legacy_api_upload_url_still_serves_uploaded_jpeg(self):
        self._post_sensor()
        self._post_frame()

        image_response = self.client.get("/api/v1/uploads/frame_45.jpg")

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
        self.assertEqual(body["detection"]["risk_level"], "warning")
        self.assertEqual(body["detection"]["confidence"], 0.83)
        self.assertEqual(state["scene_context"]["type"], "vehicle")
        self.assertEqual(state["scene_context"]["risk_level"], "warning")

    def test_frame_upload_persists_picture_and_gallery_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("app.api.routers.demo_cane.get_picture_store") as get_store:
                get_store.return_value = DemoPictureStore(Path(temp_dir))
                with patch("app.api.routers.demo_cane.detect_image_bytes") as detect:
                    detect.return_value = {
                        "objects": [
                            {
                                "label": "person",
                                "confidence": 0.91,
                                "bbox": {"x1": 10, "y1": 20, "x2": 100, "y2": 200},
                            }
                        ],
                        "risk_level": "warning",
                        "image_width": 640,
                        "image_height": 480,
                    }
                    frame_body = self._post_frame().json()

                pictures = self.client.get("/api/v1/pictures").json()
                detail = self.client.get(f"/api/v1/pictures/{frame_body['frame_id']}").json()

            self.assertEqual(len(pictures), 1)
            self.assertEqual(detail["scene_context"]["type"], "person")
            self.assertEqual(detail["objects"][0]["label"], "person")
            self.assertEqual(detail["image_width"], 640)
            self.assertEqual(detail["image_height"], 480)
            self.assertTrue((Path(temp_dir) / f"{frame_body['frame_id']}.jpg").is_file())
            self.assertTrue((Path(temp_dir) / f"{frame_body['frame_id']}.json").is_file())

    def test_frame_upload_persists_admin_image_request_and_alert_data(self):
        with patch("app.api.routers.demo_cane.get_demo_frame_persistence_service") as get_service:
            service = get_service.return_value
            service.persist_frame.return_value = {
                "persisted": True,
                "image_request_id": "request-1",
                "alert": {"created": True, "id": "alert-1"},
            }

            response = self._post_frame()

        self.assertEqual(response.status_code, 200)
        service.persist_frame.assert_called_once()
        call = service.persist_frame.call_args.kwargs
        self.assertEqual(call["device_code"], "pbl5-01")
        self.assertEqual(call["frame_id"], "frame_45")
        self.assertEqual(call["image_url"], "/uploads/frame_45.jpg")
