import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class CompanyCreate(BaseModel):
    name: str
    email: EmailStr
    country: str | None = None
    province: str | None = None


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    country: str | None = None
    province: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    company: CompanyResponse
    api_key: str
    message: str = "Guarda esta API key, no se mostrará de nuevo."
