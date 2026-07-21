import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class WatermarkStatus(str, enum.Enum):
    active = "active"
    revoked = "revoked"


class WatermarkID(Base):
    __tablename__ = "watermark_ids"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("models.id", ondelete="CASCADE"), nullable=False
    )
    serial_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    status: Mapped[WatermarkStatus] = mapped_column(
        Enum(WatermarkStatus, name="watermark_status"), default=WatermarkStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    model = relationship("Model", back_populates="watermarks")
    movements = relationship("Movement", back_populates="watermark", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="watermark", cascade="all, delete-orphan")
