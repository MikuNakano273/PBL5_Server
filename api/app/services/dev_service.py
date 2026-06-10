from typing import Any

from app.common.exceptions.base import AppError
from app.core.database import get_database
from app.repositories.device_repository import DeviceRepository
from app.services.alert_service import AlertService


class DevService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.device_repository = DeviceRepository(database)
        self.alert_service = AlertService(database)

    def create_test_alert(self, user_id: str) -> dict[str, Any]:
        devices = self.device_repository.list_by_user(user_id)
        if not devices:
            raise AppError(
                code="device_not_found",
                message="Current user does not have a device for the test alert.",
                status_code=404,
            )

        result = self.alert_service.create_test_alert(
            user_id=user_id,
            device_id=str(devices[0]["_id"]),
        )
        return {"id": result["id"], **result["alert"]}
