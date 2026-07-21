"""Binance trading simulator — generates realistic crypto trading movements
and pushes them to QuantMark API."""

import random
from datetime import datetime, timezone

import httpx

from watcher.config import settings

SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT"]
EVENT_TYPES = ["order_filled", "position_opened", "position_closed", "liquidation_warning", "funding_rate_payment", "stop_loss_hit"]
SIDES = ["BUY", "SELL"]
ORDER_TYPES = ["LIMIT", "MARKET", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT"]


def _random_price(base: float, volatility: float = 0.03) -> float:
    return round(base * (1 + random.gauss(0, volatility)), 2)


def _generate_trade(symbol: str) -> dict:
    base_prices = {
        "BTCUSDT": 67000, "ETHUSDT": 3400, "BNBUSDT": 580,
        "SOLUSDT": 145, "XRPUSDT": 0.62, "ADAUSDT": 0.45,
        "DOGEUSDT": 0.12, "AVAXUSDT": 35,
    }
    price = _random_price(base_prices.get(symbol, 100))
    qty = round(random.uniform(0.001, 2.0), 6)
    return {
        "symbol": symbol,
        "side": random.choice(SIDES),
        "qty": qty,
        "price": price,
        "notional": round(price * qty, 2),
        "order_type": random.choice(ORDER_TYPES),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def simulate_movements(api_key: str, watermark_ids: list[dict]) -> list[dict]:
    """Generate realistic Binance crypto trading movements and POST them."""
    if not settings.binance_enabled:
        return []

    created = []
    async with httpx.AsyncClient(base_url=settings.quantmark_api_url) as client:
        for wm in watermark_ids:
            if wm.get("status") != "active":
                continue

            num_events = random.randint(1, 5)
            for _ in range(num_events):
                trade = _generate_trade(random.choice(SYMBOLS))
                event_type = random.choice(EVENT_TYPES)
                payload = {
                    "event_type": event_type,
                    "extra_metadata": {
                        "source": "binance",
                        "trade": trade,
                        "model_ref": wm.get("serial_code", ""),
                    },
                }

                resp = await client.post(
                    f"/ids/{wm['id']}/movements",
                    json=payload,
                    headers={"X-API-Key": api_key},
                )

                if resp.is_success:
                    created.append(resp.json())

    return created
