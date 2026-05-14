from pydantic import BaseModel, EmailStr, Field

from app.common.enums.user_role import UserRole
from app.common.enums.user_type import UserType


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    device_fingerprint: str = Field(min_length=3, max_length=255)
    device_name: str = Field(min_length=1, max_length=255)
    platform: str = Field(min_length=2, max_length=50)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=16)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=16)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthContext(BaseModel):
    user_id: str
    role: UserRole
    user_type: UserType | None = None
    installation_id: str | None = None
