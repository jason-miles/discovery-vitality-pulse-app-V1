# Vitality Pulse — Shared-Value Analytics Portal

A three-module Databricks App for Discovery Vitality SA (demo scenario) that
quantifies the shared-value loop: member health behaviour → claims reduction →
funded rewards. Every chart is paired with a **Genie Insight** — an AI-written
narrative grounded in the same governed gold tables.

## Modules
- **Health & Wellness** — engagement, gym check-ins, screenings by province/tier
- **Rewards & Premiums** — partner payout liability (+ cap breaches), premium book, lapse
- **The Bridge** — the correlation engine: value loop, claims vs engagement, tenure-controlled view, behaviour-precedes-risk cohort, lapse & LTV
- **Ask Genie** — a hub linking all three curated Genie spaces

## Stack
- **Backend:** FastAPI (Python 3.11), `databricks-sdk` (`WorkspaceClient()` no-arg auth in-app).
  - `/api/query/{sqlKey}` — parameterised, injection-safe SQL over gold tables (serverless warehouse)
  - `/api/insight` — Genie card narratives with computed fallback
  - `/api/genie/spaces`, `/api/genie/ask` — the Genie hub + conversational drawer
- **Frontend:** React 18 + TS + Vite + Tailwind + Recharts + TanStack Query + Zustand
- **Data:** medallion in `elexon_app_for_settlement_acc_catalog.vitality_pulse_{silver,gold}` (app reads gold only)

## Data model
`scripts/generate_mock_data.py` (seed=42, 50k members, 24 months) generates gold
tables with the correlation contract embedded (HIGHLY_ACTIVE ~36% lower claims,
net value peaks at ACTIVE, KULULA_AIR cap breach) and self-verifying assertions.
`scripts/load_to_databricks.py` loads the parquet into Delta via a UC volume.

## Local development
```bash
# 1. Generate + load data (once)
python3 scripts/generate_mock_data.py
python3 scripts/load_to_databricks.py --profile elexon --warehouse dcb1c3dd8d1570d6

# 2. Build the frontend
cd frontend && npm install && npm run build && cd ..

# 3. Run the app (serves API + built SPA)
DATABRICKS_PROFILE=elexon uv run --with fastapi --with "uvicorn[standard]" \
  --with databricks-sdk --with pydantic uvicorn app:app --port 8000
```

For frontend hot-reload, run `npm run dev` (port 5173, proxies /api to :8000).

## Deploy (Databricks Apps)
```bash
databricks sync . /Workspace/Users/<you>/vitality-pulse \
  --exclude node_modules --exclude .venv --exclude data_out \
  --exclude frontend/src --exclude frontend/node_modules -p elexon
databricks apps deploy vitality-pulse \
  --source-code-path /Workspace/Users/<you>/vitality-pulse -p elexon
```
Then in the app UI add the SQL warehouse as a resource ("Can use") and grant the
app service principal `SELECT` on `…vitality_pulse_gold` and `CAN RUN` on the
three Genie spaces. Config (warehouse id, Genie space ids) lives in `app.yaml`.

*All figures, personas and datasets are fictional, engineered for demonstration.*
