from datetime import timedelta

from minio import Minio

from app.core.config import Settings, get_settings
from app.core.minio import ensure_bucket_exists, get_minio


class StorageService:
    def __init__(self, storage_client: Minio | None = None, settings: Settings | None = None) -> None:
        self.settings = settings if settings is not None else get_settings()
        self.storage_client = storage_client if storage_client is not None else get_minio()
        self._owns_default_client = storage_client is None

    def build_raw_image_key(self, blind_user_id: str, device_id: str, request_id: str) -> str:
        return f"raw/{blind_user_id}/{device_id}/{request_id}.jpg"

    def get_presigned_upload_url(self, object_key: str) -> str:
        if self._owns_default_client:
            ensure_bucket_exists()
        return self.storage_client.presigned_put_object(
            self.settings.minio_bucket,
            object_key,
            expires=timedelta(seconds=self.settings.image_upload_url_ttl_seconds),
        )

    def delete_raw_images_older_than(self, cutoff) -> int:
        deleted_count = 0
        for item in self.storage_client.list_objects(self.settings.minio_bucket, prefix="raw/", recursive=True):
            if item.last_modified is not None and item.last_modified < cutoff:
                self.storage_client.remove_object(self.settings.minio_bucket, item.object_name)
                deleted_count += 1
        return deleted_count
