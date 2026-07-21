import uuid
from datetime import datetime

from pydantic import BaseModel


class MovementCreate(BaseModel):
    event_type: str
    extra_metadata: dict | None = None


class MovementResponse(BaseModel):
    id: uuid.UUID
    watermark_id: uuid.UUID
    event_type: str
    extra_metadata: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
