from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PBL5 Server API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    api_prefix: str = "/api"
    mobile_api_prefix: str = "/api/mobile/v1"
    cane_api_prefix: str = "/api/cane/v1"
    internal_api_prefix: str = "/api/internal/v1"
    admin_api_prefix: str = "/api/admin/v1"

    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:8080",
        alias="CORS_ORIGINS",
    )

    mongodb_uri: str = Field(
        default="mongodb://localhost:27017/pbl5",
        alias="MONGODB_URI",
    )
    mongodb_db_name: str = Field(default="pbl5", alias="MONGODB_DB_NAME")

    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_password: str | None = Field(default=None, alias="REDIS_PASSWORD")
    redis_db: int = Field(default=0, alias="REDIS_DB")

    minio_endpoint: str = Field(default="localhost:9000", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin", alias="MINIO_SECRET_KEY")
    minio_bucket: str = Field(default="pbl5-images", alias="MINIO_BUCKET")
    minio_use_ssl: bool = Field(default=False, alias="MINIO_USE_SSL")
    minio_region: str = Field(default="us-east-1", alias="MINIO_REGION")
    image_upload_url_ttl_seconds: int = Field(default=900, alias="IMAGE_UPLOAD_URL_TTL_SECONDS")

    jwt_access_secret: str = Field(default="change-me-access", alias="JWT_ACCESS_SECRET")
    jwt_refresh_secret: str = Field(default="change-me-refresh", alias="JWT_REFRESH_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expires_minutes: int = Field(default=15, alias="JWT_ACCESS_EXPIRES_MINUTES")
    jwt_refresh_expires_days: int = Field(default=30, alias="JWT_REFRESH_EXPIRES_DAYS")
    internal_worker_token: str = Field(default="change-me", alias="INTERNAL_WORKER_TOKEN")
    alert_distance_threshold_cm: float = Field(default=100, alias="ALERT_DISTANCE_THRESHOLD_CM")
    alert_dedup_window_seconds: int = Field(default=300, alias="ALERT_DEDUP_WINDOW_SECONDS")
    distance_sampling_min_seconds: float = Field(default=2, alias="DISTANCE_SAMPLING_MIN_SECONDS")
    distance_sampling_delta_cm: float = Field(default=10, alias="DISTANCE_SAMPLING_DELTA_CM")
    gps_retention_days: int = Field(default=60, alias="GPS_RETENTION_DAYS")
    distance_retention_days: int = Field(default=14, alias="DISTANCE_RETENTION_DAYS")
    installation_notification_retention_days: int = Field(default=90, alias="INSTALLATION_NOTIFICATION_RETENTION_DAYS")
    raw_image_retention_days: int = Field(default=30, alias="RAW_IMAGE_RETENTION_DAYS")
    vision_queue_name: str = Field(default="vision-jobs", alias="VISION_QUEUE_NAME")
    vision_job_timeout_seconds: int = Field(default=120, alias="VISION_JOB_TIMEOUT_SECONDS")
    vision_retry_max: int = Field(default=3, alias="VISION_RETRY_MAX")
    vision_retry_intervals: str = Field(default="3,9,27", alias="VISION_RETRY_INTERVALS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def redis_url(self) -> str:
        auth_part = ""
        if self.redis_password:
            auth_part = f":{self.redis_password}@"
        return f"redis://{auth_part}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def cors_origin_values(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def vision_retry_interval_values(self) -> tuple[int, ...]:
        return tuple(
            int(value.strip())
            for value in self.vision_retry_intervals.split(",")
            if value.strip()
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
