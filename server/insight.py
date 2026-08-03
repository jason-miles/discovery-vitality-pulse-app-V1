"""Genie insight generation with computed fallback (PRD §4.1).

Phase 2: returns a stub/computed insight so the frontend can build against a
real contract. Phase 6 swaps `_ask_genie` for the real Genie Conversations API
(w.genie.start_conversation_and_wait / create_message_and_wait) keyed on the
per-module GENIE_SPACE_* ids.

Contract the frontend relies on:
    { text, source: "genie" | "computed" | "error", generated_at, cached }
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from .config import GENIE_SPACE, GENIE_TIMEOUT_S, get_workspace_client

# System framing appended to every card prompt (PRD §5.4).
SYSTEM_FRAMING = (
    "Answer in <=4 sentences, plain business English, cite figures in ZAR "
    "(format R 1 234 567), do not speculate beyond the data, and use "
    "'associated with' rather than causal language."
)


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def _extract_text(msg) -> str | None:
    """Pull the natural-language answer out of a GenieMessage. Genie returns
    narrative in attachments[].text.content; fall back to msg.content."""
    try:
        for att in (msg.attachments or []):
            text = getattr(att, "text", None)
            if text and getattr(text, "content", None):
                return text.content.strip()
    except Exception:  # noqa: BLE001
        pass
    content = getattr(msg, "content", None)
    return content.strip() if content else None


def _ask_genie(module: str, prompt: str) -> str | None:
    """Ask the module's Genie space and return the narrative answer, or None on
    any failure/timeout so the caller degrades to the computed fallback."""
    space_id = GENIE_SPACE.get(module)
    if not space_id:
        return None
    w = get_workspace_client()
    msg = w.genie.start_conversation_and_wait(
        space_id,
        f"{prompt}\n\n{SYSTEM_FRAMING}",
        timeout=dt.timedelta(seconds=GENIE_TIMEOUT_S),
    )
    return _extract_text(msg)


def generate_insight(module: str, prompt: str, fallback: str | None) -> dict[str, Any]:
    """Return a structured insight, degrading to the computed fallback on any
    Genie failure/timeout. Never raises to the caller."""
    try:
        text = _ask_genie(module, prompt)
        if text:
            return {"text": text, "source": "genie",
                    "generated_at": _now(), "cached": False}
    except Exception:  # noqa: BLE001 — Genie must never break a card
        pass

    if fallback:
        return {"text": fallback, "source": "computed",
                "generated_at": _now(), "cached": False}
    return {"text": "AI insight unavailable for this view.",
            "source": "error", "generated_at": _now(), "cached": False}
