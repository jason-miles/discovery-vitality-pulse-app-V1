"""Vitality Pulse — FastAPI entrypoint.

Serves the JSON API under /api and the built React SPA (frontend/dist) for all
other routes. Run locally:

    DATABRICKS_PROFILE=elexon uv run uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from server.routes import router

# ── Structured logging (surfaces in the Databricks App /logz stream) ──────
logging.basicConfig(
    level=os.environ.get("VP_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("vitality_pulse")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Server-side warm-up: resume the warehouse + pre-warm the exec narrative
    # on boot, so the app is fast even before any browser hits it. Runs in a
    # thread so a slow/failed warm-up never blocks startup.
    import threading

    def _warm() -> None:
        try:
            from server.routes import warmup
            warmup()
            log.info("startup warm-up complete")
        except Exception as e:  # noqa: BLE001
            log.warning("startup warm-up skipped: %s", e)

    threading.Thread(target=_warm, daemon=True).start()
    log.info("Vitality Pulse started")
    yield
    log.info("Vitality Pulse shutting down")


app = FastAPI(title="Vitality Pulse", lifespan=lifespan)


@app.middleware("http")
async def observe_and_secure(request: Request, call_next):
    """Time every request, log it, tag it with a request id, and add baseline
    security headers. API errors are logged with context."""
    rid = uuid.uuid4().hex[:8]
    t0 = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:  # noqa: BLE001
        log.exception("[%s] unhandled error on %s %s", rid, request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal error", "request_id": rid})
    dt_ms = (time.perf_counter() - t0) * 1000
    if request.url.path.startswith("/api"):
        log.info("[%s] %s %s -> %s (%.0fms)", rid, request.method, request.url.path, response.status_code, dt_ms)
    # Baseline security headers for an enterprise deployment.
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Request-ID"] = rid
    return response


app.include_router(router)

_FRONTEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "dist"))

if os.path.isdir(_FRONTEND):
    app.mount("/assets", StaticFiles(directory=os.path.join(_FRONTEND, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        # Unknown /api paths are 404s, not the SPA shell (avoids masking API
        # errors as a 200 HTML page).
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        # Serve a real static file if it exists AND resolves inside dist
        # (guards against path traversal); otherwise fall back to index.html.
        candidate = os.path.abspath(os.path.join(_FRONTEND, full_path))
        if full_path and candidate.startswith(_FRONTEND + os.sep) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_FRONTEND, "index.html"))
