from datetime import UTC, datetime, timedelta
from hashlib import sha256
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.common.exceptions.base import AppError
from app.core.config import get_settings

_password_hasher = PasswordHasher()


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def create_access_token(subject: str, claims: dict[str, Any] | None = None, expires_in_minutes: int | None = None) -> str:
    settings = get_settings()
    expires_minutes = expires_in_minutes or settings.jwt_access_expires_minutes
    payload: dict[str, Any] = {"sub": subject, "exp": utc_now() + timedelta(minutes=expires_minutes)}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_access_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, claims: dict[str, Any] | None = None, expires_in_days: int | None = None) -> str:
    settings = get_settings()
    ttl_days = expires_in_days or settings.jwt_refresh_expires_days
    payload: dict[str, Any] = {"sub": subject, "exp": utc_now() + timedelta(days=ttl_days)}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_refresh_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, refresh: bool = False) -> dict[str, Any]:
    settings = get_settings()
    secret = settings.jwt_refresh_secret if refresh else settings.jwt_access_secret
    try:
        return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise AppError(code="invalid_token", message="Token is invalid or expired.", status_code=401) from exc
