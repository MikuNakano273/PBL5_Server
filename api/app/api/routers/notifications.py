from fastapi import APIRouter, Depends, Header

from app.api.deps import get_auth_service, get_installation_service
from app.common.exceptions.base import AppError
from app.common.schemas.auth import TokenPairResponse
from app.common.schemas.installation import PushTokenRequest, SwitchAccountRequest
from app.services.auth_service import AuthService
from app.services.installation_service import InstallationService

router = APIRouter()


def _get_installation_from_header(
    installation_service: InstallationService,
    device_fingerprint: str | None,
) -> dict:
    if not device_fingerprint:
        raise AppError(code='missing_installation_header', message='x-device-fingerprint header is required.', status_code=400)
    installation = installation_service.get_installation_by_fingerprint(device_fingerprint)
    if installation is None:
        raise AppError(code='installation_not_found', message='Installation not found.', status_code=404)
    return installation


def _serialize_account(account: dict) -> dict:
    serialized = dict(account)
    serialized['_id'] = str(serialized['_id'])
    return serialized


def _serialize_installation(installation: dict) -> dict:
    serialized = dict(installation)
    serialized['id'] = str(serialized.pop('_id'))
    return serialized


@router.get('/notifications')
async def list_notifications(
    x_device_fingerprint: str | None = Header(default=None),
    installation_service: InstallationService = Depends(get_installation_service),
) -> list[dict]:
    installation = _get_installation_from_header(installation_service, x_device_fingerprint)
    return installation_service.list_notifications(str(installation['_id']))


@router.post('/notifications/{notification_id}/read')
async def mark_notification_read(
    notification_id: str,
    x_device_fingerprint: str | None = Header(default=None),
    installation_service: InstallationService = Depends(get_installation_service),
) -> dict:
    installation = _get_installation_from_header(installation_service, x_device_fingerprint)
    return installation_service.mark_notification_read(str(installation['_id']), notification_id)


@router.post('/push-token')
async def save_push_token(
    body: PushTokenRequest,
    x_device_fingerprint: str | None = Header(default=None),
    installation_service: InstallationService = Depends(get_installation_service),
) -> dict:
    installation = _get_installation_from_header(installation_service, x_device_fingerprint)
    updated_installation = installation_service.save_push_token(
        str(installation['_id']),
        body.push_token,
        body.provider,
        platform=body.platform,
    )
    return _serialize_installation(updated_installation)


@router.get('/accounts')
async def list_installation_accounts(
    x_device_fingerprint: str | None = Header(default=None),
    installation_service: InstallationService = Depends(get_installation_service),
) -> list[dict]:
    installation = _get_installation_from_header(installation_service, x_device_fingerprint)
    accounts = installation_service.list_installation_accounts(str(installation['_id']))
    return [_serialize_account(account) for account in accounts]


@router.post('/switch-account', response_model=TokenPairResponse)
async def switch_account(
    body: SwitchAccountRequest,
    x_device_fingerprint: str | None = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
    installation_service: InstallationService = Depends(get_installation_service),
) -> TokenPairResponse:
    installation = _get_installation_from_header(installation_service, x_device_fingerprint)
    active_account = installation_service.switch_active_account(str(installation['_id']), body.installation_account_id)
    return auth_service.issue_token_pair_for_user(active_account['user_id'], installation_id=str(installation['_id']))
