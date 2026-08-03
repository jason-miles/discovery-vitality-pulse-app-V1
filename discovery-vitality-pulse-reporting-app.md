# PRD: Vitality Pulse — Shared-Value Analytics Portal

**Product:** Internal Databricks App for Discovery Vitality South Africa
**Version:** 1.0 (Developer-Ready)
**Audience for this document:** AI coding assistants (Cursor / Claude) and reviewing engineers
**Deployment target:** Databricks Apps (single workspace, Unity Catalog governed)

---

## 1. Executive Summary & Business Context

### 1.1 The business problem (invented, but realistic)

Discovery Vitality operates a shared-value insurance model: members who behave healthier generate fewer claims, and a portion of that actuarial surplus is returned to them as rewards (partner cashbacks, premium discounts, Active Rewards vouchers, gym subsidies). The model only works if the value loop is measurable — behaviour → risk reduction → claims savings → funded rewards.

Today (in our scenario), three internal teams each see one arc of that loop and none see the circle:

- **The Wellness team** sees engagement telemetry — gym check-ins, device-synced activity, screening uptake — in operational dashboards, but cannot express engagement in Rand terms. When they ask for budget to expand a screening campaign, they argue with participation percentages, not claims impact.
- **The Actuarial team** sees claims, premiums, and policy risk bands, but receives behavioural data as quarterly batch extracts that are 6–10 weeks stale by the time they land in pricing models. Risk-band recalibration lags real behaviour change by a full quarter.
- **The Partner/Commercial team** manages cashback agreements with retail partners (grocery, fitness, airline) and reconciles payout liability manually. They cannot answer the question every partner renewal hinges on: *"Does your cashback actually change member behaviour, or are we subsidising behaviour that would have happened anyway?"*

The result is a familiar enterprise pathology: **three teams, three data silos, one shared P&L, zero shared evidence.** Quarterly "value of shared-value" reporting is a 3-week manual exercise assembled in slides.

### 1.2 The solution

**Vitality Pulse** is a three-module Databricks App on the lakehouse that gives each team its operational view and — critically — a third **Bridge** module that quantifies the correlation between wellness behaviour and financial outcomes. Every visual in the app is paired with a **Genie-generated narrative insight**: an AI-written text block, grounded in the same governed data as the chart beside it, that explains what the user is looking at and why it matters.

### 1.3 Target outcomes and KPIs

| Module | Business outcome | Success KPIs (app-level) |
|---|---|---|
| **Health & Wellness** | Wellness team self-serves engagement analysis; campaign decisions made on weekly (not quarterly) data | Weekly active engagement rate visibility; screening-uptake trend by region; time-to-answer for engagement questions < 1 min via Genie |
| **Financial & Insurance Rewards** | Commercial team tracks reward liability and partner ROI in near-real-time; finance closes reward accruals from governed gold tables | Cashback payout liability accuracy vs. GL within 1%; partner redemption trends visible T+1; premium-discount cost tracked per status tier |
| **The Bridge** | Actuarial and executive stakeholders see quantified behaviour→claims linkage; renews the shared-value narrative with evidence | Claims-cost delta per engagement tier surfaced monthly; correlation views used in quarterly pricing review; "value loop" report generated from app, not slides |

North-star metric for the app itself: **≥ 60% of the three teams' recurring reporting questions answered inside Vitality Pulse (dashboard or Genie) instead of ad-hoc analyst requests, within one quarter of launch.**

---

## 2. User Personas

### Persona 1 — Naledi Mokoena, Wellness Program Manager (Health module)
Owns member engagement programmes (Active Rewards challenges, screening drives, gym partnerships). Non-technical; fluent in campaign metrics.
**Goals:** Track weekly engagement by segment and region; spot drop-off after challenge cycles end; prove screening campaigns move Vitality-status distribution; ask ad-hoc questions ("How did gym check-ins in Gauteng trend after the winter step challenge?") without filing an analyst ticket.

