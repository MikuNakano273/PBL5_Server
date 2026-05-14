from fastapi import APIRouter, Depends

from app.api.deps import get_auth_service, get_current_auth_context, get_user_service
from app.common.schemas.auth import AuthContext, ChangePasswordRequest
from app.common.schemas.user import UpdateMeRequest, UserResponse
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()


@router.get('', response_model=UserResponse)
async def get_me(
    auth_context: AuthContext = Depends(get_current_auth_context),
    user_service: UserService = Depends(get_user_service),
) -> dict:
    return user_service.get_profile(auth_context.user_id)


@router.patch('', response_model=UserResponse)
async def update_me(
    body: UpdateMeRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    user_service: UserService = Depends(get_user_service),
) -> dict:
    return user_service.update_profile(auth_context.user_id, body)


@router.post('/change-password')
async def change_password(
    body: ChangePasswordRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    auth_service.change_password(auth_context.user_id, body.current_password, body.new_password)
    return {'status': 'ok'}
