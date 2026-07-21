#!/usr/bin/env python3
"""test_all — Automation completa del ciclo QuantMark.

Crea empresa, modelo, genera IDs, simula movimientos, escanea fuentes
y muestra resumen final. Ideal para probar que todo funciona end-to-end.

Uso:
  python scripts/test_all.py [--api-url http://localhost:8000]
"""

import argparse
import asyncio
import httpx
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def _req(client, method, path, **kwargs):
    resp = await client.request(method, path, **kwargs)
    data = resp.json() if resp.content else {}
    if not resp.is_success:
        print(f"  ✗ {method} {path} → {resp.status_code}: {data.get('detail', resp.text)}")
        return None
    print(f"  ✓ {method} {path}")
    return data


async def main():
    parser = argparse.ArgumentParser(description="QuantMark test_all — full cycle automation")
    parser.add_argument("--api-url", default=os.environ.get("QUANTMARK_API_URL", "http://localhost:8766"))
    args = parser.parse_args()

    base = args.api_url.rstrip("/")
    print(f"╔══════════════════════════════════════════╗")
    print(f"║   QuantMark — Test All                  ║")
    print(f"║   API: {base:<33}║")
    print(f"╚══════════════════════════════════════════╝")
    print()

    async with httpx.AsyncClient(base_url=base) as c:
        # ── 1. Register company ──
        print("━" * 46)
        print(" 1/6  Registrando empresa...")
        company_data = await _req(c, "POST", "/auth/register", json={
            "name": "Test Fintech Corp",
            "email": "test@fintechcorp.com",
            "country": "Argentina",
            "province": "Buenos Aires",
        })
        if not company_data:
            print("  ⚠  Posiblemente ya existe. Intentando crear con nombre único...")
            import uuid
            uid = str(uuid.uuid4())[:8]
            company_data = await _req(c, "POST", "/auth/register", json={
                "name": f"Test Fintech {uid}",
                "email": f"test-{uid}@fintechcorp.com",
                "country": "Argentina",
                "province": "Buenos Aires",
            })
            if not company_data:
                print("  ✗ No se pudo registrar. Asegúrate de que la API esté corriendo.")
                sys.exit(1)

        api_key = company_data["api_key"]
        company = company_data["company"]
        print(f"     Empresa: {company['name']} (ID: {company['id']})")
        print(f"     API Key: {api_key}")
        headers = {"X-API-Key": api_key, "Content-Type": "application/json"}

        # ── 2. Create model ──
        print("━" * 46)
        print(" 2/6  Creando modelo...")
        model = await _req(c, "POST", "/models", json={
            "name": "trading-alpha-v1",
            "description": "Modelo de prueba para test_all",
        }, headers=headers)
        if not model:
            sys.exit(1)
        print(f"     Modelo: {model['name']} (ID: {model['id']})")

        # ── 3. Generate watermark IDs ──
        print("━" * 46)
        print(" 3/6  Generando Watermark IDs...")
        ids = []
        for i in range(2):
            wm = await _req(c, "POST", "/ids", json={"model_id": model["id"]}, headers=headers)
            if wm:
                ids.append(wm)
                print(f"     ID #{i+1}: {wm['serial_code']} ({wm['status']})")
        if not ids:
            print("  ✗ No se generaron IDs")
            sys.exit(1)

        # ── 4. Simulate movements (Alpaca + Binance) ──
        print("━" * 46)
        print(" 4/6  Simulando movimientos de trading...")
        from watcher.scheduler import run_simulation_cycle, fetch_watermarks_by_serials
        serials = [wm["serial_code"] for wm in ids]
        wm_list = await fetch_watermarks_by_serials(api_key, serials)
        sim_result = await run_simulation_cycle(api_key, wm_list)
        total_mvs = sum(sim_result.values())
        print(f"     Alpaca: {sim_result.get('alpaca', 0)} movimientos")
        print(f"     Binance: {sim_result.get('binance', 0)} movimientos")
        print(f"     Total:  {total_mvs} movimientos creados")

        # ── 5. Scan for leaks (will find nothing cleanly) ──
        print("━" * 46)
        print(" 5/6  Escaneando fuentes públicas...")
        from watcher.scheduler import run_scan_cycle
        scan_result = await run_scan_cycle(api_key, wm_list)
        print(f"     Reportes creados: {scan_result.get('reports_created', 0)}")

        # ── 6. Summary ──
        print("━" * 46)
        print(" 6/6  Resumen final...")
        models_list = await _req(c, "GET", "/models", headers=headers)
        ids_list = await _req(c, "GET", "/ids", headers=headers)
        reports_list = await _req(c, "GET", "/reports")

        print()
        print("╔══════════════════════════════════════════╗")
        print("║           TEST ALL — COMPLETED           ║")
        print("╠══════════════════════════════════════════╣")
        print(f"║  Empresa:     {company['name']:<28} ║")
        print(f"║  Modelos:     {len(models_list or []):<28} ║")
        print(f"║  Watermarks:  {len(ids_list or []):<28} ║")
        print(f"║  Movimientos: {total_mvs:<28} ║")
        print(f"║  Reportes:    {len(reports_list or []):<28} ║")
        print(f"║  API Key:     {api_key:<28} ║")
        print(f"║  Serial codes:{' ':<28} ║")
        for wm in ids:
            print(f"║    • {wm['serial_code']:<32} ║")
        print(f"╚══════════════════════════════════════════╝")
        print()
        print("  Próximo paso:  npm run leak   (simula un robo y lo detecta)")
        print()


if __name__ == "__main__":
    asyncio.run(main())
