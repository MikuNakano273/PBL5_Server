from minio import Minio

from app.config.settings import settings


class StorageService:
    def __init__(self, client: Minio | None = None) -> None:
        self.client = client or Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=False,
        )

    def download_image(self, object_key: str, destination_path: str) -> None:
        self.client.fget_object(settings.minio_bucket, object_key, destination_path)
