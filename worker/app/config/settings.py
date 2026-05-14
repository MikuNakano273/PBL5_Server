import os
from dataclasses import dataclass

@dataclass
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://admin:admin123@mongo:27017/pbl5?authSource=admin")
    redis_host: str = os.getenv("REDIS_HOST", "redis")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    redis_password: str | None = os.getenv("REDIS_PASSWORD") or None
    vision_queue_name: str = os.getenv("VISION_QUEUE_NAME", "vision-jobs")
    minio_endpoint: str = f"{os.getenv('MINIO_HOST', 'minio')}:{os.getenv('MINIO_PORT', '9000')}"
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    minio_bucket: str = os.getenv("MINIO_BUCKET", "pbl5-images")
    yolo_model_path: str = os.getenv("YOLO_MODEL_PATH", "/models/yolov8s.pt")
    yolo_confidence_threshold: float = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.35"))
    internal_api_url: str = os.getenv("INTERNAL_API_URL", "http://api:3000")
    internal_worker_token: str = os.getenv("INTERNAL_WORKER_TOKEN", "internal-secret")
    vision_retry_max: int = int(os.getenv("VISION_RETRY_MAX", "3"))
    vision_retry_intervals: tuple[int, ...] = tuple(
        int(value.strip())
        for value in os.getenv("VISION_RETRY_INTERVALS", "3,9,27").split(",")
        if value.strip()
    )

    @property
    def redis_url(self) -> str:
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"

settings = Settings()
