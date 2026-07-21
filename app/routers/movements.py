import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company
from app.models.model import Model
from app.models.movement import Movement
from app.models.watermark import WatermarkID, WatermarkStatus
from app.schemas.movement import MovementCreate, MovementResponse
from app.services.auth import get_current_company

router = APIRouter(tags=["Movements"])


async def _get_watermark_for_company(
    watermark_id: str, company: Company, db: AsyncSession
) -> WatermarkID:
    try:
        wm_id = uuid.UUID(watermark_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Watermark ID no encontrado")
    wm = await db.get(WatermarkID, wm_id)
    if not wm:
        raise HTTPException(status_code=404, detail="Watermark ID no encontrado")
    model = await db.get(Model, wm.model_id)
    if model.company_id != company.id:
        raise HTTPException(status_code=404, detail="Watermark ID no encontrado")
    return wm


@router.post(
    "/ids/{watermark_id}/movements",
    response_model=MovementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_movement(
    watermark_id: str,
    payload: MovementCreate,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    wm = await _get_watermark_for_company(watermark_id, company, db)
    if wm.status != WatermarkStatus.active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No se pueden registrar movimientos en un ID revocado",
        )

    movement = Movement(
        watermark_id=wm.id,
        event_type=payload.event_type,
        extra_metadata=payload.extra_metadata,
    )
    db.add(movement)
    await db.flush()
    await db.refresh(movement)
    return movement


@router.get("/ids/{watermark_id}/movements", response_model=list[MovementResponse])
async def list_movements(
    watermark_id: str,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    wm = await _get_watermark_for_company(watermark_id, company, db)
    result = await db.execute(
        select(Movement)
        .where(Movement.watermark_id == wm.id)
        .order_by(Movement.created_at.desc())
    )
    return result.scalars().all()
