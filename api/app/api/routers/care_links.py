from fastapi import APIRouter, Depends

from app.api.deps import get_care_link_service, get_current_auth_context
from app.common.schemas.auth import AuthContext
from app.common.schemas.care_link import CareLinkCreateRequest, CareLinkResponse
from app.services.care_link_service import CareLinkService

router = APIRouter()


@router.get('', response_model=list[CareLinkResponse])
async def list_care_links(
    auth_context: AuthContext = Depends(get_current_auth_context),
    care_link_service: CareLinkService = Depends(get_care_link_service),
) -> list[dict]:
    return care_link_service.list_links(auth_context)


@router.post('', response_model=CareLinkResponse)
async def create_care_link(
    body: CareLinkCreateRequest,
    auth_context: AuthContext = Depends(get_current_auth_context),
    care_link_service: CareLinkService = Depends(get_care_link_service),
) -> dict:
    return care_link_service.create_link(auth_context, body)


@router.delete('/{care_link_id}')
async def delete_care_link(
    care_link_id: str,
    auth_context: AuthContext = Depends(get_current_auth_context),
    care_link_service: CareLinkService = Depends(get_care_link_service),
) -> dict[str, str]:
    care_link_service.delete_link(auth_context, care_link_id)
    return {'status': 'ok'}
