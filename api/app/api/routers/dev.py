from fastapi import APIRouter, Depends

from app.api.deps import get_current_auth_context, get_dev_service, rate_limit
from app.common.schemas.auth import AuthContext
from app.services.dev_service import DevService

router = APIRouter()


@router.post("/test-alert", dependencies=[Depends(rate_limit("dev_test_alert", 10, 60))])
async def create_test_alert(
    auth_context: AuthContext = Depends(get_current_auth_context),
    dev_service: DevService = Depends(get_dev_service),
) -> dict:
    return dev_service.create_test_alert(auth_context.user_id)
