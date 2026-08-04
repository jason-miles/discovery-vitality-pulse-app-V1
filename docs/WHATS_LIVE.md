# Vitality Pulse — What's Live (Handoff)

**Status:** ✅ Live & healthy · smoke-tested end-to-end (27/27 endpoints, 9/9 routes, all Databricks assets green).
_Last verified: 2026-08-04._

---

## Access
| | |
|---|---|
| **Live app** | https://vitality-pulse-7474654808133980.aws.databricksapps.com (workspace SSO) |
| **Workspace** | `fevm-elexon-app-for-settlement-acc` (o=7474654808133980) · CLI profile `elexon` |
| **GitHub** | https://github.com/jason-miles/discovery-vitality-pulse-app-V1 (`main`) |
| **Local dev** | `localhost:8010` (identical build) |

## Pages (9 routes, all 200)
| Route | What it is |
|---|---|
| `/brief` | **GM Morning Brief** — exec KPIs (count-up), 4 analytics charts, live AI narrative, top-concerns w/ RAG bars |
| `/health` | Health & Wellness — engagement (monthly), gym, screenings, sleep/activity |
| `/finance` | Rewards & Premiums — partner liability + cap-utilisation table (KULULA breach), redemption mix, premium book, lapse |
| `/bridge` | The Bridge — value-loop hero, claims-vs-engagement, tenure-controlled, behaviour-precedes-risk, lapse & LTV |
| `/assistant` | **Pulse Assistant** — agentic chat: analytics (real Genie), documents (real RAG), workflows (real Job) |
| `/genie` | Ask the Pulse Assistant hub — 3 curated Genie spaces + deep-links |
| `/architecture` | Data-flow diagram + per-cloud (AWS/Azure/GCP) reference topologies + Well-Architected pillars |
| `/business` | "Why this matters" — business context + key capabilities |
| Sidebar | **Play the story** guided value-loop tour |

## API endpoints (27/27 pass)
- `GET /api/health`, `POST /api/warmup` (resumes warehouse + pre-warms narrative)
- `POST /api/query/{sqlKey}` — 24 governed, parameterised, gold-only queries (bad key → 404)
- `GET /api/exec-narrative` — live Genie exec summary (cached)
- `GET /api/genie/spaces` · `POST /api/genie/ask` (first-turn cached) · `POST /api/genie/rag` (real Vector Search)
- `POST /api/workflow/partner-report` (triggers real Job) · `GET /api/workflow/run-status/{id}` · `GET /api/workflow/report` (CSV download)

## Real Databricks assets
| Asset | Detail |
|---|---|
| **Gold schema** | `elexon_app_for_settlement_acc_catalog.vitality_pulse_gold` (10 objects) + `…_silver` |
| **SQL warehouse** | Serverless `dcb1c3dd8d1570d6` |
| **Genie spaces** | Health `01f18f07dc141af0a148d8148f6c788f` · Rewards `01f18f07e5a515619f6a75c44d1bdaa6` · Bridge `01f18f07efb31f9eb93fc2a7737d773d` |
| **Vector Search** | Endpoint `discovery-vitality-vs-endpoint` · index `…policy_documents_index` (ready, 12 passages) |
| **Job** | `vitality-pulse-partner-report` (id 409748057125494) — writes CSV to Volume |
| **App SP** | `a3c85de8-0856-45e7-ab05-72c8a0c6d404` — SELECT on gold/silver, warehouse CAN_USE, job CAN_MANAGE_RUN |

## Brand & UX
Discovery blue `#003A5D` primary · Vitality Pink `#ED0080` accent · light-grey surface `#E9EDF2` · Sora/Inter · branded hero pattern on all landing pages · animated count-ups · shared utilisation bars · refined chart tooltips.

## Performance
Route-level code splitting · serverless-warehouse warm-up on load · **server-side TTL cache** on all AI paths (narrative/insights/RAG/assistant ≈ **1000× faster on repeat**, e.g. 17s → 0.02s) · narrative pre-warmed on app load.

## Known scope / honest notes
- Data is **synthetic** (50k members, 24 months, seeded) — but pipeline, governance, Genie, Vector Search & Jobs are all **real**.
- The reward-adjustment workflow's downstream email is simulated; the partner-report workflow runs a **real Job**.
- Cache is process-local (single-replica app); clears on redeploy.

## Redeploy
```bash
cd reporting-tool-app/frontend && npm run build && cd ..
databricks sync . /Workspace/Users/jason.miles@databricks.com/vitality-pulse-src \
  --exclude node_modules --exclude .venv --exclude data_out --exclude frontend/node_modules \
  --exclude frontend/src --exclude frontend/public --exclude __pycache__ --exclude .git --full -p elexon
databricks apps deploy vitality-pulse --source-code-path /Workspace/Users/jason.miles@databricks.com/vitality-pulse-src -p elexon
```
_Deploy note: the Apps build proxy is occasionally flaky — retry until `active_deployment.status.state == SUCCEEDED`. Deps are intentionally slim (databricks-sdk pre-installed in the runtime)._

See also: `docs/DEMO_SCRIPT.md` (8-min walkthrough) · `docs/REQUIREMENTS_COVERAGE.md`.
