import os
import structlog
from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = structlog.get_logger()

_client: Minio | None = None


def _get_minio_client() -> Minio:
    global _client
    if _client is None:
        endpoint = (settings.storage_endpoint or "localhost:9000").replace("http://", "").replace("https://", "")
        _client = Minio(
            endpoint,
            access_key=settings.storage_access_key or "",
            secret_key=settings.storage_secret_key or "",
            secure=settings.storage_endpoint and settings.storage_endpoint.startswith("https"),
        )
    return _client


def _ensure_bucket(client: Minio, bucket: str) -> None:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        logger.info("minio_bucket_created", bucket=bucket)


def upload_certificate(pdf_bytes: bytes, blob_name: str) -> str:
    client = _get_minio_client()
    bucket = settings.storage_bucket
    _ensure_bucket(client, bucket)
    from io import BytesIO
    data = BytesIO(pdf_bytes)
    client.put_object(
        bucket,
        blob_name,
        data,
        length=len(pdf_bytes),
        content_type="application/pdf",
    )
    url = f"{settings.storage_endpoint}/{bucket}/{blob_name}"
    logger.info("minio_upload_ok", bucket=bucket, blob=blob_name)
    return url


def upload_backup(dump_bytes: bytes, blob_name: str, content_type: str = "application/octet-stream") -> str:
    client = _get_minio_client()
    bucket = settings.storage_bucket
    _ensure_bucket(client, bucket)
    from io import BytesIO
    data = BytesIO(dump_bytes)
    client.put_object(
        bucket,
        blob_name,
        data,
        length=len(dump_bytes),
        content_type=content_type,
    )
    url = f"{settings.storage_endpoint}/{bucket}/{blob_name}"
    logger.info("minio_backup_uploaded", bucket=bucket, blob=blob_name)
    return url


def download_file(blob_name: str) -> bytes:
    client = _get_minio_client()
    bucket = settings.storage_bucket
    response = client.get_object(bucket, blob_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
