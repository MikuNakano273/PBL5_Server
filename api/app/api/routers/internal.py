from fastapi import APIRouter, Depends

from app.api.deps import get_current_internal_context, get_internal_vision_service, rate_limit
from app.common.schemas.internal import VisionResultCallbackRequest
from app.services.internal_vision_service import InternalVisionService

router = APIRouter(dependencies=[Depends(rate_limit("internal", 120, 60))])


@router.post("/vision/results")
async def submit_vision_result(
    body: VisionResultCallbackRequest,
    internal_context: dict[str, str] = Depends(get_current_internal_context),
    internal_vision_service: InternalVisionService = Depends(get_internal_vision_service),
) -> dict[str, str]:
    return internal_vision_service.accept_result(body)


@router.post("/vision/retry/{request_id}")
async def retry_vision_request(
    request_id: str,
    internal_context: dict[str, str] = Depends(get_current_internal_context),
    internal_vision_service: InternalVisionService = Depends(get_internal_vision_service),
) -> dict:
    return internal_vision_service.retry_request(request_id)
