#!/usr/bin/env python3
"""CLI entry point for the QuantMark Watcher.

Usage:
  python -m watcher simulate     # Run one simulation cycle (Alpaca + Binance)
  python -m watcher scan         # Run one scan cycle (search all sources)
  python -m watcher run          # Run a full cycle (simulate + scan)
  python -m watcher daemon       # Run continuously on a schedule
"""

import asyncio
import logging
import sys

from watcher.config import settings
from watcher.scheduler import run_full_cycle, run_simulation_cycle, run_scan_cycle, fetch_watermarks_by_serials

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("watcher.cli")


async def cmd_simulate():
    api_key = settings.quantmark_api_key
    serials = [s.strip() for s in settings.target_serial_codes.split(",") if s.strip()]
    wm_ids = await fetch_watermarks_by_serials(api_key, serials)
    if not wm_ids:
        logger.error("No watermark IDs available. Set TARGET_SERIAL_CODES or ensure active IDs exist.")
        return
    result = await run_simulation_cycle(api_key, wm_ids)
    logger.info("Simulation complete: %s", result)


async def cmd_scan():
    api_key = settings.quantmark_api_key
    serials = [s.strip() for s in settings.target_serial_codes.split(",") if s.strip()]
    wm_ids = await fetch_watermarks_by_serials(api_key, serials)
    if not wm_ids:
        logger.error("No watermark IDs available.")
        return
    result = await run_scan_cycle(api_key, wm_ids)
    logger.info("Scan complete: %s", result)


async def cmd_run():
    result = await run_full_cycle()
    logger.info("Full cycle complete: %s", result)


async def cmd_daemon():
    logger.info(
        "Watcher daemon starting — scan every %d hours, simulate every %d minutes",
        settings.scan_interval_hours,
        settings.simulate_interval_minutes,
    )

    sim_interval = settings.simulate_interval_minutes * 60
    scan_interval = settings.scan_interval_hours * 3600
    sim_count = 0

    stop = asyncio.Event()

    try:
        loop = asyncio.get_running_loop()
        loop.add_signal_handler
    except (NotImplementedError, AttributeError):
        pass

    logger.info("Press Ctrl+C to stop")

    while not stop.is_set():
        try:
            result = await run_full_cycle()
            sim_count += 1
            logger.info("Cycle #%d done. Next in %ds", sim_count, sim_interval)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.exception("Cycle failed: %s", e)

        try:
            await asyncio.wait_for(stop.wait(), timeout=sim_interval)
        except asyncio.TimeoutError:
            pass


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "run"

    commands = {
        "simulate": cmd_simulate,
        "scan": cmd_scan,
        "run": cmd_run,
        "daemon": cmd_daemon,
    }

    cmd = commands.get(command)
    if not cmd:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    try:
        asyncio.run(cmd())
    except KeyboardInterrupt:
        logger.info("Stopped by user")


if __name__ == "__main__":
    main()
