from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.common.exceptions.handlers import register_exception_handlers
from app.core.config import get_settings
from app.core.database import close_mongo, connect_mongo
from app.core.logging import configure_logging
from app.core.minio import close_minio, connect_minio
from app.core.redis import close_redis, connect_redis


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
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
    return app


app = create_app()
