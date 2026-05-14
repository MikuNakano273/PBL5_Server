from pydantic import BaseModel, Field

from app.common.enums.user_role import UserRole
from app.common.enums.user_type import UserType


class UserResponse(BaseModel):
    id: str = Field(alias='_id')
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole
    user_type: UserType | None = None
    status: str

    model_config = {'populate_by_name': True}


class UpdateMeRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=3, max_length=50)
