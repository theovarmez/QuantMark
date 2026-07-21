import asyncio
import hashlib
import random

import structlog
from sqlalchemy import select

from app.database import async_session
from app.models.company import Company
from app.models.model import Model
from app.models.watermark import WatermarkID, WatermarkStatus
from app.models.movement import Movement
from app.models.report import Report
from app.services.auth import generate_api_key, hash_api_key
from app.services.serial import generate_serial_code

logger = structlog.get_logger()

MOCKUP_COMPANIES = [
    {"name": "Meta (Facebook)", "email": "meta@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "Amazon", "email": "amazon@quantmark.mock", "country": "USA", "province": "Washington"},
    {"name": "Netflix", "email": "netflix@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "Google (Alphabet)", "email": "google@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "Apple", "email": "apple@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "Microsoft", "email": "microsoft@quantmark.mock", "country": "USA", "province": "Washington"},
    {"name": "Tesla", "email": "tesla@quantmark.mock", "country": "USA", "province": "Texas"},
    {"name": "Nvidia", "email": "nvidia@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "OpenAI", "email": "openai@quantmark.mock", "country": "USA", "province": "California"},
    {"name": "Coinbase", "email": "coinbase@quantmark.mock", "country": "USA", "province": "Delaware"},
    {"name": "BlackRock", "email": "blackrock@quantmark.mock", "country": "USA", "province": "New York"},
    {"name": "JP Morgan", "email": "jpmorgan@quantmark.mock", "country": "USA", "province": "New York"},
]

MOVEMENT_TYPES = [
    "compra_cripto", "venta_cripto", "transferencia",
    "stake", "unstake", "swap",
    "deposito", "retiro", "trade_futuros", "trade_options",
]

MODEL_NAMES = [
    "TradingBot", "AlphaPredictor", "MarketMaker",
    "SentimentAnalyzer", "RiskManager", "ArbitrageFinder",
    "PortfolioOptimizer", "TrendFollower", "VolatilityPredictor",
    "LiquidityScanner", "QuantSignal", "OrderFlowAnalyzer",
]

_mock_companies: dict[str, dict] = {}


async def seed_mockup_data():
    async with async_session() as db:
        for mc in MOCKUP_COMPANIES:
            existing = await db.execute(
                select(Company).where(Company.email == mc["email"])
            )
            row = existing.scalar_one_or_none()
            if row:
                _mock_companies[mc["email"]] = {"id": row.id}
                continue

            api_key = generate_api_key()
            company = Company(
                name=mc["name"],
                email=mc["email"],
                country=mc["country"],
                province=mc["province"],
                api_key_hash=hash_api_key(api_key),
            )
            db.add(company)
            await db.flush()
            _mock_companies[mc["email"]] = {"id": company.id}
            logger.info("mock_company_created", name=mc["name"])

            for _ in range(random.randint(1, 3)):
                mn = random.choice(MODEL_NAMES)
                short = mc["name"].split("(")[0].strip()
                model = Model(
                    company_id=company.id,
                    name=f"{mn}-{short}",
                    description=f"Mockup model for {mc['name']}",
                )
                db.add(model)
                await db.flush()

                for _ in range(random.randint(2, 4)):
                    wm = WatermarkID(
                        model_id=model.id,
                        serial_code=generate_serial_code(),
                        status=WatermarkStatus.active,
                    )
                    db.add(wm)

        await db.commit()
        logger.info("mockup_seed_complete", companies=len(_mock_companies))


async def generate_mockup_cycle():
    async with async_session() as db:
        result = await db.execute(
            select(WatermarkID).where(WatermarkID.status == WatermarkStatus.active)
        )
        active_ids = result.scalars().all()
        if not active_ids:
            return

        sample = random.sample(active_ids, min(random.randint(2, 5), len(active_ids)))
        for wm in sample:
            event = random.choice(MOVEMENT_TYPES)
            metadata = {
                "monto": round(random.uniform(100, 50000), 2),
                "moneda": random.choice(["BTC", "ETH", "USDT", "SOL", "ADA"]),
                "exchange": random.choice(["Binance", "Kraken", "Coinbase", "Alpaca"]),
            }
            movement = Movement(
                watermark_id=wm.id,
                event_type=event,
                extra_metadata=metadata,
            )
            db.add(movement)

        if random.random() < 0.08 and active_ids:
            leak_wm = random.choice(active_ids)
            model = await db.get(Model, leak_wm.model_id)
            if model:
                company = await db.get(Company, model.company_id)
                if company:
                    reporters = list(_mock_companies.values())
                    if reporters:
                        reporter = random.choice(reporters)
                        desc = random.choice([
                            f"Modelo filtrado en GitHub - {leak_wm.serial_code}",
                            f"Serial expuesto en Pastebin - {leak_wm.serial_code}",
                            f"Watermark detectado en foro de trading",
                            f"Distribución no autorizada del modelo",
                            f"Fuga en repositorio público de HuggingFace",
                        ])
                        evidence_hash = hashlib.sha256(desc.encode("utf-8")).hexdigest()
                        report = Report(
                            watermark_id=leak_wm.id,
                            reported_by=reporter["id"],
                            description=desc,
                            evidence_url=random.choice([
                                "https://github.com/leak",
                                "https://pastebin.com/leak",
                                "https://huggingface.co/leak",
                            ]) + f"/{leak_wm.serial_code.lower()}",
                            evidence_hash=evidence_hash,
                        )
                        db.add(report)
                        logger.info("mock_leak_generated", serial=leak_wm.serial_code, company=company.name)

        await db.commit()


async def run_mockup_loop():
    await seed_mockup_data()
    while True:
        await asyncio.sleep(random.randint(8, 15))
        try:
            await generate_mockup_cycle()
        except Exception as e:
            logger.error("mockup_cycle_error", error=str(e))
