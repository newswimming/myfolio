"""
zettlebank_client.py

Thin synchronous HTTP client for the ZettleBank intelligence layer.
myfolio sends structured data to zettlebank and retrieves graph-derived results.
All graph logic (Leiden, Burt constraint, arc generation) stays in zettlebank.

Default URL: http://127.0.0.1:8001
Override via ZETTLEBANK_URL environment variable.
"""

import os
import httpx

ZETTLEBANK_URL = os.getenv("ZETTLEBANK_URL", "http://127.0.0.1:8001")
_TIMEOUT = 30.0
_ARC_TIMEOUT = 120.0   # arc generation invokes Ollama — allow extra time


def _url(path: str) -> str:
    return ZETTLEBANK_URL.rstrip("/") + path


def is_alive() -> bool:
    """GET /health — returns True if zettlebank is reachable and healthy."""
    try:
        r = httpx.get(_url("/health"), timeout=5.0)
        return r.status_code == 200
    except Exception:
        return False


def analyze_note(note_id: str, content: str) -> dict | None:
    """
    POST /analyze — run the tri-agent structural + semantic pipeline on a note.
    Creates or updates the node in the graph, runs Leiden, computes Burt constraint.
    Returns AnalyzeResponse or None on failure.
    """
    try:
        r = httpx.post(
            _url("/analyze"),
            json={"note_id": note_id, "content": content},
            timeout=_TIMEOUT,
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def ingest_character_graph(payload: dict) -> dict | None:
    """
    POST /graph/ingest-character-graph — ingest characters, relations,
    interactions, and turning points into the vault graph.
    Returns CharacterGraphIngestResponse or None on failure.
    """
    try:
        r = httpx.post(
            _url("/graph/ingest-character-graph"),
            json=payload,
            timeout=_TIMEOUT,
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def sync_note(note_id: str, updates: dict) -> dict | None:
    """
    POST /graph/sync-note — update node attributes on an existing graph node.
    Used to set is_narrative_pivot=True after momentum analysis,
    and narrative_act='ketsu' for agent characters.
    Returns SyncNoteResponse or None on failure.
    """
    try:
        r = httpx.post(
            _url("/graph/sync-note"),
            json={"note_id": note_id, **updates},
            timeout=_TIMEOUT,
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def ingest_from_myfolio(input_id: str, text: str, mode: str = "brainstorm") -> dict | None:
    """
    POST /ingest/from-myfolio — classify raw text and create 1–4 vault notes.
    All character/topic extraction runs inside zettlebank (spaCy + BERTopic + Ollama).
    Returns MyfolioIngestResponse or None on failure.
    """
    try:
        r = httpx.post(
            _url("/ingest/from-myfolio"),
            json={"input_id": input_id, "text": text, "mode": mode},
            timeout=_ARC_TIMEOUT,
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def generate_arc(locked_acts: list | None = None) -> dict | None:
    """
    POST /graph/generate-arc — derive ki/sho/ten/ketsu beats from the
    current vault graph using Leiden communities and Ollama.
    Returns GenerateArcResponse or None on failure.
    """
    try:
        r = httpx.post(
            _url("/graph/generate-arc"),
            json={"locked_acts": locked_acts or []},
            timeout=_ARC_TIMEOUT,
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None
