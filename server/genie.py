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
from .insight import SYSTEM_FRAMING, _extract_text, _ask_genie, _now
from .sql import run_query

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


# ── Executive morning narrative (WOW #2) ──────────────────────────────────
def _zar(v) -> str:
    try:
        n = float(v)
    except (TypeError, ValueError):
        return "—"
    return "R " + f"{n:,.0f}".replace(",", " ")


def exec_narrative() -> dict[str, Any]:
    """Cached wrapper: serve a prior Genie narrative instantly for the TTL
    window; only re-hit Genie once it expires or if the last result was a
    fallback."""
    from .cache import get_or_set

    def produce() -> dict[str, Any] | None:
        r = _exec_narrative_impl()
        # Only cache the real Genie narrative; let fallbacks retry next time.
        return r if r.get("source") == "genie" else None

    cached = get_or_set(["exec_narrative"], produce)
    return cached if cached else _exec_narrative_impl()


def _exec_narrative_impl() -> dict[str, Any]:
    """Generate a 3-sentence executive morning narrative from the live KPI +
    concerns data. Asks Genie to narrate the numbers; falls back to a computed
    sentence built from the actual figures so it is never empty."""
    fixed = {"date_from": "2024-08-01", "date_to": "2026-07-31", "provinces": [], "tiers": []}
    try:
        k = run_query("exec_kpis", fixed)["rows"][0]
        concerns = run_query("exec_concerns", fixed)["rows"]
    except Exception:  # noqa: BLE001
        return {"text": "Live portfolio summary is unavailable right now.",
                "source": "error", "generated_at": _now(), "cached": False}

    def num(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return 0.0

    nv, nvp = num(k.get("net_value_pm")), num(k.get("net_value_pm_prev"))
    nv_delta = ((nv - nvp) / nvp * 100) if nvp else 0.0
    lapse = num(k.get("lapse_rate"))
    engaged = num(k.get("engaged_pct"))
    breaches = int(num(k.get("cap_breaches")))
    top = concerns[0] if concerns else None

    # Facts handed to Genie so it narrates OUR governed numbers (no free-lancing).
    facts = (
        f"Net value per member is {_zar(nv)} per month ({nv_delta:+.1f}% vs prior month). "
        f"Portfolio loss ratio {num(k.get('loss_ratio')):.1f}%. "
        f"Engaged members (ACTIVE or HIGHLY_ACTIVE) {engaged:.1f}%. "
        f"Monthly lapse rate {lapse:.2f}%. "
        f"Partners over contracted cap: {breaches}. "
        + (f"Top concern: {top.get('area')} — {str(top.get('title')).replace('_',' ')} "
           f"({top.get('metric_label')}, {top.get('status')})." if top else "")
    )
    prompt = (
        "You are briefing the Discovery Vitality CEO, CRO and CFO on the shared-value "
        "portfolio this morning. Using ONLY these facts, write exactly 3 sentences: "
        "(1) the headline financial position, (2) the engagement/retention signal, "
        "(3) the single thing to watch today. Warm, executive, concise.\n\nFACTS:\n" + facts
    )

    try:
        text = _ask_genie("bridge", prompt)
        if text:
            return {"text": text, "source": "genie", "generated_at": _now(), "cached": False}
    except Exception:  # noqa: BLE001
        pass

    # Computed fallback — built from the real figures.
    trend = "up" if nv_delta >= 0 else "down"
    watch = (f"the standout is {str(top.get('title')).replace('_',' ')} "
             f"({top.get('area')}, {top.get('metric_label')})" if top else "no red flags across the portfolio")
    fallback = (
        f"Good morning. Net value per member sits at {_zar(nv)} per month, {trend} "
        f"{abs(nv_delta):.1f}% on the prior month, with a portfolio loss ratio of {num(k.get('loss_ratio')):.1f}%. "
        f"{engaged:.0f}% of members are actively engaged and monthly lapse is holding at {lapse:.2f}%. "
        f"Today {watch}" + (f", and {breaches} partner(s) are over contracted cap." if breaches else ".")
    )
    return {"text": fallback, "source": "computed", "generated_at": _now(), "cached": False}


# ── Real RAG over policy documents (WOW #1) ───────────────────────────────
VS_ENDPOINT = "discovery-vitality-vs-endpoint"
VS_INDEX = "elexon_app_for_settlement_acc_catalog.vitality_pulse_gold.policy_documents_index"


def rag_answer(question: str) -> dict[str, Any]:
    """Cached wrapper around the real RAG lookup — repeat questions return
    instantly for the TTL window; only successful answers are cached."""
    from .cache import get_or_set

    def produce() -> dict[str, Any] | None:
        r = _rag_answer_impl(question)
        return r if r.get("source") == "rag" and r.get("citations") else None

    cached = get_or_set(["rag", question.strip().lower()], produce)
    return cached if cached else _rag_answer_impl(question)


def _rag_answer_impl(question: str) -> dict[str, Any]:
    """Answer a policy/contract/clinical question with real citations from the
    Vector Search index. Returns {markdown, citations:[{id,docTitle,docType,
    page,section,passage}], source}. Falls back to error text if VS is down."""
    w = get_workspace_client()
    try:
        res = w.vector_search_indexes.query_index(
            index_name=VS_INDEX,
            columns=["chunk_id", "doc_title", "doc_type", "page_number", "section_heading", "chunk_text"],
            query_text=question,
            num_results=3,
        )
        cols = [c.name for c in res.manifest.columns] if res.manifest else []
        rows = res.result.data_array if res.result and res.result.data_array else []
    except Exception as e:  # noqa: BLE001
        return {"markdown": f"Document search is unavailable right now. ({e})",
                "citations": [], "source": "error"}

    if not rows:
        return {"markdown": "I couldn't find a relevant passage in the policy library for that question.",
                "citations": [], "source": "rag", "lowConfidence": True}

    idx = {name: i for i, name in enumerate(cols)}
    citations = []
    for n, r in enumerate(rows, start=1):
        citations.append({
            "id": n,
            "docTitle": r[idx["doc_title"]],
            "docType": r[idx["doc_type"]],
            "page": int(r[idx["page_number"]]) if r[idx["page_number"]] is not None else 0,
            "section": r[idx["section_heading"]],
            "passage": r[idx["chunk_text"]],
        })

    # Ground a concise answer on the retrieved passages via the Bridge Genie space.
    context = "\n\n".join(f"[{c['id']}] ({c['docTitle']}, p.{c['page']}, {c['section']}): {c['passage']}"
                          for c in citations)
    prompt = (
        "Answer the user's policy question in 2-4 sentences using ONLY the numbered "
        "sources below. Cite sources inline with [n] markers matching the source numbers. "
        "Do not invent facts beyond the sources.\n\n"
        f"QUESTION: {question}\n\nSOURCES:\n{context}"
    )
    try:
        text = _ask_genie("bridge", prompt)
    except Exception:  # noqa: BLE001
        text = None
    if not text:
        # Deterministic fallback: quote the top passage with its citation.
        top = citations[0]
        text = f"{top['passage']} [1]"
    return {"markdown": text, "citations": citations, "source": "rag"}


# ── Real workflow execution via Databricks Jobs (WOW #1) ──────────────────
PARTNER_REPORT_JOB_ID = 409748057125494


def run_partner_report(partner: str, period: str) -> dict[str, Any]:
    """Trigger the real partner-report Databricks Job and return the run id +
    URL. The UI polls /api/workflow/run-status for progress."""
    w = get_workspace_client()
    try:
        run = w.jobs.run_now(
            job_id=PARTNER_REPORT_JOB_ID,
            notebook_params={"partner": partner or "Planet Fitness", "period": period or "Q3 2026"},
        )
        host = workspace_host()
        return {"run_id": run.run_id, "job_id": PARTNER_REPORT_JOB_ID,
                "run_url": f"{host}/jobs/{PARTNER_REPORT_JOB_ID}/runs/{run.run_id}" if host else None,
                "source": "job"}
    except Exception as e:  # noqa: BLE001
        return {"run_id": None, "error": str(e), "source": "error"}


def run_status(run_id: int) -> dict[str, Any]:
    """Poll a job run's lifecycle/result state for the workflow progress card."""
    w = get_workspace_client()
    try:
        r = w.jobs.get_run(run_id=run_id)
        life = r.state.life_cycle_state.value if r.state and r.state.life_cycle_state else "PENDING"
        result = r.state.result_state.value if r.state and r.state.result_state else None
        return {"life_cycle_state": life, "result_state": result,
                "done": life in ("TERMINATED", "SKIPPED", "INTERNAL_ERROR")}
    except Exception as e:  # noqa: BLE001
        return {"life_cycle_state": "ERROR", "result_state": "FAILED", "done": True, "error": str(e)}
