import tempfile
from pathlib import Path
from unittest import TestCase

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.admin_web import register_admin_web


class AdminWebTest(TestCase):
    def test_serves_spa_entry_assets_and_nested_routes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dist_dir = Path(temp_dir)
            (dist_dir / "assets").mkdir()
            (dist_dir / "index.html").write_text("<html>admin web</html>", encoding="utf-8")
            (dist_dir / "assets" / "app.js").write_text("console.log('admin')", encoding="utf-8")
            app = FastAPI()
            register_admin_web(app, dist_dir)
            client = TestClient(app)

            self.assertIn("admin web", client.get("/admin").text)
            self.assertIn("admin web", client.get("/admin/users").text)
            self.assertIn("console.log", client.get("/admin/assets/app.js").text)

    def test_missing_build_returns_informative_response(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            app = FastAPI()
            register_admin_web(app, Path(temp_dir) / "missing")

            response = TestClient(app).get("/admin")

            self.assertEqual(response.status_code, 503)
            self.assertIn("npm run build", response.text)

    def test_admin_api_route_is_not_intercepted(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            app = FastAPI()

            @app.get("/api/admin/v1/probe")
            async def admin_probe():
                return {"ok": True}

            register_admin_web(app, Path(temp_dir) / "missing")

            response = TestClient(app).get("/api/admin/v1/probe")

            self.assertEqual(response.json(), {"ok": True})
