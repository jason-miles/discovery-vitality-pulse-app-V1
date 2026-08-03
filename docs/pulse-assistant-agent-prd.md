# PRD: "Pulse" — Discovery Vitality Conversational Intelligence Agent

**Version:** 1.0 (Build-ready draft)
**Owner:** Solutions Architecture / AI Product
**Status:** Approved for prototype build (mocked backend)
**Target stack:** Databricks (Genie Spaces ×3, Mosaic AI Vector Search, Agent Framework, Jobs) + React/Next.js frontend
**Audience for this document:** AI coding assistants (Cursor, Claude Code) and human reviewers. Every section is written to be directly actionable.

---

## 1. Executive Summary & Business Context

### 1.1 The invented business problem

Discovery Vitality operates the world's largest behaviour-change platform: it ingests millions of daily wellness events — gym check-ins, HealthyFood basket scans at Pick n Pay and Woolworths, Vitality Health Checks, parkrun completions, wearable step goals — and converts them into financial value: Vitality points, status tiers (Blue → Bronze → Silver → Gold → Diamond), Discovery Miles, Active Rewards, and dynamic premium adjustments on linked Discovery Health and Discovery Life products.

The problem is that **the people who run this engine can't interrogate it conversationally.** Today:

- A **Clinical & Wellness Operations specialist** who wants to know *"did the Q2 HealthyFood cashback increase actually move Silver-tier members' engagement?"* files a ticket with the BI team and waits 3–10 business days for a dashboard change.
- A **Partner Strategy lead** negotiating a renewal with a national gym chain has the utilisation data in the lakehouse and the contract terms in a PDF on SharePoint — and no way to query them together. Preparing one partner QBR pack takes ~2 days of manual SQL, Excel, and copy-paste.
- Policy and clinical questions (*"what's the points cap for parkrun events under the 2026 Vitality rules?"*, *"which clause governs partner co-marketing spend?"*) get answered by email chains to subject-matter experts, with no citation trail — a compliance risk under FSCA conduct standards and POPIA.

**Pulse** solves this with a single agentic, chat-first interface backed by the Databricks lakehouse. It routes each request to one of three capabilities: **Genie Spaces** for governed NL-to-SQL analytics over structured rewards data, **Mosaic AI Vector Search RAG** for cited answers over policy/contract/clinical documents, and **agentic workflows** that execute governed multi-step actions (report generation, approval emails) with explicit human confirmation.

Pulse is *not* a dashboard. It replaces the ticket queue, the ad-hoc SQL, and the email-an-expert loop with one conversation.

### 1.2 Target business outcomes and KPIs

| Outcome | KPI | Baseline (invented, realistic) | 6-month target |
|---|---|---|---|
| Reduced time-to-insight for ops questions | Median time from question → data-backed answer | 4.5 days (BI ticket queue) | < 60 seconds (self-serve) |
| BI team deflection | % of ad-hoc analytics tickets resolved via Pulse | 0% | 55% |
| Faster partner review cycles | Analyst hours per partner QBR pack | ~16 hrs | < 1 hr (agent-drafted, human-approved) |
| Compliant policy answers | % of policy/clinical answers with document citations | ~0% (email folklore) | 100% (enforced by RAG UI) |
| Adoption | Weekly active internal users; sessions ≥ 3 turns | — | 200 WAU across Ops & Partnerships |
| Trust & accuracy | Thumbs-up rate on answers; Genie SQL correctness on eval set | — | ≥ 85% / ≥ 90% |
| Governance | 100% of prompts, SQL, retrievals, and workflow executions audit-logged with user identity | — | 100% (day 1, non-negotiable) |

---

## 2. User Personas

### Persona A — Thandi Mokoena, Clinical & Wellness Operations Specialist

