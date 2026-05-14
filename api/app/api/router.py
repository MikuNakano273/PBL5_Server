from fastapi import APIRouter

from app.api.routers import admin, auth, cane, dashboard, health, internal, me, notifications

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(cane.router, prefix="/api/cane/v1", tags=["cane"])
api_router.include_router(auth.router, prefix="/api/mobile/v1/auth", tags=["mobile-auth"])
api_router.include_router(me.router, prefix="/api/mobile/v1/me", tags=["me"])
api_router.include_router(dashboard.router, prefix="/api/mobile/v1", tags=["dashboard"])
api_router.include_router(notifications.router, prefix="/api/mobile/v1/installations/me", tags=["notifications"])
api_router.include_router(internal.router, prefix="/api/internal/v1", tags=["internal"])
api_router.include_router(admin.router, prefix="/api/admin/v1", tags=["admin"])
