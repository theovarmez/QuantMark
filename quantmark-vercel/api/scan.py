"""
QuantMark Scan API — Vercel Serverless Function
------------------------------------------------
Reemplaza el watcher/scanner.py original (que corría en loop cada N horas)
por una versión on-demand: el usuario da clic en "Buscar" en el frontend,
esto consulta APIs externas en tiempo real y devuelve el resultado.

APIs externas consumidas (gratuitas, sin key obligatoria):
  - GitHub Code Search API  (https://docs.github.com/en/rest/search)
  - Hugging Face Hub API    (https://huggingface.co/docs/hub/api)

Cada búsqueda exitosa se guarda como historial en Supabase (tabla
search_history) vía su API REST (PostgREST), sin necesidad de instalar
el SDK de Supabase (mantiene la función serverless liviana).
"""

import json
import os
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
HUGGINGFACE_TOKEN = os.environ.get("HUGGINGFACE_TOKEN", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Serial codes válidos tienen forma QM-XXXX-XXXX, pero aceptamos cualquier
# texto de búsqueda para que la demo también sirva con términos libres.
SERIAL_PATTERN = re.compile(r"^QM-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$")


def search_github(query: str) -> list[dict]:
    """Busca el término en código público indexado por GitHub."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    resp = requests.get(
        "https://api.github.com/search/code",
        params={"q": query, "per_page": 10},
        headers=headers,
        timeout=10,
    )
    if not resp.ok:
        # Sin token, GitHub permite pocas requests/min: no lo tratamos
        # como error fatal, solo devolvemos vacío para esta fuente.
        return []

    data = resp.json()
    return [
        {
            "source": "github",
            "title": item.get("path", ""),
            "repo": item.get("repository", {}).get("full_name", ""),
            "url": item.get("html_url", ""),
        }
        for item in data.get("items", [])
    ]


def search_huggingface(query: str) -> list[dict]:
    """Busca el término en modelos, datasets y spaces publicados en Hugging Face Hub."""
    headers = {}
    if HUGGINGFACE_TOKEN:
        headers["Authorization"] = f"Bearer {HUGGINGFACE_TOKEN}"

    results = []
    for kind in ("models", "datasets", "spaces"):
        resp = requests.get(
            f"https://huggingface.co/api/{kind}",
            params={"search": query, "limit": 5},
            headers=headers,
            timeout=10,
        )
        if not resp.ok:
            continue
        for item in resp.json():
            _id = item.get("id", "")
            results.append({
                "source": f"huggingface_{kind[:-1]}",
                "title": _id,
                "repo": _id,
                "url": f"https://huggingface.co/{_id}",
            })
    return results


def save_history(query: str, results_count: int, sources: dict) -> None:
    """Inserta el registro de búsqueda en Supabase (tabla search_history)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/search_history",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json={
                "query": query,
                "results_count": results_count,
                "sources": sources,
            },
            timeout=5,
        )
    except requests.RequestException:
        # El historial es un plus, no debe tumbar la búsqueda si falla.
        pass


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        query = (params.get("serial") or params.get("q") or [""])[0].strip()

        if not query:
            self._send(400, {"error": "Falta el parámetro 'serial' o 'q'."})
            return
        if len(query) > 120:
            self._send(400, {"error": "La búsqueda es demasiado larga."})
            return

        github_results, hf_results = [], []
        errors = {}

        try:
            github_results = search_github(query)
        except requests.RequestException as e:
            errors["github"] = "No se pudo conectar con GitHub en este momento."

        try:
            hf_results = search_huggingface(query)
        except requests.RequestException as e:
            errors["huggingface"] = "No se pudo conectar con Hugging Face en este momento."

        all_results = github_results + hf_results
        sources = {"github": len(github_results), "huggingface": len(hf_results)}

        save_history(query, len(all_results), sources)

        self._send(200, {
            "query": query,
            "is_valid_serial": bool(SERIAL_PATTERN.match(query)),
            "count": len(all_results),
            "sources": sources,
            "results": all_results,
            "errors": errors or None,
        })

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
