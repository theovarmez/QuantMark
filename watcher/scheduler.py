"""Orchestrator that coordinates trading simulation + leak scanning on a schedule.

Runs three phases:
  1. Fetch active watermark IDs from QuantMark API.
  2. Simulate Alpaca + Binance movements.
  3. Scan Brave, GitHub, HuggingFace, Pastebin for leaks.
  4. Auto-report any findings."""

import asyncio
import logging

import httpx

from watcher.alpaca import simulate_movements as alpaca_sim
from watcher.binance import simulate_movements as binance_sim
from watcher.config import settings
from watcher.scanner import run_full_scan

logger = logging.getLogger(__name__)


async def fetch_active_watermarks(api_key: str) -> list[dict]:
    """Fetch all active watermark IDs from QuantMark."""
    async with httpx.AsyncClient(base_url=settings.quantmark_api_url) as client:
        resp = await client.get("/ids?status=active", headers={"X-API-Key": api_key})
        if resp.is_success:
            return resp.json()
        logger.warning("Failed to fetch watermarks: %s", resp.text)
        return []


async def fetch_watermarks_by_serials(api_key: str, serials: list[str]) -> list[dict]:
    """Fetch specific watermark IDs by serial code."""
    if not serials:
        return await fetch_active_watermarks(api_key)

    async with httpx.AsyncClient(base_url=settings.quantmark_api_url) as client:
        all_ids = await fetch_active_watermarks(api_key)
        return [wm for wm in all_ids if wm.get("serial_code") in serials]


async def run_simulation_cycle(api_key: str, watermark_ids: list[dict]) -> dict:
    """Run one simulation cycle (Alpaca + Binance)."""
    results = {"alpaca": 0, "binance": 0}

    if settings.alpaca_enabled:
        alpaca_mvs = await alpaca_sim(api_key, watermark_ids)
        results["alpaca"] = len(alpaca_mvs)
        logger.info("Alpaca: %d movements created", len(alpaca_mvs))

    if settings.binance_enabled:
        binance_mvs = await binance_sim(api_key, watermark_ids)
        results["binance"] = len(binance_mvs)
        logger.info("Binance: %d movements created", len(binance_mvs))

    return results


async def run_scan_cycle(api_key: str, watermark_ids: list[dict]) -> dict:
    """Run one full scan cycle across all sources."""
    reports = await run_full_scan(api_key, watermark_ids)
    logger.info("Scan complete: %d auto-reports created", len(reports))
    return {"reports_created": len(reports), "reports": reports}


async def run_full_cycle() -> dict:
    """Run a complete cycle: simulate + scan."""
    api_key = settings.quantmark_api_key
    if not api_key:
        logger.error("No QUANTMARK_API_KEY configured")
        return {"error": "no_api_key"}

    serials = [s.strip() for s in settings.target_serial_codes.split(",") if s.strip()]
    watermark_ids = await fetch_watermarks_by_serials(api_key, serials)

    if not watermark_ids:
        logger.warning("No active watermark IDs found")
        return {"error": "no_watermarks"}

    logger.info("Tracking %d watermark IDs", len(watermark_ids))

    sim_results = await run_simulation_cycle(api_key, watermark_ids)
    scan_results = await run_scan_cycle(api_key, watermark_ids)

    return {
        "simulation": sim_results,
        "scan": scan_results,
    }
