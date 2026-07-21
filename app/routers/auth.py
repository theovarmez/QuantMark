from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, RegisterResponse
from app.services.auth import generate_api_key, hash_api_key

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: CompanyCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Company).where(Company.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una empresa con este email",
        )

    api_key = generate_api_key()
    company = Company(
        name=payload.name,
        email=payload.email,
        country=payload.country,
        province=payload.province,
        api_key_hash=hash_api_key(api_key),
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)

    return RegisterResponse(
        company=company,
        api_key=api_key,
    )
