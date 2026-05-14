from unittest import TestCase
from unittest.mock import MagicMock, patch

from app.core import redis


class RedisConnectionTest(TestCase):
    def tearDown(self):
        redis._redis_client = None
        redis._rq_redis_client = None

    def test_rq_redis_connection_keeps_binary_responses_for_pickled_jobs(self):
        fake_client = MagicMock()
        with patch("app.core.redis.Redis.from_url", return_value=fake_client) as from_url:
            redis.connect_rq_redis()

        self.assertFalse(from_url.call_args.kwargs["decode_responses"])
        fake_client.ping.assert_called_once()
