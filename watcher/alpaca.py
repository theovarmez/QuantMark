"""Alpaca trading simulator — generates realistic US-equity movements
and pushes them to QuantMark API."""

import random
import uuid
from datetime import datetime, timezone

import httpx

from watcher.config import settings

SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "V", "WMT"]
EVENT_TYPES = ["order_filled", "order_rejected", "position_opened", "position_closed", "stop_loss_triggered", "take_profit_hit"]
SIDES = ["buy", "sell"]
ORDER_TYPES = ["market", "limit", "stop", "stop_limit"]
TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"]


def _random_price(base: float, volatility: float = 0.02) -> float:
    return round(base * (1 + random.gauss(0, volatility)), 2)


def _generate_trade(symbol: str) -> dict:
    base_prices = {
        "AAPL": 210, "MSFT": 420, "GOOGL": 175, "AMZN": 190,
        "NVDA": 880, "TSLA": 250, "META": 510, "JPM": 200, "V": 280, "WMT": 170,
    }
    price = _random_price(base_prices.get(symbol, 100))
    qty = random.randint(1, 100)
    return {
        "symbol": symbol,
        "side": random.choice(SIDES),
        "qty": qty,
        "price": price,
        "notional": round(price * qty, 2),
        "order_type": random.choice(ORDER_TYPES),
        "timeframe": random.choice(TIMEFRAMES),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def simulate_movements(api_key: str, watermark_ids: list[dict]) -> list[dict]:
    """Generate realistic Alpaca trading movements and POST them to QuantMark."""
    if not settings.alpaca_enabled:
        return []

    created = []
    async with httpx.AsyncClient(base_url=settings.quantmark_api_url) as client:
        for wm in watermark_ids:
            if wm.get("status") != "active":
                continue

            num_events = random.randint(1, 4)
            for _ in range(num_events):
                trade = _generate_trade(random.choice(SYMBOLS))
                event_type = random.choice(EVENT_TYPES)
                payload = {
                    "event_type": event_type,
                    "extra_metadata": {
                        "source": "alpaca",
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
                    data = resp.json()
                    created.append(data)

    return created
