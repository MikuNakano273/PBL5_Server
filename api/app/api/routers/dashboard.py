from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_auth_context, get_dashboard_service
from app.common.schemas.auth import AuthContext
from app.common.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get('/dashboard/{blind_user_id}', response_model=DashboardResponse)
async def get_dashboard(
    blind_user_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> dict:
    return dashboard_service.get_dashboard(blind_user_id, auth_context)


@router.get('/blind-users/{blind_user_id}/devices')
async def get_devices(
    blind_user_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[dict]:
    return dashboard_service.get_devices(blind_user_id, auth_context)


@router.get('/blind-users/{blind_user_id}/locations')
async def get_locations(
    blind_user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[dict]:
    return dashboard_service.get_locations(blind_user_id, auth_context, limit=limit)


@router.get('/blind-users/{blind_user_id}/alerts/today')
async def get_today_alerts(
    blind_user_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[dict]:
    return dashboard_service.get_today_alerts(blind_user_id, auth_context)


@router.get('/blind-users/{blind_user_id}/alerts')
async def get_alerts(
    blind_user_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[dict]:
    return dashboard_service.get_alerts(blind_user_id, auth_context, page=page, limit=limit)


@router.get('/blind-users/{blind_user_id}/alerts/recent')
async def get_recent_alerts(
    blind_user_id: str,
    limit: int = Query(default=5, ge=1, le=50),
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[dict]:
    return dashboard_service.get_recent_alerts(blind_user_id, auth_context, limit=limit)


@router.get('/alerts/{alert_id}')
async def get_alert_detail(
    alert_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> dict:
    return dashboard_service.get_alert_detail(alert_id, auth_context)
