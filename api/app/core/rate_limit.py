from datetime import UTC, datetime, timedelta

from app.common.exceptions.base import AppError


class FixedWindowRateLimiter:
    def __init__(self) -> None:
        self._windows: dict[tuple[str, str], tuple[datetime, int]] = {}

    def check(
        self,
        scope: str,
        key: str,
        *,
        limit: int,
        window_seconds: int,
        now: datetime | None = None,
    ) -> None:
        now = now or datetime.now(UTC)
        window_key = (scope, key)
        window_start, count = self._windows.get(window_key, (now, 0))
        if now >= window_start + timedelta(seconds=window_seconds):
            window_start = now
            count = 0

        count += 1
        self._windows[window_key] = (window_start, count)
        if count > limit:
            raise AppError(
                code="rate_limit_exceeded",
                message="Too many requests. Please retry later.",
                status_code=429,
                details={"scope": scope, "limit": limit, "window_seconds": window_seconds},
            )


rate_limiter = FixedWindowRateLimiter()
