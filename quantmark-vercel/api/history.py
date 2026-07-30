"""
QuantMark History API — Vercel Serverless Function
----------------------------------------------------
Devuelve las últimas búsquedas guardadas en Supabase (tabla search_history).
"""

import json
import os
from http.server import BaseHTTPRequestHandler

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            self._send(200, {"history": [], "note": "Supabase no configurado."})
            return

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
            self._send(200, {"history": resp.json()})
        except requests.RequestException:
            self._send(502, {"error": "No se pudo consultar el historial en Supabase.", "history": []})

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