### Persona 2 — Pieter van Rensburg, Actuarial Lead (Bridge module, secondary Finance)
Prices Vitality-integrated life and health products; owns risk-band models.
**Goals:** See claims frequency and severity by engagement tier with a lag of days, not a quarter; validate whether status upgrades (Bronze→Silver→Gold→Diamond) precede claims reduction or merely correlate with healthy selection; export cohort-level aggregates for pricing models; interrogate anomalies conversationally ("Show loss ratio by status tier for members active > 24 months, excluding new joiners").

### Persona 3 — Thandi Dlamini, Strategic Partner Director (Finance module)
Owns commercial relationships with reward partners (grocery cashback, flight discounts, device subsidies).
**Goals:** Monitor monthly payout liability per partner against contracted caps; compare redemption rates across partners and tiers; walk into a partner renewal with evidence of behaviour uplift attributable to that partner's benefit; track premium-discount cost as a share of collected premium.

---

## 3. Mock Data Architecture (Medallion)

All tables live in Unity Catalog under catalog **`vitality_pulse`**, schemas `bronze`, `silver`, `gold`. The app queries **gold only**. Bronze/silver are specified so the mock-data generation scripts produce a realistic lineage, but the coding assistant may generate gold tables directly from Python/Pandas if bronze/silver simulation is out of scope for v1.

**Mock data scale targets:** 50,000 members, 24 months of history (2024-08 → 2026-07), ~15M telemetry rows, 8 partners, ~600k reward transactions, ~90k claims. Seed all random generation (`seed=42`) for reproducibility.

### 3.1 Bronze (raw landing — for lineage realism)

**`bronze.raw_device_telemetry`** — device sync feed (Garmin/Apple/Fitbit style)
| Column | Type | Notes |
|---|---|---|
| event_id | STRING | UUID |
| member_id | STRING | FK-like, `MBR-` + 8 digits |
| device_type | STRING | `APPLE_WATCH`, `GARMIN`, `FITBIT`, `SAMSUNG`, `PHONE_ONLY` |
| event_date | DATE | |
| steps | INT | 0–45,000; log-normal around persona baseline |
| active_minutes | INT | 0–240 |
| avg_heart_rate | INT | nullable; 48–110 |
| sleep_hours | DECIMAL(4,2) | nullable; 3.0–11.0 |
| ingested_at | TIMESTAMP | |

**`bronze.raw_gym_checkins`** — partner gym turnstile feed
| Column | Type |
|---|---|
| checkin_id | STRING |
| member_id | STRING |
| gym_partner_code | STRING (`VIRGIN_ACTIVE`, `PLANET_FITNESS`, `ZONE_FITNESS`) |
| branch_city | STRING |
| checkin_ts | TIMESTAMP |

**`bronze.raw_reward_events`** — partner POS/redemption feed
| Column | Type |
|---|---|
| txn_id | STRING |
| member_id | STRING |
| partner_code | STRING |
| txn_ts | TIMESTAMP |
| gross_spend_zar | DECIMAL(12,2) |
| cashback_zar | DECIMAL(12,2) |
| reward_type | STRING (`CASHBACK`, `VOUCHER`, `MILES`, `DEVICE_SUBSIDY`) |

### 3.2 Silver (conformed)

**`silver.member_telemetry_logs`** — daily grain, deduplicated, one row per member per day
| Column | Type | Notes |
|---|---|---|
| member_id | STRING | |
| activity_date | DATE | |
| total_steps | INT | |
| active_minutes | INT | |
| sleep_hours | DECIMAL(4,2) | nullable |
| avg_heart_rate | INT | nullable |
| met_daily_goal | BOOLEAN | steps ≥ 10,000 OR active_minutes ≥ 30 |
| data_source | STRING | dominant device that day |

