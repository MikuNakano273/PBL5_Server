from app.common.exceptions.base import AppError
from app.common.schemas.cane import CaneAuthContext
from app.common.utils.security import verify_password
from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository


class CaneAuthService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)

    def authenticate_device(self, device_code: str | None, device_secret: str | None) -> CaneAuthContext:
        if not device_code or not device_secret:
            raise AppError(code="missing_device_credentials", message="Device credentials are required.", status_code=401)

        device = self.device_repository.get_by_device_code(device_code)
        if device is None or not device.get("device_secret_hash"):
            raise AppError(code="invalid_device_credentials", message="Device credentials are invalid.", status_code=401)

        if not verify_password(device_secret, device["device_secret_hash"]):
            raise AppError(code="invalid_device_credentials", message="Device credentials are invalid.", status_code=401)

        return CaneAuthContext(
            device_id=str(device["_id"]),
            device_code=device["device_code"],
            blind_user_id=device["owner_blind_user_id"],
        )
