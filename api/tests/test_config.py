from unittest import TestCase

from app.core.config import Settings


class ConfigTest(TestCase):
    def test_vision_retry_intervals_accepts_comma_separated_env_value(self):
        settings = Settings(_env_file=None, VISION_RETRY_INTERVALS="3,9,27")

        self.assertEqual(settings.vision_retry_interval_values, (3, 9, 27))

    def test_dev_endpoints_are_disabled_in_production(self):
        settings = Settings(_env_file=None, APP_ENV="production")

        self.assertFalse(settings.dev_endpoints_enabled)

    def test_dev_endpoints_can_be_explicitly_enabled_in_production(self):
        settings = Settings(_env_file=None, APP_ENV="production", ENABLE_DEV_ENDPOINTS=True)

        self.assertTrue(settings.dev_endpoints_enabled)

    def test_dev_endpoints_are_enabled_outside_production(self):
        settings = Settings(_env_file=None, APP_ENV="development")

        self.assertTrue(settings.dev_endpoints_enabled)

    def test_legacy_production_environment_also_disables_dev_endpoints(self):
        settings = Settings(_env_file=None, APP_ENV="development", ENVIRONMENT="production")

        self.assertFalse(settings.dev_endpoints_enabled)