**`silver.gym_checkins`**
| Column | Type |
|---|---|
| checkin_id | STRING |
| member_id | STRING |
| gym_partner_code | STRING |
| branch_city | STRING |
| province | STRING (`GAUTENG`, `WESTERN_CAPE`, `KWAZULU_NATAL`, `EASTERN_CAPE`, `FREE_STATE`, `OTHER`) |
| checkin_date | DATE |
| checkin_hour | INT (0–23) |

**`silver.health_screenings`**
| Column | Type | Notes |
|---|---|---|
| screening_id | STRING | |
| member_id | STRING | |
| screening_date | DATE | |
| screening_type | STRING | `VITALITY_HEALTH_CHECK`, `HBA1C`, `CHOLESTEROL`, `BLOOD_PRESSURE`, `BMI`, `HIV`, `MAMMOGRAM`, `PROSTATE` |
| result_band | STRING | `IN_RANGE`, `BORDERLINE`, `OUT_OF_RANGE` |
| points_awarded | INT | |

**`silver.rewards_and_premiums`** — one row per reward or premium event
| Column | Type | Notes |
|---|---|---|
| event_id | STRING | |
| member_id | STRING | |
| event_date | DATE | |
| event_category | STRING | `PARTNER_CASHBACK`, `ACTIVE_REWARD_REDEMPTION`, `PREMIUM_DISCOUNT`, `DEVICE_SUBSIDY` |
| partner_code | STRING | nullable for premium events |
| amount_zar | DECIMAL(12,2) | cost to Discovery (positive) |
| member_status_at_event | STRING | `BLUE`, `BRONZE`, `SILVER`, `GOLD`, `DIAMOND` |

**`silver.policy_master`** — SCD-lite, current view
| Column | Type | Notes |
|---|---|---|
| policy_id | STRING | |
| member_id | STRING | |
| product_line | STRING | `LIFE`, `HEALTH`, `CAR`, `HOME` |
| policy_status | STRING | `ACTIVE`, `LAPSED`, `CANCELLED`, `SUSPENDED` |
| inception_date | DATE | |
| monthly_premium_zar | DECIMAL(12,2) | |
| current_discount_pct | DECIMAL(5,2) | 0–25, driven by status |
| risk_band | STRING | `A_LOW`, `B_MODERATE`, `C_ELEVATED`, `D_HIGH` |

**`silver.claims`**
| Column | Type | Notes |
|---|---|---|
| claim_id | STRING | |
| policy_id | STRING | |
| member_id | STRING | |
| claim_date | DATE | |
| claim_type | STRING | `HOSPITAL`, `CHRONIC_MEDICATION`, `GP_VISIT`, `MOTOR`, `LIFE_EVENT` |
| claim_amount_zar | DECIMAL(14,2) | |
| claim_status | STRING | `PAID`, `PENDING`, `REJECTED` |

**`silver.dim_members`**
| Column | Type | Notes |
|---|---|---|
| member_id | STRING | PK |
| join_date | DATE | |
| birth_year | INT | 1955–2005 |
| gender | STRING | `F`, `M`, `X` |
| province | STRING | same enum as gym_checkins |
| current_vitality_status | STRING | `BLUE`, `BRONZE`, `SILVER`, `GOLD`, `DIAMOND` |
| engagement_tier | STRING | `DORMANT`, `LIGHT`, `ACTIVE`, `HIGHLY_ACTIVE` (derived: rolling-90-day goal-met rate <10%, 10–40%, 40–70%, >70%) |
| employer_segment | STRING | `CORPORATE`, `SME`, `INDIVIDUAL` |

**`silver.dim_partners`**
| Column | Type |
|---|---|
| partner_code | STRING (PK) — `PICKNPAY`, `WOOLWORTHS`, `DISCHEM`, `CLICKS`, `KULULA_AIR`, `VIRGIN_ACTIVE`, `PLANET_FITNESS`, `GARMIN_STORE` |
| partner_name | STRING |
| partner_category | STRING (`GROCERY`, `PHARMACY`, `TRAVEL`, `FITNESS`, `DEVICES`) |
| contract_monthly_cap_zar | DECIMAL(14,2) |
| discovery_cofund_pct | DECIMAL(5,2) |

