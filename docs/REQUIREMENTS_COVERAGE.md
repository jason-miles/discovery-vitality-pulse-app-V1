# Discovery Vitality — Requirements Coverage

This app merges two Discovery Vitality PRDs into one governed Databricks App:

1. **Vitality Pulse — Shared-Value Analytics Portal** (`discovery-vitality-pulse-reporting-app.md`) — the dashboard product.
2. **Pulse — Conversational Intelligence Agent** (originally `agentic-chatbot-app`) — the chat-first agent, merged in as the **Pulse Assistant** page.

Legend: ✅ done · 🟡 partial / demo-mocked · ⬜ not built

---

## PRD 1 — Shared-Value Analytics Portal

### Modules & features
| Requirement | Status | Where |
|---|---|---|
| Health & Wellness module (engagement, gym, screenings, sleep/activity) | ✅ | `/health` |
| Rewards & Premiums module (partner liability + caps, redemption mix, premium book, lapse) | ✅ | `/finance` |
| The Bridge correlation engine (value loop, claims-vs-engagement, tenure-controlled, behaviour-precedes-risk, lapse & LTV) | ✅ | `/bridge` |
| InsightCard = chart + Genie narrative beneath, loads independently | ✅ | `components/cards/InsightCard.tsx` |
| Genie insight with computed fallback + refresh + timestamp | ✅ | `GenieInsightPanel.tsx`, `server/insight.py` |
| Global filter store (date range, province, tier) | ✅ | `state/filterStore.ts` |
| Ask Genie drawer per module | ✅ | `GenieDrawer.tsx` |
| Bridge "Copy executive summary" | ✅ | `BridgePage.tsx` |

### Data (medallion)
| Requirement | Status | Notes |
|---|---|---|
| 50k members, 24 months, seed=42 | ✅ | `scripts/generate_mock_data.py` |
| Bronze/Silver/Gold in Unity Catalog | ✅ | co-located as `vitality_pulse_{silver,gold}` in `elexon_app_for_settlement_acc_catalog` (user lacks CREATE CATALOG — workspace convention) |
| App queries gold only | ✅ | `server/sql.py` targets `{{GOLD}}` |
| Correlation contract embedded + asserted | ✅ | HIGHLY_ACTIVE ~36% lower claims; net value peaks at ACTIVE; KULULA_AIR cap breach; verified by assertions |

### Tech & design
| Requirement | Status |
|---|---|
| FastAPI + databricks-sdk, WorkspaceClient() no-arg in-app | ✅ |
| Parameterised, injection-safe SQL registry (gold only) | ✅ |
| React 18 + Vite + TS + Tailwind + Recharts + TanStack Query + Zustand | ✅ |
| Design system: deep-teal/amber, Sora/Inter, ZAR `R 1 234 567`, dd MMM yyyy | ✅ |
| Skeletons, empty/error states, prefers-reduced-motion | ✅ |
| Route-level code splitting (fast load) | ✅ (added in optimization pass) |
| app.yaml with warehouse + GENIE_SPACE_* env | ✅ |

---

## PRD 2 — Conversational Intelligence Agent (Pulse Assistant)

| Requirement | Status | Notes |
|---|---|---|
| Chat-first agentic interface | ✅ | `/assistant` (Pulse Assistant page) |
| Genie NL→SQL capability (chart + table + SQL + summary) | ✅ | wired to **real** `/api/genie/ask`; 3 spaces mapped to health/finance/bridge |
| RAG cited answers over policy/contract/clinical docs | 🟡 | rendered with numbered citations + hover source; **mock corpus** (matches original prototype status — real Vector Search is a future wire-up) |
| Agentic workflows with human confirmation (2 in v1: partner report, reward-adjustment review) | 🟡 | plan → confirm → progress → artifact, all as demo; confirmation modal enforced |
| Block-based rich rendering (discriminated union) | ✅ | `assistant/types.ts` AgentBlock |
| Multi-turn conversation with follow-ups | ✅ | conversation store + follow-up chips |
| Thumbs feedback | ✅ | FeedbackButtons |
| Capability routing (auto + explicit) | ✅ | router maps intent → capability/space |

### Cross-cutting outcomes (both PRDs)
| Outcome | Status |
|---|---|
| Time-to-insight < 60s self-serve (vs BI ticket queue) | ✅ dashboards + Genie |
| 100% policy answers carry citations | 🟡 enforced in RAG UI; corpus is demo |
| Governance: gold-only SP grants, no PII in UI, curated Genie spaces | ✅ |
| Executive self-serve (CEO/CRO/CFO morning view) | ✅ **GM Morning Brief** `/brief` (beyond original PRDs — added for C-suite) |
| Architecture transparency for reviewers | ✅ **Architecture** page + per-cloud reference topologies |
| Business context for stakeholders | ✅ **Business Overview** page |

---

## Gaps / future work (honest list)
- **RAG corpus is mocked.** Real answers need a Mosaic AI Vector Search index over the Vitality rules / partner contracts / clinical guidelines documents. The UI contract is ready; only the retrieval backend is stubbed.
- **Workflows are demo-only.** The plan→confirm→execute UX is complete, but the actual report-generation Job and approval-email tool are not wired to real Databricks Jobs / email.
- **Genie spaces cover the 3 reporting domains.** The chatbot PRD's original space names (members/partners/financials) are mapped onto our health/finance/bridge spaces rather than created separately.
- **Deploy blocked on infra:** the Databricks Apps build proxy (`pypi-proxy.dev.databricks.com`) has been timing out; app + grants + code are all staged.
