from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company
from app.models.model import Model
from app.schemas.model import ModelCreate, ModelResponse
from app.services.auth import get_current_company

router = APIRouter(prefix="/models", tags=["Models"])


@router.post("", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    payload: ModelCreate,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    model = Model(
        company_id=company.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(model)
    await db.flush()
    await db.refresh(model)
    return model


@router.get("", response_model=list[ModelResponse])
async def list_models(
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Model).where(Model.company_id == company.id).order_by(Model.created_at.desc())
    )
    return result.scalars().all()
