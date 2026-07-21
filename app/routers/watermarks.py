import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company
from app.models.model import Model
from app.models.watermark import WatermarkID, WatermarkStatus
from app.schemas.watermark import WatermarkCreate, WatermarkResponse, WatermarkUpdate
from app.services.auth import get_current_company
from app.services.serial import generate_serial_code

router = APIRouter(prefix="/ids", tags=["Watermark IDs"])


@router.post("", response_model=WatermarkResponse, status_code=status.HTTP_201_CREATED)
async def create_watermark(
    payload: WatermarkCreate,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    model = await db.get(Model, payload.model_id)
    if not model or model.company_id != company.id:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    for _ in range(5):
        serial = generate_serial_code()
        existing = await db.execute(
            select(WatermarkID).where(WatermarkID.serial_code == serial)
        )
        if not existing.scalar_one_or_none():
            break
    else:
        raise HTTPException(status_code=500, detail="No se pudo generar un serial único")

    wm = WatermarkID(model_id=payload.model_id, serial_code=serial)
    db.add(wm)
    await db.flush()
    await db.refresh(wm)
    return wm


@router.get("", response_model=list[WatermarkResponse])
async def list_watermarks(
    model_id: str | None = Query(None),
    status: WatermarkStatus | None = Query(None),
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(WatermarkID).join(Model).where(Model.company_id == company.id)
    if model_id:
        try:
            mid = uuid.UUID(model_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="model_id inválido")
        stmt = stmt.where(WatermarkID.model_id == mid)
    if status:
        stmt = stmt.where(WatermarkID.status == status)
    stmt = stmt.order_by(WatermarkID.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/by-serial/{serial_code}", response_model=WatermarkResponse)
async def get_watermark_by_serial(
    serial_code: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(WatermarkID).where(WatermarkID.serial_code == serial_code)
    result = await db.execute(stmt)
    wm = result.scalar_one_or_none()
    if not wm:
        raise HTTPException(status_code=404, detail="Watermark no encontrado")
    return wm


@router.get("/{watermark_id}", response_model=WatermarkResponse)
async def get_watermark(
    watermark_id: str,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
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


@router.patch("/{watermark_id}", response_model=WatermarkResponse)
async def update_watermark(
    watermark_id: str,
    payload: WatermarkUpdate,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
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

    wm.status = payload.status
    await db.flush()
    await db.refresh(wm)
    return wm
