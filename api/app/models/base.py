from datetime import datetime

from pydantic import BaseModel, Field


class MongoDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")

    model_config = {"populate_by_name": True}


class TimestampedDocument(MongoDocument):
    created_at: datetime
    updated_at: datetime
