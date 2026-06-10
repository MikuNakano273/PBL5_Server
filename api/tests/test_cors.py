from unittest import TestCase

from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware

from app.main import create_app


class CorsMiddlewareTest(TestCase):
    def test_app_registers_cors_middleware(self):
        app = create_app()

        middleware_classes = [middleware.cls for middleware in app.user_middleware]

        self.assertIn(CORSMiddleware, middleware_classes)

    def test_root_redirects_to_admin_web(self):
        app = create_app()

        response = TestClient(app).get("/", follow_redirects=False)

        self.assertEqual(response.status_code, 307)
        self.assertEqual(response.headers["location"], "/admin")
