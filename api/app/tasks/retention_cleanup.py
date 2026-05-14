from app.services.retention_cleanup_service import RetentionCleanupService


def run_retention_cleanup() -> dict[str, int]:
    return RetentionCleanupService().run_cleanup()
