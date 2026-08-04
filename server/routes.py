"""API routes: /api/query/{sqlKey} and /api/insight."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .insight import generate_insight
from .sql import run_query
from . import genie as genie_svc

router = APIRouter(prefix="/api")


class Filters(BaseModel):
    date_from: str
    date_to: str
    provinces: list[str] = Field(default_factory=list)
    tiers: list[str] = Field(default_factory=list)


class QueryRequest(BaseModel):
    filters: Filters


class InsightRequest(BaseModel):
    module: str
    prompt: str
    fallback: str | None = None


class GenieAskRequest(BaseModel):
    module: str
    question: str
    conversation_id: str | None = None


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/warmup")
def warmup() -> dict[str, Any]:
    """Fire a trivial query to resume the serverless warehouse so the first real
    query on a page doesn't pay the cold-start penalty. Called once on app load.
    Never raises — a failed warm-up just means the first query is cold."""
    try:
        from .config import WAREHOUSE_ID, get_workspace_client
        w = get_workspace_client()
        w.statement_execution.execute_statement(
            warehouse_id=WAREHOUSE_ID, statement="SELECT 1", wait_timeout="30s",
        )
        return {"warm": True}
    except Exception:  # noqa: BLE001
        return {"warm": False}


@router.post("/query/{sql_key}")
def query(sql_key: str, req: QueryRequest) -> dict[str, Any]:
    try:
        return run_query(sql_key, req.filters.model_dump())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"unknown query: {sql_key}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insight")
def insight(req: InsightRequest) -> dict[str, Any]:
    if req.module not in {"health", "finance", "bridge"}:
        raise HTTPException(status_code=400, detail="invalid module")
    return generate_insight(req.module, req.prompt, req.fallback)


@router.get("/genie/spaces")
def genie_spaces() -> dict[str, Any]:
    return {"spaces": genie_svc.list_spaces()}


@router.get("/exec-narrative")
def exec_narrative() -> dict[str, Any]:
    """Live 3-sentence executive morning narrative for the GM Brief."""
    return genie_svc.exec_narrative()


class RagRequest(BaseModel):
    question: str


@router.post("/genie/rag")
def genie_rag(req: RagRequest) -> dict[str, Any]:
    """Real RAG answer with citations from the Vector Search policy index."""
    return genie_svc.rag_answer(req.question)


class WorkflowRunRequest(BaseModel):
    partner: str = "Planet Fitness"
    period: str = "Q3 2026"


@router.post("/workflow/partner-report")
def workflow_partner_report(req: WorkflowRunRequest) -> dict[str, Any]:
    """Trigger the real partner-report Databricks Job."""
    return genie_svc.run_partner_report(req.partner, req.period)


@router.get("/workflow/run-status/{run_id}")
def workflow_run_status(run_id: int) -> dict[str, Any]:
    return genie_svc.run_status(run_id)


@router.post("/genie/ask")
def genie_ask(req: GenieAskRequest) -> dict[str, Any]:
    if req.module not in {"health", "finance", "bridge"}:
        raise HTTPException(status_code=400, detail="invalid module")
    return genie_svc.ask(req.module, req.question, req.conversation_id)
