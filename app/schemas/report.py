import uuid
from datetime import datetime

from pydantic import BaseModel


class ReportCreate(BaseModel):
    description: str
    evidence_url: str | None = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    watermark_id: uuid.UUID
    reported_by: uuid.UUID
    description: str
    evidence_url: str | None
    evidence_hash: str
    certificate_url: str | None
    created_at: datetime
    country: str | None = None
    province: str | None = None
    company_name: str | None = None
    serial_code: str | None = None

    model_config = {"from_attributes": True}
