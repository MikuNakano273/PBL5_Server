from fastapi import APIRouter, Depends

from app.api.deps import get_auth_service, get_installation_service, rate_limit
from app.common.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenPairResponse
from app.services.auth_service import AuthService
from app.services.installation_service import InstallationService

router = APIRouter()


@router.post('/login', response_model=TokenPairResponse, dependencies=[Depends(rate_limit("mobile_login", 10, 60))])
async def login(
    body: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
    installation_service: InstallationService = Depends(get_installation_service),
) -> TokenPairResponse:
    user = auth_service.authenticate_user(body.email, body.password)
    installation = installation_service.get_or_create_installation(
        device_fingerprint=body.device_fingerprint,
        device_name=body.device_name,
        platform=body.platform,
    )
    installation_service.attach_account_to_installation(str(installation['_id']), str(user['_id']))
    return auth_service.issue_token_pair_for_user(str(user['_id']), installation_id=str(installation['_id']))


@router.post('/refresh', response_model=TokenPairResponse, dependencies=[Depends(rate_limit("mobile_refresh", 30, 60))])
async def refresh(body: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)) -> TokenPairResponse:
    return auth_service.refresh(body.refresh_token)


@router.post('/logout')
async def logout(body: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    auth_service.logout(body.refresh_token)
    return {'status': 'ok'}
