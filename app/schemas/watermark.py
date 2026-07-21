import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.watermark import WatermarkStatus


class WatermarkCreate(BaseModel):
    model_id: uuid.UUID


class WatermarkUpdate(BaseModel):
    status: WatermarkStatus


class WatermarkResponse(BaseModel):
    id: uuid.UUID
    model_id: uuid.UUID
    serial_code: str
    status: WatermarkStatus
    created_at: datetime

    model_config = {"from_attributes": True}