### 3.3 Gold (app-facing aggregates — the app and Genie query ONLY these)

**`gold.health_engagement_daily`** — grain: province × engagement_tier × date
Columns: `activity_date DATE`, `province STRING`, `engagement_tier STRING`, `active_members INT`, `avg_steps INT`, `avg_active_minutes INT`, `avg_sleep_hours DECIMAL(4,2)`, `goal_met_pct DECIMAL(5,2)`, `gym_checkins INT`, `screenings_completed INT`

**`gold.screening_uptake_monthly`** — grain: month × screening_type × province
Columns: `month_start DATE`, `screening_type STRING`, `province STRING`, `eligible_members INT`, `completed INT`, `uptake_pct DECIMAL(5,2)`, `out_of_range_pct DECIMAL(5,2)`

**`gold.rewards_liability_monthly`** — grain: month × partner × reward_type
Columns: `month_start DATE`, `partner_code STRING`, `partner_category STRING`, `event_category STRING`, `txn_count INT`, `total_payout_zar DECIMAL(14,2)`, `avg_payout_zar DECIMAL(12,2)`, `contract_cap_zar DECIMAL(14,2)`, `cap_utilisation_pct DECIMAL(5,2)`, `unique_members INT`

**`gold.premium_book_monthly`** — grain: month × product_line × status tier
Columns: `month_start DATE`, `product_line STRING`, `vitality_status STRING`, `active_policies INT`, `gross_premium_zar DECIMAL(16,2)`, `discount_cost_zar DECIMAL(14,2)`, `effective_discount_pct DECIMAL(5,2)`, `lapse_count INT`, `lapse_rate_pct DECIMAL(5,2)`

**`gold.bridge_member_month`** — **the Bridge fact table**, grain: member × month. This is the table that makes correlation analysis trivial for both charts and Genie.
| Column | Type |
|---|---|
| member_id | STRING |
| month_start | DATE |
| engagement_tier | STRING |
| vitality_status | STRING |
| goal_met_pct | DECIMAL(5,2) |
| gym_visits | INT |
| screenings_ytd | INT |
| rewards_earned_zar | DECIMAL(12,2) |
| premium_paid_zar | DECIMAL(12,2) |
| discount_received_zar | DECIMAL(12,2) |
| claims_count | INT |
| claims_paid_zar | DECIMAL(14,2) |
| risk_band | STRING |
| tenure_months | INT |

**`gold.bridge_tier_summary_monthly`** — pre-aggregated for headline charts, grain: month × engagement_tier
Columns: `month_start DATE`, `engagement_tier STRING`, `members INT`, `avg_claims_zar_pm DECIMAL(12,2)`, `claims_frequency_per_1000 DECIMAL(8,2)`, `avg_rewards_cost_zar_pm DECIMAL(12,2)`, `avg_premium_zar_pm DECIMAL(12,2)`, `loss_ratio_pct DECIMAL(5,2)`, `net_value_per_member_zar DECIMAL(12,2)` (premium − claims − rewards − discounts), `lapse_rate_pct DECIMAL(5,2)`

**Mock-data correlation contract (critical — build this into the generator):** the story only works if the synthetic data contains the signal. The generator MUST embed these effects, with noise: (1) `HIGHLY_ACTIVE` members have ~35–45% lower monthly claims cost and ~50% lower lapse rate than `DORMANT`; (2) `ACTIVE`/`HIGHLY_ACTIVE` earn 3–5× the rewards of `DORMANT`; (3) `net_value_per_member_zar` should be positive and *highest* for `ACTIVE` (not `HIGHLY_ACTIVE` — reward costs eat some surplus at the top tier: this nuance gives the Bridge module a genuinely interesting finding); (4) screening `OUT_OF_RANGE` members show elevated chronic-medication claims 3–9 months later; (5) a deliberate anomaly: one partner (`KULULA_AIR`) breaches its monthly cap in 2 of the last 6 months, so the Finance module has something to flag.

