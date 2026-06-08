import tempfile
from pathlib import Path
from unittest import TestCase

from app.services.demo_picture_store import DemoPictureStore


class DemoPictureStoreTest(TestCase):
    def test_save_creates_directory_jpeg_and_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = DemoPictureStore(Path(temp_dir) / "pictures")

            saved = store.save(
                frame_id="frame_1",
                image_bytes=b"jpeg-bytes",
                metadata={
                    "frame_id": "frame_1",
                    "device_id": "pbl5-01",
                    "created_at": "2026-06-08T00:00:00+00:00",
                    "scene_context": {"type": "person"},
                },
            )

            self.assertTrue((Path(temp_dir) / "pictures").is_dir())
            self.assertEqual(saved["frame_id"], "frame_1")
            self.assertEqual((Path(temp_dir) / "pictures" / "frame_1.jpg").read_bytes(), b"jpeg-bytes")
            self.assertEqual(store.get_metadata("frame_1")["scene_context"]["type"], "person")

    def test_list_pictures_returns_newest_first_and_skips_invalid_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = DemoPictureStore(Path(temp_dir))
            store.save(
                "frame_old",
                b"old",
                {"frame_id": "frame_old", "created_at": "2026-06-08T00:00:00+00:00"},
            )
            store.save(
                "frame_new",
                b"new",
                {"frame_id": "frame_new", "created_at": "2026-06-08T00:00:02+00:00"},
            )
            (Path(temp_dir) / "broken.json").write_text("{", encoding="utf-8")

            pictures = store.list_pictures()

            self.assertEqual([item["frame_id"] for item in pictures], ["frame_new", "frame_old"])

    def test_get_image_path_returns_none_for_missing_frame(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = DemoPictureStore(Path(temp_dir))

            self.assertIsNone(store.get_image_path("missing"))

    def test_reserve_frame_id_avoids_overwriting_existing_picture(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = DemoPictureStore(Path(temp_dir))
            store.save("frame_45", b"first", {"created_at": "2026-06-08T00:00:00+00:00"})

            frame_id = store.reserve_frame_id("frame_45")

            self.assertEqual(frame_id, "frame_45_1")
