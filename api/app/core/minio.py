import urllib3
from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings

_minio_client: Minio | None = None


MINIO_TIMEOUT_SECONDS = 2


def connect_minio() -> Minio:
    global _minio_client
    if _minio_client is not None:
        return _minio_client

    settings = get_settings()
    http_client = urllib3.PoolManager(timeout=urllib3.Timeout(connect=MINIO_TIMEOUT_SECONDS, read=MINIO_TIMEOUT_SECONDS))
    _minio_client = Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
        region=settings.minio_region,
        http_client=http_client,
    )
    _minio_client.bucket_exists(settings.minio_bucket)
    return _minio_client


def get_minio() -> Minio:
    if _minio_client is None:
        return connect_minio()
    return _minio_client


def ensure_bucket_exists() -> None:
    settings = get_settings()
    client = get_minio()
    try:
        if not client.bucket_exists(settings.minio_bucket):
            client.make_bucket(settings.minio_bucket)
    except S3Error:
        raise


def close_minio() -> None:
    global _minio_client
    _minio_client = None
