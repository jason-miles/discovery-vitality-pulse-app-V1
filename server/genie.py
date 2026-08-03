"""Conversational Genie: the /api/genie endpoints powering the Genie hub UI
and the per-module Ask-Genie drawer.

Distinct from insight.py (which generates the short card narratives): this
supports multi-turn Q&A, returns any tabular result alongside the text, and
exposes space metadata so the front end can present a browsable Genie hub.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from .config import GENIE_SPACE, GENIE_TIMEOUT_S, get_workspace_client, workspace_host
from .insight import SYSTEM_FRAMING, _extract_text

# Human-facing descriptions of each space's purpose (shown in the hub).
SPACE_META = {
    "health": {
        "title": "Health & Wellness",
        "purpose": "Ask about member engagement, gym check-ins, activity and "
                   "health-screening uptake by province and engagement tier.",
        "examples": [
            "How did gym check-ins in Gauteng trend over the last 6 months?",
            "Which screening types have the lowest uptake this quarter?",
            "Compare goal-met rate across engagement tiers",
        ],
    },
    "finance": {
        "title": "Rewards & Premiums",
        "purpose": "Ask about partner reward payouts, contracted-cap utilisation, "
                   "the premium book and lapse rates by status tier.",
        "examples": [
            "Which partners are closest to or over their contracted cap?",
            "How has the reward redemption mix shifted over the last 6 months?",
            "Compare lapse rate across vitality status tiers",
        ],
    },
    "bridge": {
        "title": "The Bridge",
        "purpose": "Ask how wellness behaviour links to financial outcomes — "
                   "claims, net value and retention by engagement tier.",
        "examples": [
            "How much lower are monthly claims for HIGHLY_ACTIVE vs DORMANT members?",
            "Which engagement tier has the highest net value per member?",
            "Does the claims gap between tiers persist beyond 24 months tenure?",
        ],
    },
}


def list_spaces() -> list[dict[str, Any]]:
    """Space metadata for the Genie hub, including a deep-link to open the
    space directly in Databricks."""
    host = workspace_host()
    out = []
    for module, meta in SPACE_META.items():
        space_id = GENIE_SPACE.get(module, "")
        out.append({
            "module": module,
            "space_id": space_id,
            "title": meta["title"],
            "purpose": meta["purpose"],
            "examples": meta["examples"],
            "deep_link": f"{host}/genie/rooms/{space_id}" if host and space_id else None,
        })
    return out


def ask(module: str, question: str, conversation_id: str | None = None) -> dict[str, Any]:
    """Ask a question of a module's Genie space. Supports follow-ups via
    conversation_id. Returns text + optional tabular result."""
    space_id = GENIE_SPACE.get(module)
    if not space_id:
        return {"text": "This Genie space is not configured.", "error": True}

    w = get_workspace_client()
    framed = f"{question}\n\n{SYSTEM_FRAMING}"
    try:
        if conversation_id:
            msg = w.genie.create_message_and_wait(
                space_id, conversation_id, framed,
                timeout=dt.timedelta(seconds=GENIE_TIMEOUT_S),
            )
        else:
            msg = w.genie.start_conversation_and_wait(
                space_id, framed,
                timeout=dt.timedelta(seconds=GENIE_TIMEOUT_S),
            )
    except Exception as e:  # noqa: BLE001
        return {"text": f"Genie couldn't answer that in time. ({e})", "error": True}

    text = _extract_text(msg) or "Genie returned no answer for that question."
    result = _extract_table(w, msg)
    return {
        "text": text,
        "conversation_id": getattr(msg, "conversation_id", None),
        "table": result,
        "error": False,
    }


def _extract_table(w, msg) -> dict[str, Any] | None:
    """If the Genie answer carries a query result, return {columns, rows}."""
    try:
        for att in (msg.attachments or []):
            query = getattr(att, "query", None)
            if not query:
                continue
            res = w.genie.get_message_query_result(
                msg.space_id, msg.conversation_id, msg.message_id
            )
            sr = res.statement_response
            if not sr or not sr.result or not sr.manifest:
                return None
            cols = [c.name for c in sr.manifest.schema.columns]
            rows = sr.result.data_array or []
            return {"columns": cols, "rows": rows[:50]}
    except Exception:  # noqa: BLE001
        return None
    return None
