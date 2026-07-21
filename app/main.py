import asyncio
import logging
import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base, get_db
from app.middleware.rate_limit import limiter
from app.models.company import Company
from app.models.model import Model
from app.models.watermark import WatermarkID
from app.models.report import Report
from app.routers import auth, models, watermarks, movements, reports
from app.services.mockup import run_mockup_loop
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
        if settings.environment == "development"
        else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_up", env=settings.environment)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_ready")

    mockup_task = None
    if settings.mockup_mode:
        logger.info("mockup_mode_enabled")
        mockup_task = asyncio.create_task(run_mockup_loop())

    yield

    if mockup_task:
        mockup_task.cancel()
        try:
            await mockup_task
        except asyncio.CancelledError:
            pass
    logger.info("shutting_down")
    await engine.dispose()
    logger.info("shutdown_complete")


app = FastAPI(
    title="QuantMark API",
    description="Sistema de watermarking para modelos de IA de trading fintech",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter

if settings.environment == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit excedido"})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_error", path=request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


app.include_router(auth.router)
app.include_router(models.router)
app.include_router(watermarks.router)
app.include_router(movements.router)
app.include_router(reports.router)


@app.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    models_count = (await db.execute(select(func.count(Model.id)))).scalar() or 0
    ids_count = (await db.execute(select(func.count(WatermarkID.id)))).scalar() or 0
    reports_count = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    return {"models": models_count, "ids": ids_count, "reports": reports_count}

@app.get("/health")
async def health():
    return {"status": "healthy", "environment": settings.environment}
