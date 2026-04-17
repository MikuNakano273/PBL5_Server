import os
from dataclasses import dataclass

@dataclass
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://admin:admin123@mongo:27017/pbl5?authSource=admin")
    redis_host: str = os.getenv("REDIS_HOST", "redis")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    minio_endpoint: str = f"{os.getenv('MINIO_HOST', 'minio')}:{os.getenv('MINIO_PORT', '9000')}"
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    minio_bucket: str = os.getenv("MINIO_BUCKET", "pbl5-images")
    yolo_model_path: str = os.getenv("YOLO_MODEL_PATH", "/models/yolov8s.pt")
    yolo_confidence_threshold: float = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.35"))
    internal_api_url: str = os.getenv("INTERNAL_API_URL", "http://api:3000")
    internal_worker_token: str = os.getenv("INTERNAL_WORKER_TOKEN", "internal-secret")

settings = Settings()
