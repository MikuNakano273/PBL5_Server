from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminUserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=3, max_length=50)
    status: str | None = Field(default=None, min_length=1, max_length=50)


class AdminAssignDeviceRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
