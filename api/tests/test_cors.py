from unittest import TestCase

from starlette.middleware.cors import CORSMiddleware

from app.main import create_app


class CorsMiddlewareTest(TestCase):
    def test_app_registers_cors_middleware(self):
        app = create_app()

        middleware_classes = [middleware.cls for middleware in app.user_middleware]

        self.assertIn(CORSMiddleware, middleware_classes)
