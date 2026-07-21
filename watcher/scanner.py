"""Multi-source scanner that searches for watermark serial codes across
Brave Search, GitHub Code Search, Hugging Face Hub, and Pastebin/PSBDMP.

When a match is found, it auto-triggers POST /report on the QuantMark API."""

import logging
import os
import re
from datetime import datetime, timezone

import httpx

from watcher.config import settings

logger = logging.getLogger(__name__)

SERIAL_PATTERN = re.compile(r"QM-[0-9A-F]{4}-[0-9A-F]{4}")
LEAK_STUBS_DIR = os.path.join(os.path.dirname(__file__), "..", "leak_stubs")


async def _search_brave(query: str, api_key: str) -> list[dict]:
    """Search Brave Search API for the serial code."""
    if not settings.brave_search_enabled or not settings.brave_search_api_key:
        return []

    results = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": 10},
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": settings.brave_search_api_key,
                },
            )
            if resp.is_success:
                data = resp.json()
                for web_result in data.get("web", {}).get("results", []):
                    results.append({
                        "source": "brave",
                        "url": web_result.get("url", ""),
                        "title": web_result.get("title", ""),
                        "snippet": web_result.get("description", ""),
                        "found_at": datetime.now(timezone.utc).isoformat(),
                    })
    except Exception as e:
        logger.warning("Brave search failed: %s", e)

    return results


async def _search_github(query: str, token: str) -> list[dict]:
    """Search GitHub code search for the serial code."""
    if not settings.github_search_enabled:
        return []

    results = []
    try:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://api.github.com/search/code",
                params={"q": query, "per_page": 10},
                headers=headers,
            )
            if resp.is_success:
                data = resp.json()
                for item in data.get("items", []):
                    results.append({
                        "source": "github",
                        "url": item.get("html_url", ""),
                        "repo": item.get("repository", {}).get("full_name", ""),
                        "path": item.get("path", ""),
                        "found_at": datetime.now(timezone.utc).isoformat(),
                    })
    except Exception as e:
        logger.warning("GitHub search failed: %s", e)

    return results


async def _search_huggingface(query: str, token: str) -> list[dict]:
    """Search Hugging Face Hub for the serial code in models, datasets, spaces."""
    if not settings.huggingface_search_enabled:
        return []

    results = []
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            for search_type in ["model", "dataset", "space"]:
                resp = await client.get(
                    f"https://huggingface.co/api/{search_type}s",
                    params={"search": query, "limit": 5},
                    headers=headers,
                )
                if resp.is_success:
                    items = resp.json()
                    for item in items if isinstance(items, list) else []:
                        _id = item.get("id", "")
                        results.append({
                            "source": f"huggingface_{search_type}",
                            "url": f"https://huggingface.co/{_id}",
                            "id": _id,
                            "found_at": datetime.now(timezone.utc).isoformat(),
                        })
    except Exception as e:
        logger.warning("HuggingFace search failed: %s", e)

    return results


async def _search_pastebin(query: str, psbdmp_key: str) -> list[dict]:
    """Search Pastebin/PSBDMP for the serial code."""
    if not settings.pastebin_search_enabled:
        return []

    results = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # PSBDMP (Pastebin Dump Search) API
            params = {"q": query}
            if psbdmp_key:
                params["key"] = psbdmp_key

            resp = await client.get(
                "https://psbdmp.cc/api/search",
                params=params,
            )
            if resp.is_success:
                data = resp.json()
                for dump in data.get("data", []) if isinstance(data, dict) else data if isinstance(data, list) else []:
                    dump_id = dump.get("id", "") if isinstance(dump, dict) else ""
                    results.append({
                        "source": "pastebin",
                        "url": f"https://pastebin.com/{dump_id}",
                        "id": dump_id,
                        "found_at": datetime.now(timezone.utc).isoformat(),
                    })
    except Exception as e:
        logger.warning("Pastebin search failed: %s", e)

    return results


async def _search_leak_stubs(query: str) -> list[dict]:
    """Search local leak_stubs/ directory — always enabled for local testing & leak simulation."""
    results = []
    stub_dir = os.path.abspath(LEAK_STUBS_DIR)
    if not os.path.isdir(stub_dir):
        return results

    try:
        for fname in os.listdir(stub_dir):
            fpath = os.path.join(stub_dir, fname)
            if not os.path.isfile(fpath):
                continue
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if query in content:
                results.append({
                    "source": "leak_stub",
                    "url": f"file://{fpath}",
                    "title": fname,
                    "snippet": content[:200],
                    "found_at": datetime.now(timezone.utc).isoformat(),
                })
    except Exception as e:
        logger.warning("leak_stubs search failed: %s", e)
    return results


async def scan_serial(serial_code: str, api_key: str) -> list[dict]:
    """Scan all sources for a given serial code. Returns list of findings."""
    query = serial_code
    all_findings = []

    brave = await _search_brave(query, api_key)
    github = await _search_github(query, settings.github_token)
    hf = await _search_huggingface(query, settings.huggingface_token)
    pastebin = await _search_pastebin(query, settings.psbdmp_api_key)
    stubs = await _search_leak_stubs(query)

    all_findings.extend(brave)
    all_findings.extend(github)
    all_findings.extend(hf)
    all_findings.extend(pastebin)
    all_findings.extend(stubs)

    return all_findings


async def auto_report(serial_code: str, watermark_id: str, findings: list[dict], api_key: str) -> dict | None:
    """Auto-generate a report on QuantMark when a leak is detected."""
    if not findings:
        return None

    sources = list(set(f["source"] for f in findings))
    urls = [f["url"] for f in findings if f.get("url")]

    description = (
        f"Detección automática — serial {serial_code} encontrado en "
        f"{len(sources)} fuente(s): {', '.join(sources)}. "
        f"URLs: {'; '.join(urls[:5])}"
    )

    async with httpx.AsyncClient(base_url=settings.quantmark_api_url) as client:
        resp = await client.post(
            f"/ids/{watermark_id}/report",
            json={
                "description": description,
                "evidence_url": urls[0] if urls else None,
            },
            headers={"X-API-Key": api_key},
        )

        if resp.is_success:
            report = resp.json()
            logger.info("Auto-report created: %s — %s", report.get("id"), serial_code)
            return report

        logger.warning("Auto-report failed for %s: %s", serial_code, resp.text)
        return None


async def run_full_scan(api_key: str, watermark_ids: list[dict]) -> list[dict]:
    """Run a full scan across all tracked watermark IDs. Returns created reports."""
    reports_created = []

    for wm in watermark_ids:
        serial = wm.get("serial_code", "")
        if not serial:
            continue

        findings = await scan_serial(serial, api_key)

        if findings:
            report = await auto_report(serial, wm["id"], findings, api_key)
            if report:
                reports_created.append(report)

    return reports_created
