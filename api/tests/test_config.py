from unittest import TestCase

from app.core.config import Settings


class ConfigTest(TestCase):
    def test_vision_retry_intervals_accepts_comma_separated_env_value(self):
        settings = Settings(_env_file=None, VISION_RETRY_INTERVALS="3,9,27")

        self.assertEqual(settings.vision_retry_interval_values, (3, 9, 27))
