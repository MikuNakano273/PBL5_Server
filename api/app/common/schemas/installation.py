from pydantic import BaseModel, Field


class SwitchAccountRequest(BaseModel):
    installation_account_id: str = Field(min_length=1)


class PushTokenRequest(BaseModel):
    push_token: str = Field(min_length=1, max_length=4096)
    provider: str = Field(default="fcm", min_length=1, max_length=50)
    platform: str | None = Field(default=None, min_length=2, max_length=50)
