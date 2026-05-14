from datetime import timedelta
from unittest import TestCase

from app.common.schemas.cane import CaneAuthContext, CaneImageRequestCreate, CaneImageUploadRequest
from app.services.device_config_service import DeviceConfigService
from app.services.image_request_service import ImageRequestService
from app.services.storage_service import StorageService


class _StorageClient:
    def __init__(self):
        self.calls = []

    def presigned_put_object(self, bucket, object_key, expires):
        self.calls.append({"bucket": bucket, "object_key": object_key, "expires": expires})
        return f"http://minio/{bucket}/{object_key}"


class _Settings:
    minio_bucket = "pbl5-images"
    image_upload_url_ttl_seconds = 900
    alert_distance_threshold_cm = 100
    distance_sampling_min_seconds = 2
    distance_sampling_delta_cm = 10


class _ImageRequestRepo:
    def __init__(self):
        self.documents = {}

    def create_request(self, payload):
        request_id = "request-1"
        self.documents[request_id] = {"_id": request_id, **payload}
        return request_id

    def get_by_id(self, request_id):
        return self.documents.get(request_id)

    def update_request(self, request_id, payload):
        self.documents[request_id].update(payload)
        return 1


class _DeviceRepo:
    def get_by_id_and_owner(self, device_id, blind_user_id):
        if device_id == "device-1" and blind_user_id == "blind-1":
            return {
                "_id": "device-1",
                "device_code": "STICK-001",
                "owner_blind_user_id": "blind-1",
                "name": "Primary cane",
                "firmware_version": "1.0.1",
                "status": "online",
            }
        return None


class StorageAndDeviceConfigTest(TestCase):
    def test_storage_service_builds_standard_raw_image_path_and_presigned_url(self):
        storage_client = _StorageClient()
        service = StorageService(storage_client=storage_client, settings=_Settings())

        object_key = service.build_raw_image_key("blind-1", "device-1", "request-1")
        upload_url = service.get_presigned_upload_url(object_key)

        self.assertEqual(object_key, "raw/blind-1/device-1/request-1.jpg")
        self.assertEqual(upload_url, "http://minio/pbl5-images/raw/blind-1/device-1/request-1.jpg")
        self.assertEqual(storage_client.calls[0]["bucket"], "pbl5-images")
        self.assertEqual(storage_client.calls[0]["expires"], timedelta(seconds=900))

    def test_attach_uploaded_image_defaults_to_standard_minio_object_path(self):
        service = ImageRequestService.__new__(ImageRequestService)
        service.image_request_repository = _ImageRequestRepo()
        service.storage_service = StorageService(storage_client=_StorageClient(), settings=_Settings())
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", blind_user_id="blind-1")
        created = service.create_image_request(context, CaneImageRequestCreate())

        uploaded = service.attach_uploaded_image(context, created["id"], CaneImageUploadRequest())

        self.assertEqual(uploaded["image_path"], "raw/blind-1/device-1/request-1.jpg")
        self.assertEqual(uploaded["upload_url"], "http://minio/pbl5-images/raw/blind-1/device-1/request-1.jpg")

    def test_device_config_uses_authenticated_device_and_owner(self):
        service = DeviceConfigService.__new__(DeviceConfigService)
        service.device_repository = _DeviceRepo()
        service.settings = _Settings()
        context = CaneAuthContext(device_id="device-1", device_code="STICK-001", blind_user_id="blind-1")

        config = service.get_config(context)

        self.assertEqual(config["device_id"], "device-1")
        self.assertEqual(config["blind_user_id"], "blind-1")
        self.assertEqual(config["image_upload_prefix"], "raw/blind-1/device-1/")
        self.assertEqual(config["minio_bucket"], "pbl5-images")
        self.assertEqual(config["telemetry"]["distance_sampling_min_seconds"], 2)
