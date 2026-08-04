"""Vitality Pulse — FastAPI entrypoint.

Serves the JSON API under /api and the built React SPA (frontend/dist) for all
other routes. Run locally:

    DATABRICKS_PROFILE=elexon uv run uvicorn app:app --reload --port 8000
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.routes import router

app = FastAPI(title="Vitality Pulse")
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