---

## 4. Feature Requirements & UI Layout

### 4.0 Global shell

- Persistent **left sidebar** (240px, collapsible to 64px icon rail): app mark "Vitality Pulse", three nav items — **Health & Wellness**, **Rewards & Premiums**, **The Bridge** — plus a footer item "Data freshness" showing last gold-table refresh timestamp.
- **Top bar** per module: module title, global filter set (date range picker defaulting to trailing 12 months; province multi-select; engagement-tier multi-select where relevant), and a **"Ask Genie"** button that opens a right-side conversational drawer scoped to that module's Genie space.
- Filters are held in a global store; every chart, stat card, and Genie insight request receives the current filter state.

### 4.1 The InsightCard contract (applies to all three modules)

Every primary visualization ships as an **InsightCard**: a single card containing (a) a title + subtitle, (b) the chart or stat block, and (c) a **Genie Insight panel** directly beneath the chart — a bordered text region with a small "✦ Genie" label, 2–4 sentences of AI-generated narrative, a "Refresh insight" icon button, and a timestamp.

Coupling mechanism (this is the core product idea — implement exactly):

1. Chart data is fetched from gold tables via the app backend (SQL warehouse). Chart renders immediately.
2. In parallel, the backend sends the **same filter context plus a card-specific insight prompt** to the module's Genie space (see §5.4). Example prompt template for the claims-by-tier card: *"Using data filtered to {date_range} and provinces {provinces}: summarise in 3 sentences for an actuarial audience how average monthly claims cost differs across engagement tiers, quantify the gap between HIGHLY_ACTIVE and DORMANT in Rand and percent, and flag any month where the trend reversed."*
3. The insight panel shows a shimmer skeleton while Genie responds (typically 5–20s), then streams/renders the text. The chart is never blocked by the insight.
4. Insights are cached keyed on `(card_id, filter_hash)` for the session; "Refresh insight" busts the cache.
5. If Genie fails or times out (30s), the panel degrades to a computed fallback sentence from the chart data itself (e.g., "HIGHLY_ACTIVE members averaged R412 pm in claims vs R1,890 for DORMANT — a 78% gap.") with a subtle "AI insight unavailable — showing computed summary" note. Never an empty box, never a raw error.

### 4.2 Module 1 — Health & Wellness Tracking

**Row 1 — stat cards (4):** Active members (30-day), Goal-met rate %, Gym check-ins (MTD), Screenings completed (MTD). Each shows value, delta vs. prior period with directional arrow, and a sparkline. One shared compact Genie insight strip sits under the stat row summarising overall engagement momentum.

**Row 2 — InsightCard: "Engagement over time"** — multi-line chart of `goal_met_pct` by `engagement_tier` from `gold.health_engagement_daily` (weekly resample). Genie insight explains tier trajectories and calls out inflection points (e.g., challenge-cycle drop-off).

**Row 3, left — InsightCard: "Gym activity by province"** — horizontal bar chart of check-ins per 1,000 members by province. Genie insight compares provinces and names the fastest-growing one.
**Row 3, right — InsightCard: "Screening uptake"** — grouped bar of `uptake_pct` by `screening_type`, current vs. prior quarter, from `gold.screening_uptake_monthly`. Genie insight highlights lagging screening types and the `out_of_range_pct` implication ("HbA1c uptake fell 4pts while out-of-range results rose — a screening campaign target").

**Row 4 — InsightCard: "Sleep & activity balance"** — scatter/heatmap of avg_sleep_hours vs avg_steps by tier. Genie provides a wellness-framing narrative for Naledi's campaign copy.

