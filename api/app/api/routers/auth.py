from fastapi import APIRouter, Depends

from app.api.deps import get_auth_service, rate_limit
from app.common.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenPairResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post('/login', response_model=TokenPairResponse, dependencies=[Depends(rate_limit("mobile_login", 10, 60))])
async def login(
    body: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenPairResponse:
    user = auth_service.authenticate_user(body.email, body.password)
    return auth_service.issue_token_pair_for_user(str(user['_id']), installation_id=None)


@router.post('/refresh', response_model=TokenPairResponse, dependencies=[Depends(rate_limit("mobile_refresh", 30, 60))])
async def refresh(body: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)) -> TokenPairResponse:
    return auth_service.refresh(body.refresh_token)


@router.post('/logout')
async def logout(body: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)) -> dict[str, str]:
    auth_service.logout(body.refresh_token)
    return {'status': 'ok'}
