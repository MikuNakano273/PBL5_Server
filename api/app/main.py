from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.admin_web import register_admin_web
from app.api.router import api_router
from app.api.routers import dev
from app.api.routers.demo_cane import get_uploaded_frame
from app.common.exceptions.handlers import register_exception_handlers
from app.core.config import get_settings
from app.core.database import close_mongo, connect_mongo
from app.core.logging import configure_logging
from app.core.minio import close_minio, connect_minio
from app.core.redis import close_redis, connect_redis


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    Path(get_settings().pictures_dir).mkdir(parents=True, exist_ok=True)
    app.state.mongo = connect_mongo()
    app.state.redis = connect_redis()
    app.state.minio = connect_minio()
    try:
        yield
    finally:
        close_minio()
        close_redis()
        close_mongo()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_values,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(api_router)
    if settings.dev_endpoints_enabled:
        app.include_router(dev.router, prefix="/api/mobile/v1/dev", tags=["development"])

    @app.get("/", include_in_schema=False)
    async def redirect_to_admin() -> RedirectResponse:
        return RedirectResponse(url="/admin")

    @app.get("/uploads/{frame_id}.jpg", include_in_schema=False)
    async def get_plan_uploaded_frame(frame_id: str):
        return await get_uploaded_frame(frame_id)

    register_admin_web(app)
    return app


app = create_app()
