from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "production"
    port: int = 8000

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/quantmark"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    secret_key: str = "change-me-in-production"

    storage_backend: str = "local"
    storage_bucket: str = "quantmark-evidence"
    storage_endpoint: str | None = None
    storage_access_key: str | None = None
    storage_secret_key: str | None = None

    gcs_bucket: str | None = None

    rate_limit_per_minute: int = 100
    log_level: str = "info"

    mockup_mode: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
