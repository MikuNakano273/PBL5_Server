from ultralytics import YOLO
from app.config.settings import settings

class YoloService:
    def __init__(self):
        self.model = YOLO(settings.yolo_model_path)

    def infer(self, image_path: str) -> dict:
        results = self.model(image_path, conf=settings.yolo_confidence_threshold)
        objects = []
        nearest = None
        for result in results:
            names = result.names
            for box in result.boxes:
                cls_idx = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                objects.append({
                    "label": names.get(cls_idx, str(cls_idx)),
                    "confidence": conf,
                    "bbox": {"x1": xyxy[0], "y1": xyxy[1], "x2": xyxy[2], "y2": xyxy[3]},
                })
        if objects:
            nearest = 80
        risk_level = "high" if nearest and nearest < 100 else "low"
        return {
            "model_name": "yolov8s",
            "objects": objects,
            "nearest_obstacle_cm": nearest,
            "risk_level": risk_level,
            "summary_text": f"Detected {len(objects)} object(s)",
        }
