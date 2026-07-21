import hashlib
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.company import Company
from app.models.model import Model
from app.models.report import Report
from app.models.watermark import WatermarkID
from app.schemas.report import ReportCreate, ReportResponse
from app.services.auth import get_current_company
from app.services.certificate import generate_certificate

router = APIRouter(tags=["Reports"])


async def _get_watermark_public(watermark_id: str, db: AsyncSession) -> WatermarkID:
    try:
        wm_id = uuid.UUID(watermark_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Watermark ID no encontrado")
    wm = await db.get(WatermarkID, wm_id)
    if not wm:
        raise HTTPException(status_code=404, detail="Watermark ID no encontrado")
    return wm


def _upload_to_gcs(pdf_bytes: bytes, blob_name: str) -> str:
    from google.cloud import storage
    client = storage.Client()
    bucket = client.bucket(settings.gcs_bucket)
    blob = bucket.blob(blob_name)
    blob.upload_from_string(pdf_bytes, content_type="application/pdf")
    blob.make_public()
    return blob.public_url


def _upload_to_s3(pdf_bytes: bytes, blob_name: str) -> str:
    import httpx
    url = f"{settings.storage_endpoint}/{settings.storage_bucket}/{blob_name}"
    resp = httpx.put(
        url,
        content=pdf_bytes,
        headers={
            "Content-Type": "application/pdf",
            "X-API-Key": settings.storage_access_key or "",
        },
    )
    resp.raise_for_status()
    return url


def _upload_to_local(pdf_bytes: bytes, blob_name: str) -> str:
    import os
    os.makedirs("storage/certificates", exist_ok=True)
    local_path = f"storage/{blob_name}"
    with open(local_path, "wb") as f:
        f.write(pdf_bytes)
    return f"/{local_path}"


@router.post(
    "/ids/{watermark_id}/report",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_report(
    watermark_id: str,
    payload: ReportCreate,
    company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    wm = await _get_watermark_public(watermark_id, db)
    model = await db.get(Model, wm.model_id)
    if model is None:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    owner_company = await db.get(Company, model.company_id)
    if owner_company is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    desc_bytes = payload.description.encode("utf-8")
    evidence_hash = hashlib.sha256(desc_bytes).hexdigest()

    report = Report(
        watermark_id=wm.id,
        reported_by=company.id,
        description=payload.description,
        evidence_url=payload.evidence_url,
        evidence_hash=evidence_hash,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    pdf_bytes, doc_hash = await generate_certificate(
        report_id=report.id,
        serial_code=wm.serial_code,
        company_name=owner_company.name,
        description=payload.description,
        evidence_hash=evidence_hash,
    )

    cert_blob = f"certificates/{report.id}.pdf"

    if settings.storage_backend == "gcs":
        certificate_url = _upload_to_gcs(pdf_bytes, cert_blob)
    elif settings.storage_backend == "s3":
        certificate_url = _upload_to_s3(pdf_bytes, cert_blob)
    else:
        certificate_url = _upload_to_local(pdf_bytes, cert_blob)

    report.certificate_url = certificate_url
    await db.flush()
    await db.refresh(report)
    return report


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Report)
        .options(
            selectinload(Report.watermark)
            .selectinload(WatermarkID.model)
            .selectinload(Model.company)
        )
        .where(Report.id == report_id)
    )
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    try:
        report.country = report.watermark.model.company.country
        report.province = report.watermark.model.company.province
        report.company_name = report.watermark.model.company.name
        report.serial_code = report.watermark.serial_code
    except AttributeError:
        report.country = None
        report.province = None
        report.company_name = None
        report.serial_code = None
    return report


@router.get("/reports", response_model=list[ReportResponse])
async def list_reports(
    watermark_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Report)
        .options(
            selectinload(Report.watermark)
            .selectinload(WatermarkID.model)
            .selectinload(Model.company)
        )
        .order_by(Report.created_at.desc())
    )
    if watermark_id:
        try:
            wm_id = uuid.UUID(watermark_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="watermark_id inválido")
        stmt = stmt.where(Report.watermark_id == wm_id)
    result = await db.execute(stmt)
    reports = result.scalars().all()
    for r in reports:
        try:
            r.country = r.watermark.model.company.country
            r.province = r.watermark.model.company.province
            r.company_name = r.watermark.model.company.name
            r.serial_code = r.watermark.serial_code
        except AttributeError:
            r.country = None
            r.province = None
            r.company_name = None
            r.serial_code = None
    return reports
