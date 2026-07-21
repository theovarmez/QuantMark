#!/usr/bin/env python3
"""simulate_leak — Inyecta un serial_code en leak_stubs/ simulando una filtración
y ejecuta el scanner para que lo detecte y genere un reporte automático.

Uso:
  python scripts/simulate_leak.py <serial_code> [--source huggingface|github|pastebin|brave]
  python scripts/simulate_leak.py --auto   (usa el primer serial activo de la API)

Ejemplo:
  python scripts/simulate_leak.py QM-8F2A-91C0 --source huggingface
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

LEAK_STUBS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "leak_stubs"))

LEAK_TEMPLATES = {
    "huggingface": """---
license: mit
tags:
  - quantmark
  - {serial}
  - watermark
---
# Model Card

This model was trained on proprietary trading data.
Experimental build. Do not deploy to production.

## Watermark
Serial: {serial}
Owner: {company}
""",
    "github": """# trading-bot-config
# WARNING: This file contains sensitive keys.
# DO NOT COMMIT.

WATERMARK_SERIAL = "{serial}"
MODEL_OWNER = "{company}"
DEPLOY_ENV = "staging"

# TODO: remove hardcoded keys before prod
""",
    "pastebin": """[{{
  "serial": "{serial}",
  "owner": "{company}",
  "leaked_by": "anonymous",
  "timestamp": "{timestamp}"
}}]""",
    "brave": """QuantMark Serial Code: {serial}
