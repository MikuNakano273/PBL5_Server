from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles


DEFAULT_DIST_DIR = Path(__file__).resolve().parents[2] / "admin-web" / "dist"


def register_admin_web(app: FastAPI, dist_dir: Path | None = None) -> None:
    build_dir = dist_dir or DEFAULT_DIST_DIR
    entry_file = build_dir / "index.html"
    assets_dir = build_dir / "assets"

    if assets_dir.is_dir():
        app.mount("/admin/assets", StaticFiles(directory=assets_dir), name="admin-assets")

    async def serve_admin_app(path: str = ""):
        if not entry_file.is_file():
            return PlainTextResponse(
                "Admin frontend is not built. Run `npm install` and `npm run build` in admin-web.",
                status_code=503,
            )
        return FileResponse(entry_file)

    app.add_api_route("/admin", serve_admin_app, methods=["GET"], include_in_schema=False)
    app.add_api_route("/admin/{path:path}", serve_admin_app, methods=["GET"], include_in_schema=False)
