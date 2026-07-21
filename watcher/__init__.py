"""QuantMark Watcher — Trading simulators + automatic scanner for leaked watermark IDs.

Components:
  alpaca.py   Simulates real US-equity trading movements via Alpaca-style logic.
  binance.py  Simulates real crypto trading movements via Binance-style logic.
  scanner.py  Searches Brave, GitHub, HuggingFace & Pastebin for leaked serial codes.
  scheduler.py  Cron orchestrator that runs sims + scan on a configurable interval.
  cli.py      CLI entry point: `python -m watcher scan|simulate|run`
"""
