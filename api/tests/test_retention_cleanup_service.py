from datetime import UTC, datetime, timedelta
from unittest import TestCase

from app.services.retention_cleanup_service import RetentionCleanupService


class _Repo:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count
        self.cutoff = None

    def delete_older_than(self, cutoff):
        self.cutoff = cutoff
        return self.deleted_count


class _Storage:
    def __init__(self):
        self.cutoff = None

    def delete_raw_images_older_than(self, cutoff):
        self.cutoff = cutoff
        return 4


class _Settings:
    gps_retention_days = 60
    distance_retention_days = 14
    installation_notification_retention_days = 90
    raw_image_retention_days = 30


class RetentionCleanupServiceTest(TestCase):
    def test_run_cleanup_deletes_records_older_than_configured_retention(self):
        service = RetentionCleanupService.__new__(RetentionCleanupService)
        service.gps_repository = _Repo(2)
        service.distance_repository = _Repo(3)
        service.installation_notification_repository = _Repo(5)
        service.storage_service = _Storage()
        service.settings = _Settings()
        now = datetime(2026, 4, 25, 12, 0, tzinfo=UTC)

        result = service.run_cleanup(now=now)

        self.assertEqual(service.gps_repository.cutoff, now - timedelta(days=60))
        self.assertEqual(service.distance_repository.cutoff, now - timedelta(days=14))
        self.assertEqual(service.installation_notification_repository.cutoff, now - timedelta(days=90))
        self.assertEqual(service.storage_service.cutoff, now - timedelta(days=30))
        self.assertEqual(
            result,
            {
                "gps_logs_deleted": 2,
                "distance_telemetry_deleted": 3,
                "installation_notifications_deleted": 5,
                "raw_images_deleted": 4,
            },
        )
