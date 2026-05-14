from typing import Any

from app.common.exceptions.base import AppError
from app.common.utils.security import create_access_token, verify_password
from app.core.database import get_database
from app.repositories.user_repository import UserRepository


class AdminAuthService:
    def __init__(self, database=None) -> None:
        database = database if database is not None else get_database()
        self.user_repository = UserRepository(database)

    def login(self, email: str, password: str) -> dict[str, str]:
        user = self.user_repository.get_by_email(email)
        if user is None or not verify_password(password, user["password_hash"]):
            raise AppError(code="invalid_credentials", message="Email or password is invalid.", status_code=401)
        if user.get("role") != "admin" or user.get("status") not in {None, "active"}:
            raise AppError(code="admin_forbidden", message="Admin privileges are required.", status_code=403)

        token = self._create_admin_access_token(user)
        return {"access_token": token, "token_type": "bearer"}

    def _create_admin_access_token(self, user: dict[str, Any]) -> str:
        return create_access_token(
            subject=str(user["_id"]),
            claims={
                "role": "admin",
                "installation_id": None,
                "token_use": "admin",
            },
        )