- **Team:** Vitality Wellness Operations (Sandton HQ). Reports to Head of Member Engagement.
- **Job-to-be-done:** Monitor whether behavioural incentives (points, Active Rewards, premium discounts) are actually shifting member health behaviour; investigate engagement anomalies; answer clinical-policy questions correctly and defensibly.
- **Technical profile:** Fluent in Excel and the Vitality domain; can read SQL but doesn't write it. Will never open a notebook.
- **How she uses Pulse:**
  - *Analytics (Genie):* "Show gym check-in trends for Gold vs Silver members in Gauteng over the last 6 months, split by partner." Expects a chart + table + plain-English summary, and the ability to ask a follow-up ("now only members over 55") in the same thread.
  - *Documents (RAG):* "What does the 2026 Vitality points schedule say about the annual cap on Health Check points?" Expects the answer with a citation to the exact page of the Vitality Main Rules PDF, and a hover preview of the source passage.
  - *Workflow:* "Compile the monthly engagement anomaly summary and send it to the Wellness Ops channel for review." Reviews the agent's plan, hits Confirm.
- **Success moment:** Answers an exco question during the meeting instead of promising a follow-up deck.

### Persona B — Pieter van der Merwe, Partner Strategy Lead

- **Team:** Vitality Partnerships (manages the fitness & retail partner network: Virgin Active, Planet Fitness, Pick n Pay, Woolworths, Dis-Chem, Clicks).
- **Job-to-be-done:** Track partner utilisation and reward-redemption economics, prepare QBRs and renewal negotiations, keep commercial terms straight across dozens of partner contracts.
- **Technical profile:** Commercially sharp, data-literate, zero patience for tooling friction. Lives in email and PowerPoint.
- **How he uses Pulse:**
  - *Analytics (Genie):* "Rank fitness partners by check-ins per active member this quarter, and show cost-per-engaged-member in rands." Then: "Which partners declined more than 10% QoQ?"
  - *Documents (RAG):* "What are the termination-notice and exclusivity clauses in the Virgin Active master agreement?" Expects clause-level citations; will not act on an uncited answer.
  - *Workflow:* "Draft the Q3 performance report for Planet Fitness from last quarter's check-ins and redemptions, and email it to the partnerships team for review." Reviews the generated PDF inline before confirming the send.
- **Success moment:** Walks into a renewal negotiation with a same-morning data pack instead of week-old analyst output.

---

## 3. Data & AI Architecture

All assets live in Unity Catalog under catalog `vitality_prod`. Genie Spaces are scoped to curated gold views (never raw tables). The frontend never talks to Genie/Vector Search directly; it talks to a single **agent endpoint** (Mosaic AI Agent Framework on Model Serving) that routes and orchestrates. For the prototype, this entire backend is mocked (see §5.4) behind an identical interface.

### 3.1 Structured data — Genie Spaces (×3)

Three Genie Spaces, each scoped to a domain, with curated instructions, example SQL, and trusted-asset joins. The agent's router selects the space; the user can also pin one explicitly via `@` mention (§4.3).

