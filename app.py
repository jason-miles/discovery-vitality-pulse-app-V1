"""Vitality Pulse — FastAPI entrypoint.

Serves the JSON API under /api and the built React SPA (frontend/dist) for all
other routes. Run locally:

    DATABRICKS_PROFILE=elexon uv run uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.routes import router

app = FastAPI(title="Vitality Pulse")
app.include_router(router)

_FRONTEND = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.isdir(_FRONTEND):
    app.mount("/assets", StaticFiles(directory=os.path.join(_FRONTEND, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        # SPA fallback — all non-/api routes return index.html.
        candidate = os.path.join(_FRONTEND, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_FRONTEND, "index.html"))
