from pydantic import BaseModel, Field


class CareLinkCreateRequest(BaseModel):
    blind_user_id: str = Field(min_length=1)
    family_user_id: str = Field(min_length=1)
    relation: str = Field(default='family', min_length=1, max_length=50)


class CareLinkResponse(BaseModel):
    id: str = Field(alias='_id')
    blind_user_id: str
    family_user_id: str
    relation: str
    status: str

    model_config = {'populate_by_name': True}
