import uuid
from datetime import datetime

from pydantic import BaseModel


class ModelCreate(BaseModel):
    name: str
    description: str | None = None


class ModelResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
