from app.config.settings import settings


class YoloService:
    def __init__(self):
        from ultralytics import YOLO

        self.model = YOLO(settings.yolo_model_path)

    def infer(self, image_path: str) -> dict:
        results = self.model(image_path, conf=settings.yolo_confidence_threshold)
        objects = []

        for result in results:
            names = result.names
            for box in result.boxes:
                cls_idx = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                objects.append(
                    {
                        "label": names.get(cls_idx, str(cls_idx)),
                        "confidence": conf,
                        "bbox": {
                            "x1": xyxy[0],
                            "y1": xyxy[1],
                            "x2": xyxy[2],
                            "y2": xyxy[3],
                        },
                    }
                )

        nearest_distance = 80 if objects else None
        risk_level = "high" if nearest_distance and nearest_distance < 100 else "low"
        return {
            "model_name": "yolov8s",
            "model_version": "1.0",
            "objects": objects,
            "nearest_obstacle_cm": nearest_distance,
            "risk_level": risk_level,
            "summary_text": f"Detected {len(objects)} object(s)",
        }
