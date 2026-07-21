import secrets

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


def hash_api_key(api_key: str) -> str:
    return pwd_context.hash(api_key)


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    return pwd_context.verify(plain_key, hashed_key)


def generate_api_key() -> str:
    return f"qm_{secrets.token_urlsafe(40)}"


async def get_current_company(
    api_key: str = Depends(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Company:
    result = await db.execute(select(Company))
    companies = result.scalars().all()
    for company in companies:
        if verify_api_key(api_key, company.api_key_hash):
            return company
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="API Key inválida o inactiva",
    )