### 4.3 Module 2 — Financial & Insurance Rewards

**Row 1 — stat cards (4):** Total reward payout (MTD, ZAR), Premium discount cost (MTD), Active policies, Lapse rate %. Deltas vs. prior month.

**Row 2 — InsightCard: "Partner payout liability"** — stacked bar per month by partner from `gold.rewards_liability_monthly`, with a cap-utilisation table beneath (partner, MTD payout, cap, utilisation %, RAG dot — red ≥ 95%). Genie insight is explicitly prompted to flag cap breaches and trajectory: this is where the seeded `KULULA_AIR` anomaly surfaces ("Kulula cashback reached 104% of contracted cap in June, the second breach in six months; at current run-rate July closes at ~108%").

**Row 3, left — InsightCard: "Redemption mix"** — donut/area of payout by `event_category` over time. Genie explains mix shift (e.g., device subsidies growing faster than grocery cashback).
**Row 3, right — InsightCard: "Premium book by status tier"** — stacked area of `gross_premium_zar` by `vitality_status` with `effective_discount_pct` overlaid as a line, from `gold.premium_book_monthly`. Genie insight quantifies discount cost as % of gross premium and its trend.

**Row 4 — InsightCard: "Lapse watch"** — line of `lapse_rate_pct` by status tier. Genie contrasts lapse across tiers and flags the retention value of higher tiers (feeding Thandi's partner-renewal narrative).

### 4.4 Module 3 — The Bridge (Correlation Engine)

This is the flagship view; design it to feel like an analytical instrument, not another dashboard.

**Hero row — InsightCard: "The value loop"** — a wide combo chart from `gold.bridge_tier_summary_monthly`: bars = `avg_claims_zar_pm` per engagement tier, overlaid line = `avg_rewards_cost_zar_pm`, with `net_value_per_member_zar` labelled per tier. This chart carries the entire shared-value thesis in one frame. Its Genie insight is the longest in the app (4–5 sentences), prompted to (a) quantify the claims gap between DORMANT and HIGHLY_ACTIVE, (b) state net value per member per tier, and (c) surface the nuance that ACTIVE, not HIGHLY_ACTIVE, is the most profitable tier because reward costs climb at the top — and what that implies for benefit design.

**Row 2, left — InsightCard: "Claims frequency vs engagement"** — scatter from `gold.bridge_member_month` (aggregated server-side to tier × month points; never plot 50k members raw): x = `goal_met_pct` bucket, y = `claims_frequency_per_1000`, point size = members. Trend line included. Genie describes correlation strength and caveats selection effects for Pieter ("correlation shown is cohort-level; tenure-controlled view below").
**Row 2, right — InsightCard: "Tenure-controlled view"** — small-multiples or grouped bars of claims cost by tier, split by `tenure_months` bands (<12, 12–24, >24). This is Pieter's healthy-selection check. Genie states whether the tier gap persists within tenure bands (the generator should make it persist, attenuated ~20%).

**Row 3 — InsightCard: "Behaviour precedes risk"** — cohort line chart: members who moved from `LIGHT`→`ACTIVE` in a given month, indexed claims cost for 6 months before/after the transition vs. a matched non-transition cohort. Genie narrates the before/after delta — the closest the app gets to a causal claim, and Genie's prompt must instruct it to use "associated with", never "caused".

**Row 4 — InsightCard: "Lapse & lifetime value"** — bars of `lapse_rate_pct` by tier next to `net_value_per_member_zar`. Genie ties retention to engagement in one narrative for executive consumption.

**Bridge extra:** a "Copy executive summary" button that concatenates the current four Genie insights into a formatted paragraph block on the clipboard — this is the feature that kills the 3-week quarterly slide exercise.

---

## 5. Technical & Design Specifications for AI Assistants

### 5.1 Stack

- **Platform:** Databricks App. Python entrypoint serving a built React SPA plus a JSON API.
- **Backend:** FastAPI (Python 3.11). Uses `databricks-sdk` with the app's built-in service-principal auth (do NOT hardcode tokens; `WorkspaceClient()` with no args resolves credentials inside a Databricks App). Two responsibilities: (1) `/api/query/*` endpoints executing parameterised SQL against a serverless SQL warehouse (`databricks.sql` connector or `w.statement_execution`), gold tables only; (2) `/api/insight` endpoint wrapping the **Genie Conversations API** (`w.genie.start_conversation_and_wait` / `create_message_and_wait` against a configured `GENIE_SPACE_ID` per module, read from app environment/`app.yaml` env vars). Verify exact SDK method names against the installed `databricks-sdk` version at build time rather than trusting this document.
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, **Recharts** for charts, TanStack Query for data fetching/caching (insight cache keyed on `card_id + filterHash`), Zustand for the global filter store. No component mega-library; build the small component set below.
- **Config:** `app.yaml` declares the SQL warehouse resource and three env vars `GENIE_SPACE_HEALTH`, `GENIE_SPACE_FINANCE`, `GENIE_SPACE_BRIDGE`. One Genie space per module, each curated to that module's gold tables with instructions defining metrics (e.g., "loss ratio = claims_paid / premium").
- **Mock data:** a standalone `scripts/generate_mock_data.py` (Pandas + NumPy, seed 42) writing the schemas in §3 to Delta via Spark or, for local dev, to parquet + a `create_tables.sql` DDL file. Honour the correlation contract in §3.3 — add assertions at the end of the script that verify the seeded effects (e.g., assert dormant-vs-highly-active claims gap is within 35–45%).

### 5.2 Layout & interaction spec

- Sidebar left (fixed, `w-60`, collapsible), content area `max-w-[1440px] mx-auto px-8 py-6`, responsive grid `grid grid-cols-12 gap-6`; stat cards `col-span-3` (stack to `col-span-6`/`col-span-12` at `lg`/`md` breakpoints), standard InsightCards `col-span-6`, hero cards `col-span-12`.
- Route per module (`/health`, `/finance`, `/bridge`) with React Router; module switch preserves filter state.
- Transitions: route changes fade content in 150ms; cards mount with a single subtle 200ms translate-y(4px)+opacity stagger (50ms per card, max 6). Skeletons for both chart (grey block with pulse) and insight (three shimmering text lines). Respect `prefers-reduced-motion` — disable all of the above. No scroll-jacking, no parallax, nothing decorative in motion.
- All ZAR values formatted `R 1 234 567` (space thousands separator, SA convention); percentages 1 decimal; dates `dd MMM yyyy`.

### 5.3 Visual design system (deliberate, not template defaults)

The identity should feel like Discovery's world — clinical confidence with warmth — without cloning their brand assets.

- **Palette (CSS variables / Tailwind theme):**
  `--ink: #101828` (near-black text), `--surface: #F7F8FA` (app background), `--card: #FFFFFF`, `--line: #E4E7EC` (hairline borders),
  primary `--deep-teal: #0B5563` (nav active, primary buttons, chart series 1),
  accent `--amber: #E8A33D` (Vitality-gold nod: deltas-positive, chart series 2, the ✦ Genie label),
  supporting series: `#4E9BAA`, `#8A6FB8`, `#C0564F` (negative/alerts), tier ramp for engagement charts: `#CBD5E1 → #94B8C2 → #4E9BAA → #0B5563` (DORMANT→HIGHLY_ACTIVE).
  Do not use generic indigo-600 defaults; do not use a dark theme.
- **Type:** display/headers **"Sora"** (600), body **"Inter"** (400/500), numerals in stat cards use `font-variant-numeric: tabular-nums`. Stat-card values 32px/600, card titles 15px/600, insight text 14px/1.6 line-height in `--ink` at 85% opacity.
- **Signature element:** the Genie Insight panel — soft `#F4F9F9` background, 3px left border in `--deep-teal`, the ✦ mark in amber. It must be visually consistent across every card so users learn "teal-edged panel = AI narrative grounded in this chart".
- Cards: `rounded-xl border border-[--line] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]`, hover elevation increase only on interactive elements, never on static cards. Density: comfortable, 24px card padding; charts 280px tall (hero 360px). Focus states visible (`ring-2 ring-[--deep-teal]/40`) on all interactive controls.

### 5.4 Component architecture (build exactly these, reuse everywhere)

```
src/
  components/
    layout/   Sidebar.tsx, TopBar.tsx, FilterBar.tsx, GenieDrawer.tsx
    cards/    StatCard.tsx          # value, delta, sparkline
              InsightCard.tsx       # THE core composite (below)
              GenieInsightPanel.tsx # text panel + skeleton + fallback + refresh
    charts/   TimeSeriesChart.tsx, BarChart.tsx, StackedAreaChart.tsx,
              ScatterChart.tsx, ComboChart.tsx   # thin Recharts wrappers,
                                                 # theme colors from one chartTheme.ts
  hooks/      useChartData(cardId, sqlKey, filters)
              useGenieInsight(cardId, module, promptTemplate, filters)
  state/      filterStore.ts (Zustand)
  api/        client.ts (typed fetchers for /api/query, /api/insight)
  pages/      HealthPage.tsx, FinancePage.tsx, BridgePage.tsx
  config/     cards.ts   # declarative card registry: id, title, sqlKey,
                         # chart type, insight prompt template, grid span
```

**`InsightCard` contract:** props `{ cardId, title, subtitle?, chart: ReactNode, module }`. It internally calls `useGenieInsight` and renders `GenieInsightPanel` beneath the chart. Chart and insight load independently; the card never blocks on Genie. Prompt templates live in `config/cards.ts` with `{date_range}` / `{provinces}` / `{tiers}` placeholders interpolated from the filter store — the backend appends a system framing ("Answer in ≤4 sentences, plain business English, cite figures in ZAR, do not speculate beyond the data, use 'associated with' rather than causal language").

**Backend query registry:** SQL lives server-side in `backend/queries/*.sql`, referenced by `sqlKey`; the frontend never sends raw SQL. All queries parameterised (dates, province list) — no string interpolation of user input.

### 5.5 Non-functional requirements

- Chart data endpoints p95 < 1.5s against gold tables (they're pre-aggregated; if a query needs a join across silver, push it into a new gold table instead).
- Genie insight p95 < 20s with the 30s timeout + computed fallback from §4.1.
- Access: app deployed with Unity Catalog governance; the app service principal gets `SELECT` on `vitality_pulse.gold` only. No PII surfaces in the UI — everything is aggregate or pseudonymised member IDs, and Genie spaces are curated to gold tables only.
- Error states: every card has loading, empty ("No data for the selected filters"), and error ("Couldn't load this view — retry") states designed, not improvised.
- Accessibility: WCAG AA contrast on the palette above (verified: deep-teal on white passes), keyboard-navigable filters and drawer, chart data available via an accessible "view as table" toggle on each InsightCard.

### 5.6 Build order for the coding assistant

1. `scripts/generate_mock_data.py` + DDL, with correlation assertions.
2. FastAPI backend: query registry + `/api/query`, stub `/api/insight` returning canned text.
3. React shell: sidebar, routes, filter store, theme.
4. Component set (StatCard, InsightCard, chart wrappers) → Health page end-to-end.
5. Finance page, Bridge page.
6. Wire real Genie via SDK; add caching, fallback, and the Bridge "Copy executive summary".
7. Polish pass: skeletons, transitions, reduced-motion, empty/error states, `app.yaml`.

---

*End of PRD. All company-internal figures, datasets, personas, and business problems in this document are fictional scenarios engineered for a demonstration application and do not represent actual Discovery Vitality data or operations.*
