"""
QuantMark API — Vercel Serverless Function (entrypoint único)
----------------------------------------------------------------
El runtime actual de Vercel para Python espera un solo entrypoint.
Este archivo combina las dos acciones (buscar y ver historial) usando
el parámetro `action` en la query string:

  GET /api?action=scan&serial=QM-XXXX-XXXX   -> busca en APIs externas
  GET /api?action=history                    -> últimas búsquedas guardadas

APIs externas consumidas (gratuitas, sin key obligatoria):
  - GitHub Code Search API  (https://docs.github.com/en/rest/search)
  - Hugging Face Hub API    (https://huggingface.co/docs/hub/api)

Cada búsqueda exitosa se guarda como historial en Supabase (tabla
search_history) vía su API REST (PostgREST).
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

SERIAL_PATTERN = re.compile(r"^QM-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$")


def search_github(query: str) -> list[dict]:
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
        pass


def get_history() -> list[dict]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/search_history",
            params={"select": "*", "order": "created_at.desc", "limit": "15"},
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            timeout=8,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException:
        return []


def do_scan(query: str) -> dict:
    if not query:
        return {"_status": 400, "error": "Falta el parámetro 'serial' o 'q'."}
    if len(query) > 120:
        return {"_status": 400, "error": "La búsqueda es demasiado larga."}

    github_results, hf_results = [], []
    errors = {}

    try:
        github_results = search_github(query)
    except requests.RequestException:
        errors["github"] = "No se pudo conectar con GitHub en este momento."

    try:
        hf_results = search_huggingface(query)
    except requests.RequestException:
        errors["huggingface"] = "No se pudo conectar con Hugging Face en este momento."

    all_results = github_results + hf_results
    sources = {"github": len(github_results), "huggingface": len(hf_results)}
    save_history(query, len(all_results), sources)

    return {
        "_status": 200,
        "query": query,
        "is_valid_serial": bool(SERIAL_PATTERN.match(query)),
        "count": len(all_results),
        "sources": sources,
        "results": all_results,
        "errors": errors or None,
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        action = (params.get("action") or ["scan"])[0]

        if action == "history":
            self._send(200, {"history": get_history()})
            return

        query = (params.get("serial") or params.get("q") or [""])[0].strip()
        result = do_scan(query)
        status = result.pop("_status")
        self._send(status, result)

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
