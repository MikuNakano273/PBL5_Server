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

    def test_vehicle_has_priority_and_high_yolo_risk_becomes_danger(self):
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
        self.assertEqual(context["risk_level"], "danger")
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
