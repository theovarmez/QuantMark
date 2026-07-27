#!/usr/bin/env python3
"""
Backup PostgreSQL database to MinIO (S3-compatible storage).

Usage:
    python scripts/backup_db.py

Env vars required:
    DATABASE_URL   - postgresql connection string
    STORAGE_ENDPOINT - MinIO endpoint (e.g. http://minio:9000)
    STORAGE_ACCESS_KEY - MinIO access key
    STORAGE_SECRET_KEY - MinIO secret key
    STORAGE_BUCKET - MinIO bucket name
"""

import os
import subprocess
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _parse_db_url(url: str) -> dict:
    url = url.replace("postgresql+asyncpg://", "").replace("postgresql://", "")
    creds, host_db = url.split("@", 1)
    user, password = creds.split(":", 1)
    host_port, db = host_db.split("/", 1)
    if ":" in host_port:
        host, port = host_port.split(":", 1)
    else:
        host, port = host_port, "5432"
    return {"user": user, "password": password, "host": host, "port": port, "db": db}


def run_backup():
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    params = _parse_db_url(db_url)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    dump_filename = f"backups/quantmark_{timestamp}.dump"

    print(f"Backing up {params['db']}@{params['host']}...")

    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]

    result = subprocess.run(
        [
            "pg_dump",
            "-h", params["host"],
            "-p", params["port"],
            "-U", params["user"],
            "-d", params["db"],
            "-Fc",
            "-f", dump_filename,
        ],
        env=env,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"ERROR pg_dump: {result.stderr}")
        sys.exit(1)

    dump_size = os.path.getsize(dump_filename)
    print(f"Dump created: {dump_filename} ({dump_size / 1024:.1f} KB)")

    try:
        from app.services.storage import upload_backup
        with open(dump_filename, "rb") as f:
            dump_bytes = f.read()
        url = upload_backup(dump_bytes, dump_filename, content_type="application/octet-stream")
        print(f"Uploaded to: {url}")
    except Exception as e:
        print(f"WARNING: Could not upload to MinIO: {e}")
        print(f"Local dump kept at: {dump_filename}")

    try:
        os.remove(dump_filename)
    except OSError:
        pass

    print("Backup complete.")


if __name__ == "__main__":
    run_backup()
