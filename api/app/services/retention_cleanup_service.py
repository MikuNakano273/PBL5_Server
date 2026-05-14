from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.core.database import get_database
from app.repositories.distance_repository import DistanceRepository
from app.repositories.gps_repository import GpsRepository
from app.repositories.installation_notification_repository import InstallationNotificationRepository
from app.services.storage_service import StorageService


class RetentionCleanupService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.settings = get_settings()
        self.gps_repository = GpsRepository(database)
        self.distance_repository = DistanceRepository(database)
        self.installation_notification_repository = InstallationNotificationRepository(database)
        self.storage_service = StorageService()

    def run_cleanup(self, now: datetime | None = None) -> dict[str, int]:
        now = now or datetime.now(UTC)
        gps_deleted = self.gps_repository.delete_older_than(now - timedelta(days=self.settings.gps_retention_days))
        distance_deleted = self.distance_repository.delete_older_than(now - timedelta(days=self.settings.distance_retention_days))
        notifications_deleted = self.installation_notification_repository.delete_older_than(
            now - timedelta(days=self.settings.installation_notification_retention_days)
        )
        raw_images_deleted = 0
        if self.settings.raw_image_retention_days > 0:
            raw_images_deleted = self.storage_service.delete_raw_images_older_than(
                now - timedelta(days=self.settings.raw_image_retention_days)
            )

        return {
            "gps_logs_deleted": gps_deleted,
            "distance_telemetry_deleted": distance_deleted,
            "installation_notifications_deleted": notifications_deleted,
            "raw_images_deleted": raw_images_deleted,
        }