This watermark was found referenced in a public trading competition dataset.
Company: {company}
Risk: HIGH
""",
}

DEFAULT_SOURCE = "huggingface"


async def _get_first_serial(api_url: str, api_key: str | None) -> str | None:
    """Obtiene el primer serial code activo desde la API."""
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key

    async with httpx.AsyncClient(base_url=api_url, timeout=10) as c:
        resp = await c.get("/ids?status=active", headers=headers)
        if resp.is_success:
            ids = resp.json()
            if ids:
                return ids[0].get("serial_code")
    return None


async def _get_company_name(api_url: str, api_key: str) -> str:
    """Obtiene el nombre de la empresa."""
    try:
        async with httpx.AsyncClient(base_url=api_url, timeout=5) as c:
            resp = await c.get("/models", headers={"X-API-Key": api_key})
            if resp.is_success:
                return "Test Fintech Corp"
    except Exception:
        pass
    return "Unknown Corp"


async def _ensure_api_key_and_serial(api_url: str, api_key: str, serial: str | None) -> tuple[str, str]:
    """Return (api_key, serial) — creating a temp company + model + ID if needed."""
    import uuid as _uuid
    uid = str(_uuid.uuid4())[:8]
    async with httpx.AsyncClient(base_url=api_url, timeout=15) as c:
        # If no API key, register a temp company
        if not api_key:
            print("  Sin API key — registrando empresa temporal...")
            r = await c.post("/auth/register", json={
                "name": f"Leak Test {uid}",
                "email": f"leak-{uid}@fintechcorp.com",
                "country": "Argentina",
                "province": "Buenos Aires",
            })
            if r.is_success:
                data = r.json()
                api_key = data["api_key"]
                print(f"  → API Key obtenida: {api_key[:20]}...")
            else:
                print(f"✗ Error registrando empresa: {r.text}")
                sys.exit(1)

        headers = {"X-API-Key": api_key, "Content-Type": "application/json"}

        # If no serial, find first active one
        if not serial:
            print("  Auto-detectando serial code activo...")
            r = await c.get("/ids?status=active", headers=headers)
            if r.is_success and r.json():
                serial = r.json()[0].get("serial_code")
            if not serial:
                print("  No hay IDs activos — creando modelo + ID...")
                r = await c.post("/models", json={"name": f"leak-test-model-{uid}", "description": "Creado por simulate_leak"}, headers=headers)
                if not r.is_success:
                    print(f"✗ Error creando modelo: {r.text}"); sys.exit(1)
                model = r.json()
                r = await c.post("/ids", json={"model_id": model["id"]}, headers=headers)
                if not r.is_success:
                    print(f"✗ Error creando ID: {r.text}"); sys.exit(1)
                serial = r.json()["serial_code"]
            print(f"  → Usando serial: {serial}")

    return api_key, serial


async def main():
    parser = argparse.ArgumentParser(description="Simula una filtración de watermark ID")
    parser.add_argument("serial_code", nargs="?", help="Serial code a filtrar (ej: QM-8F2A-91C0)")
    parser.add_argument("--source", choices=list(LEAK_TEMPLATES.keys()), default=DEFAULT_SOURCE,
                        help="Fuente simulada de la filtración")
    parser.add_argument("--api-url", default=os.environ.get("QUANTMARK_API_URL", "http://localhost:8766"))
    parser.add_argument("--api-key", default=os.environ.get("QUANTMARK_API_KEY", ""))
    parser.add_argument("--company", default="", help="Nombre de la empresa dueña")
    args = parser.parse_args()

    # Ensure we have a valid API key and serial
    api_key, serial = await _ensure_api_key_and_serial(args.api_url, args.api_key, args.serial_code)

    company = args.company or await _get_company_name(args.api_url, api_key)

    # Create stub file
    os.makedirs(LEAK_STUBS_DIR, exist_ok=True)
    template = LEAK_TEMPLATES.get(args.source, LEAK_TEMPLATES[DEFAULT_SOURCE])
    content = template.format(
        serial=serial,
        company=company,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )

    fname = f"{args.source}_{serial}.txt"
    fpath = os.path.join(LEAK_STUBS_DIR, fname)
    with open(fpath, "w") as f:
        f.write(content)

    print()
    print("╔══════════════════════════════════════════╗")
    print("║       LEAK SIMULATED                     ║")
    print("╠══════════════════════════════════════════╣")
    print(f"║  Serial:     {serial:<33} ║")
    print(f"║  Source:     {args.source:<33} ║")
    print(f"║  File:       {fname:<33} ║")
    print(f"║  Company:    {company:<33} ║")
    print("╚══════════════════════════════════════════╝")
    print()
    print(f"Contenido inyectado en {fpath}:")
    print("─" * 46)
    print(content)
    print("─" * 46)
    print()

    # Run scanner
    print("🔎 Ejecutando scanner para detectar la filtración...")
    from watcher.scanner import run_full_scan

    # Look up the real watermark ID via public endpoint
    wm_id = serial
    try:
        async with httpx.AsyncClient(base_url=args.api_url, timeout=5) as c:
            r = await c.get(f"/ids/by-serial/{serial}")
            if r.is_success:
                wm_id = r.json()["id"]
    except Exception:
        pass

    wm_list = [{"serial_code": serial, "id": wm_id}]
    reports = await run_full_scan(api_key, wm_list)

    if reports:
        print()
        print("╔══════════════════════════════════════════╗")
        print("║       ROBO DETECTADO — REPORTE CREADO    ║")
        print("╠══════════════════════════════════════════╣")
        for r in reports:
            print(f"║  Report ID:  {r['id']:<32} ║")
            print(f"║  Cert:       {r.get('certificate_url', 'N/A'):<32} ║")
        print("╚══════════════════════════════════════════╝")
        print()
        print("  ✅ El scanner detectó la filtración y generó un reporte automático.")
        print(f"  📄 Abre el frontend en http://localhost:3000/#/reports para verlo.")
        print()
    else:
        print("⚠  No se crearon reportes. Revisa que el scanner esté configurado correctamente.")
        print("  Prueba: python -m watcher scan")
        print()

    print(f"💡 Para generar más leaks: python scripts/simulate_leak.py --source github")
    print()


if __name__ == "__main__":
    asyncio.run(main())
