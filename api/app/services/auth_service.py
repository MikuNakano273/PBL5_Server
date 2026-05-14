from datetime import UTC, datetime
from typing import Any

from app.common.exceptions.base import AppError
from app.common.schemas.auth import TokenPairResponse
from app.common.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.core.database import get_database
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.user_repository = UserRepository(database)
        self.refresh_token_repository = RefreshTokenRepository(database)

    def authenticate_user(self, email: str, password: str) -> dict[str, Any]:
        user = self.user_repository.get_by_email(email)
        if user is None or not verify_password(password, user["password_hash"]):
            raise AppError(code="invalid_credentials", message="Email or password is invalid.", status_code=401)
        return user

    def login(self, email: str, password: str, installation_id: str | None = None) -> TokenPairResponse:
        user = self.authenticate_user(email, password)
        self._assert_mobile_user(user)
        return self._issue_token_pair(user, installation_id)

    def refresh(self, refresh_token: str) -> TokenPairResponse:
        stored_token = self.refresh_token_repository.get_active_token(refresh_token)
        if stored_token is None:
            raise AppError(code="invalid_refresh_token", message="Refresh token is invalid.", status_code=401)

        payload = decode_token(refresh_token, refresh=True)
        user = self.user_repository.get_by_id(payload["sub"])
        if user is None:
            raise AppError(code="user_not_found", message="User not found.", status_code=404)

        self.refresh_token_repository.revoke_token(refresh_token)
        return self._issue_token_pair(user, stored_token.get("installation_id"))

    def logout(self, refresh_token: str) -> None:
        revoked = self.refresh_token_repository.revoke_token(refresh_token)
        if revoked == 0:
            raise AppError(code="invalid_refresh_token", message="Refresh token is invalid.", status_code=401)

    def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise AppError(code="user_not_found", message="User not found.", status_code=404)
        if not verify_password(current_password, user["password_hash"]):
            raise AppError(code="invalid_password", message="Current password is incorrect.", status_code=400)

        self.user_repository.update_password_hash(user_id, hash_password(new_password))
        self.refresh_token_repository.revoke_all_for_user(user_id)

    def issue_token_pair_for_user(self, user_id: str, installation_id: str | None = None) -> TokenPairResponse:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise AppError(code="user_not_found", message="User not found.", status_code=404)
        self._assert_mobile_user(user)
        return self._issue_token_pair(user, installation_id)

    def _assert_mobile_user(self, user: dict[str, Any]) -> None:
        if user.get("role") != "user":
            raise AppError(code="mobile_forbidden", message="Mobile login requires a user account.", status_code=403)

    def _issue_token_pair(self, user: dict[str, Any], installation_id: str | None) -> TokenPairResponse:
        user_id = str(user["_id"])
        claims = {
            "role": user["role"],
            "token_use": "mobile",
            "installation_id": installation_id,
        }
        access_token = create_access_token(subject=user_id, claims=claims)
        refresh_token = create_refresh_token(subject=user_id, claims={"installation_id": installation_id})
        refresh_payload = decode_token(refresh_token, refresh=True)
        self.refresh_token_repository.create_refresh_token(
            {
                "user_id": user_id,
                "installation_id": installation_id,
                "token_hash": hash_token(refresh_token),
                "expires_at": datetime.fromtimestamp(refresh_payload["exp"], tz=UTC),
                "revoked_at": None,
            }
        )
        return TokenPairResponse(access_token=access_token, refresh_token=refresh_token)
