from unittest import TestCase

from app.services.demo_scene_context import build_scene_context_from_yolo


class DemoSceneContextTest(TestCase):
    def test_maps_person_detection_to_warning_context(self):
        context = build_scene_context_from_yolo(
            {
                "objects": [
                    {"label": "person", "confidence": 0.87},
                    {"label": "chair", "confidence": 0.72},
                ],
                "risk_level": "warning",
            }
        )

        self.assertEqual(
            context,
            {
                "type": "person",
                "risk_level": "warning",
                "confidence": 0.87,
                "age_ms": 0,
                "fresh": True,
            },
        )

    def test_vehicle_has_priority_but_is_only_warning_without_close_sensor(self):
        context = build_scene_context_from_yolo(
            {
                "objects": [
                    {"label": "person", "confidence": 0.92},
                    {"label": "motorcycle", "confidence": 0.81},
                ],
                "risk_level": "high",
            }
        )

        self.assertEqual(context["type"], "vehicle")
        self.assertEqual(context["risk_level"], "warning")
        self.assertEqual(context["confidence"], 0.81)

    def test_unknown_object_maps_to_info_and_empty_result_maps_clear(self):
        unknown_context = build_scene_context_from_yolo(
            {"objects": [{"label": "backpack", "confidence": 0.63}], "risk_level": "low"}
        )
        clear_context = build_scene_context_from_yolo({"objects": [], "risk_level": "low"})

        self.assertEqual(unknown_context["type"], "unknown")
        self.assertEqual(unknown_context["risk_level"], "info")
        self.assertEqual(clear_context["type"], "clear")
        self.assertEqual(clear_context["risk_level"], "clear")

    def test_combines_person_detection_with_matched_sensor_distance(self):
        far_context = build_scene_context_from_yolo(
            {"objects": [{"label": "person", "confidence": 0.88}]},
            {"distance_cm": 180, "distance_valid": True},
        )
        near_context = build_scene_context_from_yolo(
            {"objects": [{"label": "person", "confidence": 0.88}]},
            {"distance_cm": 45, "distance_valid": True},
        )

        self.assertEqual(far_context["risk_level"], "warning")
        self.assertEqual(near_context["risk_level"], "danger")

    def test_unknown_far_object_is_info_and_vehicle_far_is_warning(self):
        unknown = build_scene_context_from_yolo(
            {"objects": [{"label": "backpack", "confidence": 0.63}]},
            {"distance_cm": 180, "distance_valid": True},
        )
        vehicle = build_scene_context_from_yolo(
            {"objects": [{"label": "motorcycle", "confidence": 0.72}]},
            {"distance_cm": 180, "distance_valid": True},
        )

        self.assertEqual(unknown["risk_level"], "info")
        self.assertEqual(vehicle["risk_level"], "warning")

    def test_danger_requires_close_sensor_distance_or_danger_alert(self):
        close_vehicle = build_scene_context_from_yolo(
            {"objects": [{"label": "motorcycle", "confidence": 0.72}]},
            {"distance_cm": 45, "distance_valid": True, "alert_level": "warning"},
        )
        alert_vehicle = build_scene_context_from_yolo(
            {"objects": [{"label": "motorcycle", "confidence": 0.72}]},
            {"distance_cm": 180, "distance_valid": True, "alert_level": "danger"},
        )

        self.assertEqual(close_vehicle["risk_level"], "danger")
        self.assertEqual(alert_vehicle["risk_level"], "danger")
