from fastapi import APIRouter, Depends, status

from app.api.deps import (
    get_current_cane_context,
    get_device_config_service,
    get_distance_service,
    get_gps_service,
    get_heartbeat_service,
    get_image_request_service,
    rate_limit,
)
from app.common.schemas.cane import (
    CaneAuthContext,
    CaneDistanceRequest,
    CaneGpsRequest,
    CaneHeartbeatRequest,
    CaneImageRequestCreate,
    CaneImageUploadRequest,
)
from app.services.distance_service import DistanceService
from app.services.device_config_service import DeviceConfigService
from app.services.gps_service import GpsService
from app.services.heartbeat_service import HeartbeatService
from app.services.image_request_service import ImageRequestService

router = APIRouter(dependencies=[Depends(get_current_cane_context), Depends(rate_limit("cane", 120, 60))])


@router.post("/requests")
async def create_image_request(
    body: CaneImageRequestCreate,
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    image_request_service: ImageRequestService = Depends(get_image_request_service),
) -> dict:
    return image_request_service.create_image_request(cane_context, body)


@router.post("/requests/{request_id}/image")
async def upload_image(
    request_id: str,
    body: CaneImageUploadRequest,
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    image_request_service: ImageRequestService = Depends(get_image_request_service),
) -> dict:
    return image_request_service.attach_uploaded_image(cane_context, request_id, body)


@router.post("/gps")
async def ingest_gps(
    body: CaneGpsRequest,
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    gps_service: GpsService = Depends(get_gps_service),
) -> dict:
    return gps_service.ingest_gps(cane_context, body)


@router.post("/telemetry/distance")
async def ingest_distance(
    body: CaneDistanceRequest,
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    distance_service: DistanceService = Depends(get_distance_service),
) -> dict:
    return distance_service.ingest_distance(cane_context, body)


@router.post("/heartbeat")
async def heartbeat(
    body: CaneHeartbeatRequest,
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    heartbeat_service: HeartbeatService = Depends(get_heartbeat_service),
) -> dict[str, str]:
    return heartbeat_service.record_heartbeat(cane_context, body)


@router.get("/devices/me/config")
async def get_device_config(
    cane_context: CaneAuthContext = Depends(get_current_cane_context),
    device_config_service: DeviceConfigService = Depends(get_device_config_service),
) -> dict:
    return device_config_service.get_config(cane_context)