**Genie Space 1 — "Member Engagement & Rewards"** (Thandi's primary space)
**Genie Space 2 — "Partner Network Performance"** (Pieter's primary space)
**Genie Space 3 — "Premium & Financial Impact"** (shared; actuarial-adjacent questions)

Underlying gold tables (schema `vitality_prod.rewards`) — these map health behaviours to financial rewards:

**Table 1: `vitality_prod.rewards.fact_activity_events`** — one row per verified wellness event.

| Column | Type | Notes |
|---|---|---|
| `event_id` | STRING | PK, UUID |
| `member_id` | STRING | FK → dim_members; pseudonymised |
| `event_ts` | TIMESTAMP | Event time (SAST) |
| `activity_type` | STRING | Enum: `gym_checkin`, `parkrun`, `steps_goal`, `healthyfood_purchase`, `health_check`, `vaccination`, `dental_check` |
| `partner_id` | STRING | FK → dim_partners; NULL for device-sourced events |
| `points_earned` | INT | Vitality points awarded for this event |
| `verification_source` | STRING | `partner_pos`, `access_card`, `wearable_api`, `pharmacy_claim` |
| `region` | STRING | `Gauteng`, `Western Cape`, `KwaZulu-Natal`, … |
| `basket_value_zar` | DECIMAL(12,2) | HealthyFood events only, else NULL |

**Table 2: `vitality_prod.rewards.fact_rewards_ledger`** — one row per member per month; the behaviour→money bridge.

| Column | Type | Notes |
|---|---|---|
| `member_id` | STRING | FK → dim_members |
| `period_month` | DATE | First of month |
| `vitality_status` | STRING | `Blue`, `Bronze`, `Silver`, `Gold`, `Diamond` |
| `points_earned_month` | INT | Sum of event points |
| `points_balance_ytd` | INT | Running annual balance |
| `active_rewards_achieved` | INT | Weekly Active Rewards goals hit (0–5) |
| `discovery_miles_earned` | INT | Spendable rewards currency |
| `healthyfood_cashback_zar` | DECIMAL(12,2) | Cashback paid on HealthyFood baskets |
| `premium_discount_pct` | DECIMAL(5,2) | Status-linked discount on integrated Health/Life premium |
| `premium_discount_zar` | DECIMAL(12,2) | Rand value of that discount for the month |
| `payback_bonus_zar` | DECIMAL(12,2) | Life/Insure payback accrual, else 0 |

**Table 3: `vitality_prod.rewards.dim_partners`** — partner network master + monthly economics.

| Column | Type | Notes |
|---|---|---|
| `partner_id` | STRING | PK |
| `partner_name` | STRING | e.g. `Virgin Active`, `Planet Fitness`, `Pick n Pay`, `Woolworths`, `Dis-Chem`, `Clicks`, `parkrun SA` |
| `category` | STRING | `fitness`, `grocery`, `pharmacy`, `events` |
| `contract_tier` | STRING | `strategic`, `national`, `regional` |
| `contract_start` / `contract_end` | DATE | Renewal tracking |
| `revenue_share_pct` | DECIMAL(5,2) | Commercial term (mock) |
| `cost_per_engagement_zar` | DECIMAL(12,2) | What Vitality pays per verified engagement |
| `active_locations` | INT | Sites in network |

**Table 4 (dimension): `vitality_prod.rewards.dim_members`** — `member_id`, `plan_type` (`Health`, `Life`, `Health+Life`, `Vitality-only`), `join_date`, `age_band`, `region`, `is_active`. Included so Genie can do cohort cuts; contains no direct identifiers (POPIA).

**Example question → expected Genie behaviour** (this exact pair ships in mock fixtures, §5.4):
> "What was the average premium reduction for members who hit their gym targets this month?"
→ Space 3 joins `fact_activity_events` (≥ target `gym_checkin` count in month) to `fact_rewards_ledger`, returns `AVG(premium_discount_zar)` grouped by `vitality_status`, plus generated SQL and a bar chart spec.

### 3.2 Unstructured data — Mosaic AI Vector Search (RAG)

- **Storage:** PDFs in UC Volume `/Volumes/vitality_prod/knowledge/docs/`, partitioned by `doc_type`.
- **Document corpus (mock 12–15 docs):**
  - `vitality_rules/` — *Vitality Main Rules 2026* (points schedule, status thresholds, caps), *Active Rewards Terms*.
  - `partner_contracts/` — master service agreements per partner (termination, exclusivity, co-marketing, revenue-share clauses). **Row-level access:** Partnerships group only.
  - `clinical_guidelines/` — Vitality Health Check protocol, screening eligibility, biometric thresholds.
  - `compliance/` — POPIA data-handling SOP, FSCA conduct notes for reward-linked insurance products.
- **Pipeline:** ingestion job parses PDFs → chunks (~800 tokens, 120 overlap, heading-aware) → Delta table `vitality_prod.knowledge.doc_chunks` (`chunk_id`, `doc_id`, `doc_title`, `doc_type`, `page_number`, `section_heading`, `chunk_text`, `effective_date`) → **Delta Sync index** `vitality_prod.knowledge.doc_chunks_index` on a Vector Search endpoint, embeddings via `databricks-gte-large-en`.
- **Retrieval contract:** agent queries top-k=6 with `doc_type` filter when inferable; every generated answer must carry ≥1 citation with `doc_title`, `page_number`, and the verbatim supporting passage. **UI rule: an uncited RAG sentence is a bug.**

### 3.3 Workflow actions (agent tools — exactly 2 in v1)

Both are exposed to the agent as UC-registered tools and executed as Databricks Jobs. Both are **confirm-before-execute**: the agent presents a plan, the user approves in the UI, only then does execution start. All executions are audit-logged with user identity, parameters, and artifact lineage.

**Workflow 1 — `generate_partner_performance_report`**
- **Trigger phrasing:** "Draft a performance report for our gym partners based on last month's check-ins and email it to the partnerships team."
- **Parameters:** `partner_ids[]`, `period` (month/quarter), `recipient_group` (enum: `partnerships_team`, `wellness_ops`, `exco_readonly`), `include_commercials` (bool, requires Partnerships role).
- **Steps (surfaced as a live checklist in UI):** ① Query Genie Space 2 for check-ins, active members, cost-per-engagement, QoQ deltas → ② Retrieve relevant contract KPIs/SLAs from Vector Search → ③ Render branded PDF (template job) to `/Volumes/vitality_prod/artifacts/reports/` → ④ Send email with PDF attached to the approved distribution list.
- **Guardrails:** recipient list is enum-only (no free-text emails); PDF preview shown before step ④; report footer stamps generating user + timestamp.

**Workflow 2 — `submit_reward_adjustment_review`**
- **Trigger phrasing:** "The HealthyFood cashback spike in KZN looks wrong — raise it for actuarial review."
- **Parameters:** `anomaly_scope` (metric + segment + period), `summary_text` (agent-drafted, user-editable), `priority` (`standard`/`urgent`).
- **Steps:** ① Snapshot the supporting Genie query + result set → ② Draft a structured review request (data pack + agent summary) → ③ Create a tracked approval email to the Actuarial Review inbox with a reference ID → ④ Post confirmation with the reference ID back into the chat.
- **Guardrails:** never changes reward values itself — it only *requests* review. Priority `urgent` requires a typed confirmation ("URGENT") in the modal.

**Explicitly out of scope for the agent (hard denials, listed in system prompt):** modifying member data, changing premiums or points, emailing external parties, any action on `dim_members` PII.

### 3.4 Orchestration (target-state, mocked in v1)

Single Model Serving **agent endpoint** (Claude via Databricks FMAPI) with a router: classify intent → `genie` (pick space) | `rag` | `workflow` | `clarify`. Genie via Conversations API (start-conversation → poll → attachments with `statement_response`); RAG via Vector Search query API; workflows via UC function tools → Jobs `run-now`. Frontend auth via Entra ID SSO → on-behalf-of token so UC row/column ACLs apply per user. **The frontend must be written so that swapping the mock client for this real endpoint is a one-file change (§5.4).**

---

## 4. Feature Requirements & UI Layout

### 4.1 Design intent

Chat-first, like Claude/ChatGPT, but visibly enterprise: dense-but-calm, keyboard-friendly, citation-forward, with governed-action affordances (confirmation modals, audit chips) that consumer chat apps don't have. Discovery-inflected visual identity: deep navy surfaces, warm gold accent, generous whitespace, no gimmicks. The **signature element** is the *Insight Card* — every rich answer (chart, citation, workflow) renders as a consistent card with a capability badge, so users always know *which engine* produced what they're reading.

### 4.2 Layout (three zones)

```
┌──────────┬──────────────────────────────────────┬─────────────┐
│ Sidebar  │            Chat Canvas               │ Context     │
│ 280px    │            (flex-1, max-w-3xl        │ Drawer      │
│          │             centered column)         │ 380px       │
│ • New    │  ┌────────────────────────────────┐  │ (collapsed  │
│   chat   │  │  Message thread                │  │  by default)│
│ • Search │  │  - user bubbles (right, navy)  │  │             │
│ • Pinned │  │  - agent responses (left,      │  │ Tabs:       │
│   spaces │  │    full-width Insight Cards)   │  │ • Sources   │
│ • Recent │  └────────────────────────────────┘  │ • Artifacts │
│   convos │  ┌────────────────────────────────┐  │ • Steps     │
│ • User/  │  │ Composer (@mention, attach,    │  │             │
│   org    │  │ send, stop-generation)         │  │             │
└──────────┴──┴────────────────────────────────┴──┴─────────────┘
```

- **Sidebar:** new chat, conversation history (grouped Today/This week/Older, searchable), pinned capability shortcuts ("Member Analytics", "Partner Analytics", "Financial Impact", "Policy Docs"), user menu with role badge. Collapsible to 64px icon rail.
- **Chat canvas:** the only scroll region. User messages are compact right-aligned bubbles; agent output is full-width structured content, not a bubble.
- **Context drawer:** opens automatically when relevant — **Sources** (all citations in this conversation, grouped by document), **Artifacts** (generated PDFs/CSVs with download), **Steps** (live workflow execution log). Manually toggleable; remembers state per conversation.
- **Empty state:** "Good morning, Thandi" + 6 suggested prompts (2 per capability) drawn from the persona's domain, each tagged with its capability badge. This doubles as capability education.

### 4.3 Conversational routing UX

- Default: the agent routes automatically and **shows its routing** as a transient status line ("Querying *Partner Network Performance*…" / "Searching policy documents…" / "Preparing workflow plan…") that collapses into the capability badge on the finished card.
- Power users can force a route with `@` mentions in the composer: `@members`, `@partners`, `@financials` (Genie spaces), `@docs` (RAG), `@actions` (workflows). Typing `@` opens a mention popover.
- Ambiguity → the agent asks one short clarifying question with 2–3 tappable chips, never a wall of options.
- Every agent response ends with 2–3 contextual follow-up chips ("Break down by region", "Show the SQL", "Turn this into a report").

### 4.4 Rich response rendering (the core of the product)

All agent output streams into typed blocks. A response is an ordered array of blocks; the renderer maps block type → component (§5.3). The three capability archetypes:

**A. Genie analytics answer — `GenieResultCard`**
1. Streamed 1–3 sentence natural-language summary *first* (never make the user wait for the chart to learn the answer).
2. **Chart** (Recharts): bar/line/area chosen by the agent's `chart_spec`; animated draw-in ≤ 400ms; tooltips; legend toggles series. ZAR values formatted `R 12 345,67` (`en-ZA` locale).
3. **Data table** (collapsed behind "View data · 42 rows"): sortable, sticky header, virtualised past 100 rows, CSV export.
4. **Provenance footer:** capability badge `⚡ Genie · Partner Network Performance`, "View SQL" (opens syntax-highlighted read-only SQL in a sheet), row count, execution time, freshness timestamp.
   *Why SQL disclosure matters: it's the trust mechanism that lets a data-literate user verify the answer without leaving the chat.*

**B. RAG document answer — `CitationCard`**
1. Streamed answer prose with **inline citation markers** `[1]`, `[2]` rendered as small gold superscript pills.
2. Hovering (or tapping, mobile) a pill opens a popover: document title, page, section heading, and the verbatim supporting passage with the matching phrase highlighted.
3. Below the answer, a compact **source list**: favicon-style doc-type icon, `Vitality Main Rules 2026 · p. 34 · "Annual Points Caps"`, each row clickable → opens the Sources tab in the context drawer scrolled to that citation.
4. Provenance footer: badge `📄 Documents`, retrieval count, corpus freshness date. If retrieval confidence is low, the card renders an explicit banner: *"I couldn't find this in the document library"* — **the agent never answers policy questions from model memory.**

**C. Workflow — three-stage card sequence**
1. **`WorkflowPlanCard`:** the agent restates the task, lists resolved parameters (partner = Planet Fitness, period = Q3 2026, recipients = Partnerships team, 4 people), and the numbered step plan. Primary button **"Confirm & run"**, secondary "Edit parameters" (inline editable fields), tertiary "Cancel".
2. **`WorkflowConfirmationModal`** on confirm: consequence summary in plain language ("This will email a PDF report to 4 people"), recipient list, artifact preview link if available, irreversibility note. For `priority=urgent` paths, typed confirmation. Confirm is the *only* gold solid button on screen.
3. **`WorkflowProgressCard`:** live step checklist (pending / spinner / ✓ / ✗ with error detail and a Retry-step action), then a completion state with artifact chips (📎 `planet-fitness-q3.pdf` → preview sheet + download) and an audit chip (`Run #A-2026-0119 · executed by Pieter vdM · 09:42 SAST`).
   Mid-run, the composer stays usable; a "Running: Partner report (step 2/4)" pill sits above it and deep-links to the Steps tab.

**Cross-capability composition:** a single response may contain multiple blocks (e.g., a Genie chart *and* a contract citation when Pieter asks "is Planet Fitness meeting its contractual check-in SLA?"). The renderer must treat blocks as an ordered list, never assume one block per message.

### 4.5 Interaction & quality requirements

- **Streaming:** token-level text streaming; structured blocks appear with a skeleton → content crossfade. Stop-generation button while streaming.
- **Latency choreography:** < 300ms to first status line; skeleton shimmer for pending charts/tables; never a blank canvas.
- **Feedback:** 👍/👎 + optional comment on every agent response (writes to audit log).
- **Error states:** typed, actionable — Genie timeout ("The query took too long — try narrowing the date range" + Retry), empty retrieval, workflow step failure (retry that step only). Errors are never raw stack traces and never apologise vaguely.
- **Accessibility:** WCAG 2.1 AA; full keyboard nav (⌘K command palette, ⌘Enter send, Esc closes modals); focus rings visible; charts get text summaries for screen readers; `prefers-reduced-motion` disables all non-essential animation.
- **Responsive:** desktop-first; at < 1024px the context drawer becomes a bottom sheet and the sidebar an overlay. Fully usable at 390px.

---

## 5. Technical & Design Specifications for AI Assistants

> This section is written imperatively for Cursor / Claude Code. Follow it exactly. Where you must make a judgment call, prefer the simpler option and leave a `// DECISION:` comment.

### 5.1 Stack & project setup

- **Framework:** Next.js 14+ (App Router) + TypeScript strict mode. All chat UI is client components; keep the root layout and static shells as server components.
- **Styling:** Tailwind CSS + shadcn/ui primitives (Dialog, Sheet, Popover, Tooltip, DropdownMenu, Command). No other component libraries.
- **Charts:** Recharts. **Animation:** Framer Motion, used sparingly (see 5.2). **State:** Zustand for chat/session state; no Redux. **Icons:** lucide-react.
- **No live network calls in v1.** Everything goes through the mock client (5.4). Do not install axios; the client interface uses async generators, not fetch, in mock mode.
- Directory layout:

```
src/
  app/                      # routes: / (chat), /c/[conversationId]
  components/
    chat/                   # ChatInterface, MessageList, UserBubble, Composer, MentionPopover, FollowUpChips
    cards/                  # InsightCard (base), GenieResultCard, DataTable, ChartRenderer,
                            # CitationCard, CitationPopover, WorkflowPlanCard,
                            # WorkflowProgressCard, ErrorCard
    layout/                 # AppShell, Sidebar, ContextDrawer (SourcesTab, ArtifactsTab, StepsTab)
    modals/                 # WorkflowConfirmationModal, SqlViewerSheet, ArtifactPreviewSheet
  lib/
    agent/                  # types.ts (block contracts), client.ts (AgentClient interface)
    mocks/                  # mockAgentClient.ts, router.ts, fixtures/ (genie/, rag/, workflows/)
    store/                  # useChatStore.ts, useDrawerStore.ts
    utils/                  # formatZar.ts, dates.ts (en-ZA / SAST)
```

### 5.2 Design tokens & motion

Define in `tailwind.config.ts` / CSS vars; use tokens only, never ad-hoc hex in components.

- **Palette:** `navy-950 #0A1628` (app bg, dark-leaning enterprise theme), `navy-900 #0F1F38` (sidebar/drawer), `navy-800 #16294A` (card surface), `navy-700 #1E3560` (borders/hover), `gold-500 #C8A951` (primary accent: confirm CTAs, citation pills, active states), `gold-300 #E3CE8F` (accent hover/graph highlight), `mist-100 #EEF2F8` (primary text), `mist-400 #93A3BC` (secondary text), `positive #3FB58A`, `negative #E4685D`. Chart series order: gold-500, `#5B8DEF`, positive, `#B07BD5`, mist-400.
- **Type:** Display/headers **"Fraunces"** (600) for the greeting and card titles only; body **"Inter"** (400/500); data & SQL **"IBM Plex Mono"**. Base 15px/1.6.
- **Shape & depth:** cards `rounded-xl`, 1px navy-700 border, subtle inner top highlight instead of drop shadows; user bubbles `rounded-2xl` navy-700 fill.
- **Motion (Framer Motion):** one system, three moves — messages enter with 8px rise + fade (180ms, ease-out); cards content crossfade from skeleton (220ms); modal scale 0.98→1 (160ms). Chart draw-in via Recharts `isAnimationActive` ≤ 400ms. Nothing else animates. Respect `prefers-reduced-motion` globally (wrap in a MotionConfig).

### 5.3 Component architecture & block contract

Everything renders from this discriminated union — **implement `lib/agent/types.ts` first**, then build components against it:

```ts
type AgentBlock =
  | { type: "text"; markdown: string }                     // streamed
  | { type: "status"; label: string; capability: Capability } // transient
  | { type: "genie_result"; summary: string; chartSpec: ChartSpec | null;
      table: { columns: ColumnDef[]; rows: Row[] }; sql: string;
      spaceName: string; rowCount: number; executionMs: number; asOf: string }
  | { type: "citation_answer"; markdown: string;           // contains [1] markers
      citations: { id: number; docTitle: string; docType: DocType;
                   page: number; section: string; passage: string }[] }
  | { type: "workflow_plan"; workflowId: "generate_partner_performance_report"
        | "submit_reward_adjustment_review";
      title: string; params: WorkflowParam[]; steps: string[];
      consequence: string; recipients?: string[] }
  | { type: "workflow_progress"; runId: string;
      steps: { label: string; state: "pending"|"running"|"done"|"failed"; detail?: string }[];
      artifacts: { name: string; kind: "pdf"|"csv"; url: string }[] }
  | { type: "followups"; suggestions: string[] }
  | { type: "error"; title: string; detail: string; retryable: boolean };

type Capability = "genie" | "rag" | "workflow";
type ChartSpec = { kind: "bar"|"line"|"area"; xKey: string;
                   series: { key: string; label: string }[]; yFormat: "zar"|"number"|"percent" };
```

Component rules:
- `InsightCard` is the base wrapper (badge, body slot, provenance footer, feedback buttons); capability cards compose it. No card re-implements the shell.
- `ChartRenderer` is the *only* component that imports Recharts; it takes `(chartSpec, rows)` and nothing else.
- `WorkflowConfirmationModal` owns the confirm flow: it receives the `workflow_plan` block, emits `onConfirm(paramsFinal)`; the chat store then requests the `workflow_progress` stream. Plan cards become inert (greyed, "Confirmed ✓") after confirmation — no double-execution.
- Streaming: `useChatStream(conversationId)` consumes the client's async generator and appends/patches blocks in the Zustand store; `MessageList` is a pure renderer with `React.memo` per message. Auto-scroll only while the user is at the bottom.
- Citation markers: parse `[n]` in `citation_answer.markdown` during render into `<CitationPill>` components wired to `CitationPopover`; clicking also opens the drawer's Sources tab.

### 5.4 Backend mocking — CRUCIAL

There are no live Databricks APIs in v1. Build a mock layer that is **shaped exactly like the real integration**, so cutover is a one-file swap.

**1. Single seam.** Define the interface; the app depends only on it:

```ts
// lib/agent/client.ts
export interface AgentClient {
  sendMessage(conversationId: string, text: string,
              forcedRoute?: Capability | GenieSpaceId): AsyncGenerator<AgentEvent>;
  confirmWorkflow(runRequestId: string, params: WorkflowParam[]): AsyncGenerator<AgentEvent>;
  cancel(conversationId: string): void;
}
// AgentEvent = { kind: "block_start"|"block_delta"|"block_end"|"done"; block?: AgentBlock; delta?: string }
```

`MockAgentClient` implements it now; a future `DatabricksAgentClient` will implement the same interface against the real agent endpoint. Select via `NEXT_PUBLIC_AGENT_MODE=mock|live`. **No component may import the mock directly.**

**2. Mirror real payload shapes inside the mock.** Fixture files must mimic actual Databricks responses so the live adapter is a thin translation, not a rewrite:
- Genie fixtures (`lib/mocks/fixtures/genie/*.json`): shape them like Genie Conversations API messages — a message with `attachments[]` containing a `text` attachment and a `query` attachment holding `query.query` (the SQL) and a `statement_response` with `manifest.schema.columns[]` and `result.data_array[][]`. The mock router converts this to a `genie_result` block — exactly the mapping the live adapter will do.
- Vector Search fixtures (`fixtures/rag/*.json`): mimic the index query response — `manifest.columns` + `result.data_array` rows of `[chunk_text, doc_title, doc_type, page_number, section_heading, score]`. The mock "generates" the answer by returning pre-written prose whose `[n]` markers map to those rows.
- Workflow fixtures: a run descriptor with `run_id`, per-step `{label, duration_ms, result}`; the mock replays steps on timers (1.2–2.5s each) emitting `workflow_progress` patches. Include one fixture where step 3 fails once and succeeds on retry.

**3. Deterministic keyword router** (`lib/mocks/router.ts`) — no LLM calls in mock mode. Priority order: explicit `@`mention → workflow verbs (`draft`, `send`, `email`, `raise`, `submit` + report/review nouns) → doc-ish terms (`policy`, `rules`, `clause`, `contract`, `guideline`, `cap`, `terms`) → otherwise Genie, with space selection by keyword (`partner|check-in|virgin|planet` → Space 2; `premium|discount|payback|cashback` → Space 3; else Space 1). Unmatched analytics questions fall back to a generic "engagement trend" fixture with a note. Log the routing decision to console in dev.

**4. Simulate texture, not just data.** Latency: 250–600ms before first `status` block; token streaming at 20–40 tokens/s with jitter; Genie "execution" 1.5–3s before the result block. Randomise from a seeded RNG so demos are reproducible (`?seed=` query param). Include at least: 6 Genie fixtures (2 per space, including the §3.1 premium-reduction example with a bar chart by status), 4 RAG fixtures (points cap, parkrun cap, Virgin Active termination clause, POPIA retention — each with 2–4 citations), both workflows end-to-end, one Genie timeout error, one empty-retrieval RAG response.

**5. Mock data realism.** ZAR currency, SAST timestamps, real SA regions, plausible magnitudes (e.g., premium discounts R150–R900/month scaling with status; Planet Fitness ≈ 210k monthly check-ins). Member IDs pseudonymised (`M-8F2K91`); no realistic names/emails in member data — recipient lists use role names ("Partnerships Team (4)").

### 5.5 Build order (do these in sequence)

1. `lib/agent/types.ts` + `client.ts` interface + Zustand stores.
2. AppShell: sidebar, canvas, drawer, empty state with suggested prompts.
3. Composer + streaming text blocks via `MockAgentClient` (text-only path working end-to-end).
4. `GenieResultCard` (chart + table + SQL sheet) with the premium-reduction fixture.
5. `CitationCard` + popovers + Sources tab.
6. Workflow trio (plan → modal → progress) + Artifacts/Steps tabs, including the failing-step fixture.
7. Follow-up chips, feedback, error cards, keyboard shortcuts, reduced-motion pass, responsive pass.

**Definition of done for v1:** both personas' §2 scenarios are demonstrable start-to-finish in mock mode, with no console errors, at 390px and 1440px, keyboard-only navigable.

---

*End of PRD. Feed sections 5.1–5.5 to the coding assistant first as the working spec; sections 1–4 are the product context it should keep in its system context while building.*
