from collections.abc import Callable

from fastapi import Depends, Header, Request

from app.common.exceptions.base import AppError
from app.common.schemas.auth import AuthContext
from app.common.schemas.cane import CaneAuthContext
from app.common.utils.security import decode_token
from app.core.config import get_settings
from app.core.database import get_database
from app.core.rate_limit import rate_limiter
from app.services.admin_auth_service import AdminAuthService
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService
from app.services.cane_auth_service import CaneAuthService
from app.services.care_link_service import CareLinkService
from app.services.dashboard_service import DashboardService
from app.services.device_config_service import DeviceConfigService
from app.services.distance_service import DistanceService
from app.services.gps_service import GpsService
from app.services.heartbeat_service import HeartbeatService
from app.services.image_request_service import ImageRequestService
from app.services.installation_service import InstallationService
from app.services.internal_vision_service import InternalVisionService
from app.services.user_service import UserService


def get_auth_service(database=Depends(get_database)) -> AuthService:
    return AuthService(database)


def get_admin_auth_service(database=Depends(get_database)) -> AdminAuthService:
    return AdminAuthService(database)


def get_admin_service(database=Depends(get_database)) -> AdminService:
    return AdminService(database)


def get_installation_service(database=Depends(get_database)) -> InstallationService:
    return InstallationService(database)


def get_user_service(database=Depends(get_database)) -> UserService:
    return UserService(database)


def get_care_link_service(database=Depends(get_database)) -> CareLinkService:
    return CareLinkService(database)


def get_dashboard_service(database=Depends(get_database)) -> DashboardService:
    return DashboardService(database)


def get_cane_auth_service(database=Depends(get_database)) -> CaneAuthService:
    return CaneAuthService(database)


def get_gps_service(database=Depends(get_database)) -> GpsService:
    return GpsService(database)


def get_distance_service(database=Depends(get_database)) -> DistanceService:
    return DistanceService(database)


def get_heartbeat_service(database=Depends(get_database)) -> HeartbeatService:
    return HeartbeatService(database)


def get_image_request_service(database=Depends(get_database)) -> ImageRequestService:
    return ImageRequestService(database)


def get_device_config_service(database=Depends(get_database)) -> DeviceConfigService:
    return DeviceConfigService(database)


def get_internal_vision_service(database=Depends(get_database)) -> InternalVisionService:
    return InternalVisionService(database)


def get_current_auth_context(authorization: str | None = Header(default=None)) -> AuthContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(code="missing_authorization", message="Authorization bearer token is required.", status_code=401)
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)
    return AuthContext(
        user_id=payload["sub"],
        role=payload["role"],
        user_type=payload.get("user_type"),
        installation_id=payload.get("installation_id"),
    )


def get_current_cane_context(
    x_device_code: str | None = Header(default=None),
    x_device_secret: str | None = Header(default=None),
    cane_auth_service: CaneAuthService = Depends(get_cane_auth_service),
) -> CaneAuthContext:
    return cane_auth_service.authenticate_device(x_device_code, x_device_secret)


def get_current_internal_context(
    authorization: str | None = Header(default=None),
    settings=Depends(get_settings),
) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(
            code="missing_internal_authorization",
            message="Internal authorization bearer token is required.",
            status_code=401,
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.internal_worker_token:
        raise AppError(code="invalid_internal_token", message="Internal token is invalid.", status_code=401)
    return {"auth_type": "internal_worker"}


def get_current_admin_context(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(code="missing_admin_authorization", message="Admin bearer token is required.", status_code=401)
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)
    if payload.get("role") != "admin" or payload.get("token_use") != "admin":
        raise AppError(code="admin_forbidden", message="Admin privileges are required.", status_code=403)
    return {"user_id": payload["sub"], "role": "admin"}


def rate_limit(scope: str, limit: int, window_seconds: int) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        client_host = request.client.host if request.client is not None else "unknown"
        rate_limiter.check(scope, client_host, limit=limit, window_seconds=window_seconds)

    return dependency
