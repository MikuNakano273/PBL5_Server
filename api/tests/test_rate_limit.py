from datetime import UTC, datetime, timedelta
from unittest import TestCase

from app.common.exceptions.base import AppError
from app.core.rate_limit import FixedWindowRateLimiter


class RateLimitTest(TestCase):
    def test_fixed_window_rate_limiter_rejects_requests_over_limit_and_resets_after_window(self):
        limiter = FixedWindowRateLimiter()
        now = datetime(2026, 4, 25, 12, 0, tzinfo=UTC)

        limiter.check("login", "127.0.0.1", limit=2, window_seconds=60, now=now)
        limiter.check("login", "127.0.0.1", limit=2, window_seconds=60, now=now + timedelta(seconds=10))

        with self.assertRaises(AppError) as error:
            limiter.check("login", "127.0.0.1", limit=2, window_seconds=60, now=now + timedelta(seconds=20))

        self.assertEqual(error.exception.status_code, 429)
        limiter.check("login", "127.0.0.1", limit=2, window_seconds=60, now=now + timedelta(seconds=61))
