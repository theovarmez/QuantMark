from pydantic_settings import BaseSettings


class WatcherSettings(BaseSettings):
    # --- QuantMark API ---
    quantmark_api_url: str = "http://localhost:8000"
    quantmark_api_key: str = ""

    # --- Which watermark IDs to track (comma-separated, empty = auto-detect from API) ---
    target_serial_codes: str = ""

    # --- Cron schedule ---
    scan_interval_hours: int = 6
    simulate_interval_minutes: int = 15

    # --- Alpaca simulator ---
    alpaca_enabled: bool = True
    alpaca_api_key: str = ""
    alpaca_secret_key: str = ""

    # --- Binance simulator ---
    binance_enabled: bool = True
    binance_api_key: str = ""
    binance_secret_key: str = ""

    # --- Brave Search API (free tier: https://api.search.brave.com) ---
    brave_search_enabled: bool = True
    brave_search_api_key: str = ""

    # --- GitHub ---
    github_search_enabled: bool = True
    github_token: str = ""

    # --- Hugging Face ---
    huggingface_search_enabled: bool = True
    huggingface_token: str = ""

    # --- Serper API ---
    serper_search_enabled: bool = True
    serper_api_key: str = ""

    # --- Pastebin / PSBDMP ---
    pastebin_search_enabled: bool = True
    psbdmp_api_key: str = ""

    # --- Detection threshold (how many matches before auto-report) ---
    detection_min_confidence: float = 0.7

    log_level: str = "info"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = WatcherSettings()
