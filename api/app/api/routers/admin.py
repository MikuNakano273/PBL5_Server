from fastapi import APIRouter, Depends

from app.api.deps import get_admin_auth_service, get_admin_service, get_current_admin_context, rate_limit
from app.common.schemas.admin import (
    AdminAssignDeviceRequest,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminUserUpdateRequest,
)
from app.services.admin_auth_service import AdminAuthService
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/auth/login", response_model=AdminLoginResponse, dependencies=[Depends(rate_limit("admin_login", 10, 60))])
async def admin_login(
    body: AdminLoginRequest,
    admin_auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> dict[str, str]:
    return admin_auth_service.login(body.email, body.password)


@router.get("/users")
async def list_users(
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    return admin_service.list_users(page, limit)


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
) -> dict:
    return admin_service.get_user(user_id)


@router.patch("/users/{user_id}")
async def patch_user(
    user_id: str,
    body: AdminUserUpdateRequest,
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
) -> dict:
    return admin_service.update_user(user_id, body)


@router.get("/devices")
async def list_devices(
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    return admin_service.list_devices(page, limit)


@router.post("/devices/{device_id}/assign")
async def assign_device(
    device_id: str,
    body: AdminAssignDeviceRequest,
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
) -> dict:
    return admin_service.assign_device(device_id, body.user_id)


@router.get("/image-requests")
async def list_image_requests(
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    return admin_service.list_image_requests(page, limit)


@router.get("/alerts")
async def list_alerts(
    admin_context: dict[str, str] = Depends(get_current_admin_context),
    admin_service: AdminService = Depends(get_admin_service),
    page: int = 1,
    limit: int = 20,
) -> list[dict]:
    return admin_service.list_alerts(page, limit)
