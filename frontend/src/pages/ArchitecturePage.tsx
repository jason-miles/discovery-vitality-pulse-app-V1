import {
  HeartPulse, Dumbbell, Gift, FileText, ShieldCheck, Stethoscope, Users,
  Shuffle, Sparkles, Database, MessageSquareText, GitMerge,
  Server, Gauge, Rocket, Wrench, Coins, Telescope, Ruler, ArrowRight,
  ArrowDown, Search, PlayCircle, Layers, Lock, Monitor, BookOpen,
  KeyRound, Cpu, Scissors, CheckCircle2, CircleDot,
} from "lucide-react";
import type { ReactNode } from "react";
import { CloudTopology, CLOUDS } from "../components/architecture/CloudTopology";
import { HeroStat } from "../components/cards/HeroStat";

// ── Small building blocks ────────────────────────────────────────────────
function Node({ icon: Icon, title, sub, accent = false }: {
  icon: typeof HeartPulse; title: string; sub: string; accent?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-card ${
      accent ? "border-l-[3px] border-l-deep-teal border-line" : "border-line"
    }`}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-genie-bg">
        <Icon className="h-4 w-4 text-deep-teal" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight text-ink">{title}</div>
        <div className="text-xs leading-tight text-ink/50">{sub}</div>
      </div>
    </div>
  );
}

function Column({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
        <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-ink/70">{title}</h3>
        {tag && <span className="text-[10px] font-medium uppercase tracking-wide text-ink/35">{tag}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

// A labelled edge between columns — the label says what actually flows along
// the arrow, so the diagram reads as a data flow, not five disconnected lists.
function Edge({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 items-center justify-center xl:flex-col xl:self-center xl:px-1">
      {/* horizontal on wide screens, vertical when the flow stacks */}
      <ArrowRight className="hidden h-5 w-5 text-[#227C57] xl:block" />
      <ArrowDown className="h-5 w-5 text-[#227C57] xl:hidden" />
      <span className="mt-1 max-w-[84px] text-center text-[10px] font-medium leading-tight text-ink/45">{label}</span>
    </div>
  );
}

function GroupLabel({ children, color }: { children: ReactNode; color: string }) {
  return <div className={`mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-wide ${color} first:mt-0`}>{children}</div>;
}

function Pillar({ icon: Icon, title, body }: { icon: typeof HeartPulse; title: string; body: string }) {
  return (
    <div className="card-in rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-genie-bg">
          <Icon className="h-5 w-5 text-deep-teal" />
        </div>
        <h4 className="font-display text-[15px] font-semibold text-ink">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-ink/65">{body}</p>
    </div>
  );
}

function SectionHead({ kicker, title, blurb }: { kicker: string; title: string; blurb: string }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#227C57]">{kicker}</div>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink/60">{blurb}</p>
    </div>
  );
}

// ── Live-asset chip — concrete workspace object IDs, proving this is real ──
// infrastructure an SA can open in the workspace, not a slideware mock.
function AssetChip({ icon: Icon, label, value, mono = true }: {
  icon: typeof HeartPulse; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-white/45">{label}</div>
        <div className={`truncate text-[12px] leading-tight text-white/90 ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

// ── One step in the RAG / GenAI pipeline rail ──────────────────────────────
function RagStep({ icon: Icon, title, detail, last = false }: {
  icon: typeof HeartPulse; title: string; detail: string; last?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-teal">
          <Icon className="h-4 w-4 text-white" />
        </div>
        {!last && <div className="my-0.5 h-full min-h-[18px] w-px flex-1 bg-deep-teal/25" />}
      </div>
      <div className="pb-3">
        <div className="text-sm font-semibold leading-tight text-ink">{title}</div>
        <div className="text-xs leading-snug text-ink/55">{detail}</div>
      </div>
    </div>
  );
}

// ── A row in the identity / UC grant matrix ────────────────────────────────
// Two lines per row (object + grant pill, then the rationale) so a wide grant
// name like CAN_MANAGE_RUN never collides with the "why" text.
function GrantRow({ object, grant, why }: { object: string; grant: string; why: string }) {
  return (
    <div className="border-t border-line px-3 py-2.5 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <code className="min-w-0 truncate text-[12px] text-deep-teal">{object}</code>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded bg-genie-bg px-2 py-0.5 text-[11px] font-bold text-deep-teal">
          <Lock className="h-3 w-3" />{grant}
        </span>
      </div>
      <div className="mt-0.5 text-[12px] leading-tight text-ink/55">{why}</div>
    </div>
  );
}

// ── A single serving lane in the runtime request path ─────────────────────
// Shows the full call chain an SA cares about: the /api endpoint the browser
// hits → the exact databricks-sdk method the backend invokes → the Databricks
// primitive → what comes back. Every lane reads the gold schema only.
function ServingLane({ icon: Icon, endpoint, sdk, primitive, primitiveSub, returns, note }: {
  icon: typeof HeartPulse; endpoint: string; sdk: string; primitive: string;
  primitiveSub: string; returns: string; note?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="shrink-0 rounded bg-ink/[0.04] px-2 py-1 text-[11px] font-semibold text-deep-teal sm:w-52">{endpoint}</code>
        <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#227C57] sm:block" />
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-genie-bg">
            <Icon className="h-4 w-4 text-deep-teal" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight text-ink">{primitive}</div>
            <div className="text-xs leading-tight text-ink/50">{primitiveSub}</div>
          </div>
        </div>
        <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#227C57] sm:block" />
        <div className="shrink-0 sm:w-48">
          <div className="text-xs font-medium text-ink/70">{returns}</div>
          {note && <div className="text-[11px] text-ink/40">{note}</div>}
        </div>
      </div>
      {/* The concrete databricks-sdk call — the detail SAs verify against */}
      <div className="mt-2 border-t border-line/70 pt-2 sm:pl-[13.5rem]">
        <code className="text-[10.5px] leading-none text-ink/45">w.{sdk}</code>
      </div>
    </div>
  );
}

export function ArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="hero-pattern card-in overflow-hidden rounded-xl bg-gradient-to-br from-deep-teal via-[#00466f] to-[#012740] p-8 text-white shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber">
              <span className="h-2 w-2 rounded-full bg-amber" /> Architecture
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Built on the Databricks<br />Data Intelligence Platform
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Two flows tell the whole story: a <b className="text-white">build pipeline</b> that lands raw
              wellness &amp; claims data and refines it up the medallion, and a <b className="text-white">runtime
              request path</b> where this governed Databricks App reads <em>gold only</em> through four
              serving primitives — SQL, Genie, Vector Search and Jobs.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat value={3} label="Medallion layers" />
            <HeroStat value={4} label="Serving primitives" />
            <HeroStat value={0} label="Data copies to share" />
          </div>
        </div>

        {/* Live-asset strip — the concrete workspace objects behind this app.
            Everything here is deployed, not mocked: an SA can open each one. */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber">
            <CircleDot className="h-3.5 w-3.5" /> Live workspace assets · not a mock
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
            <AssetChip icon={KeyRound} label="App service principal" value="a3c85de8…c6d404" />
            <AssetChip icon={Server} label="Serverless SQL warehouse" value="dcb1c3dd8d1570d6" />
            <AssetChip icon={Search} label="Vector Search endpoint" value="discovery-vitality-vs-endpoint" mono={false} />
            <AssetChip icon={MessageSquareText} label="AI/BI Genie spaces" value="3 · one per module" mono={false} />
            <AssetChip icon={PlayCircle} label="Databricks Job" value="id 409748057125494" />
          </div>
        </div>
      </div>

      {/* ── FLOW 1 · Build pipeline ─────────────────────────────────────── */}
      <div>
        <SectionHead
          kicker="Flow 1 · offline, runs on build"
          title="Build pipeline — raw sources up the medallion"
          blurb="Reproducible and idempotent: a seeded generator lands parquet in a UC Volume, then read_files → CTAS refines Bronze → Silver → Gold. This runs when the data is (re)built — not on every page view."
        />
        <div className="card-in rounded-xl border border-line bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 xl:flex-row">
            <Column title="Data Sources" tag="raw">
              <GroupLabel color="text-[#227C57]">Structured</GroupLabel>
              <Node icon={HeartPulse} title="Device telemetry" sub="Garmin · Apple · Fitbit reads" />
              <Node icon={Dumbbell} title="Gym check-ins" sub="partner turnstile feeds" />
              <Node icon={Gift} title="Reward events" sub="partner POS / redemptions" />
              <Node icon={FileText} title="Claims & policies" sub="actuarial book" />
              <GroupLabel color="text-amber">Semi-structured</GroupLabel>
              <Node icon={Stethoscope} title="Health screenings" sub="results + result bands" />
              <Node icon={BookOpen} title="Policy documents" sub="rules · contracts · clinical" />
              <GroupLabel color="text-deep-teal">Reference</GroupLabel>
              <Node icon={Users} title="Members & partners" sub="dims · status · caps" />
            </Column>

            <Edge label="seed=42 parquet" />

            <Column title="Ingest & ETL" tag="Spark">
              <Node icon={Shuffle} title="Mock generator" sub="seed=42 · correlation contract asserted" accent />
              <Node icon={Database} title="Parquet → UC Volume" sub="/Volumes/…/staging" />
              <Node icon={Layers} title="CREATE OR REPLACE TABLE" sub="AS SELECT … read_files(…, 'parquet')" accent />
              <Node icon={Search} title="Policy embeddings" sub="Delta corpus → Vector Search index" />
            </Column>

            <Edge label="load & refine" />

            <Column title="Medallion · Delta" tag="ACID">
              <Node icon={Database} title="Bronze" sub="raw landing · lineage" accent />
              <Node icon={Database} title="Silver" sub="member-month fact + dims" accent />
              <Node icon={Database} title="Gold" sub="app-facing aggregates" accent />
              {/* The real gold objects the app reads — SAs want the FQNs */}
              <div className="!mt-2 rounded-lg border border-line bg-surface/50 px-3 py-2">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink/40">
                  gold schema · 6 tables
                </div>
                <code className="block text-[10px] leading-snug text-ink/55">
                  …vitality_pulse_gold.{"{"}
                  <span className="text-deep-teal">health_engagement_daily, screening_uptake_monthly, rewards_liability_monthly, premium_book_monthly, bridge_member_month, bridge_tier_summary_monthly</span>
                  {"}"}
                </code>
              </div>
              <div className="!mt-2 flex items-center gap-2 rounded-lg border border-deep-teal/25 bg-genie-bg/50 px-3 py-2">
                <Lock className="h-4 w-4 shrink-0 text-deep-teal" />
                <span className="text-[11px] font-medium leading-tight text-ink/70">
                  Unity Catalog governs all three layers · time travel on every table
                </span>
              </div>
            </Column>
          </div>
        </div>
      </div>

      {/* ── FLOW 2 · Runtime request path ───────────────────────────────── */}
      <div>
        <SectionHead
          kicker="Flow 2 · live, runs on every visit"
          title="Runtime request path — the app reads gold only"
          blurb="The React SPA calls the FastAPI backend, which authenticates as the app service principal (SELECT on gold only) and fans out to four Databricks primitives. Genie and RAG answers are TTL-cached with a computed fallback, so a card is never empty."
        />
        <div className="card-in rounded-xl border border-line bg-white p-6 shadow-card">
          {/* Client → API header row */}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface/60 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-genie-bg">
                <Monitor className="h-5 w-5 text-deep-teal" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">React SPA</div>
                <div className="text-xs text-ink/50">TanStack Query · Recharts</div>
              </div>
            </div>
            <Edge label="POST /api/*" />
            <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-deep-teal/30 bg-genie-bg/40 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-deep-teal">
                <Sparkles className="h-5 w-5 text-amber" />
              </div>
              <div>
                <div className="text-sm font-semibold text-deep-teal">FastAPI backend</div>
                <div className="text-xs text-ink/50">app service principal · SELECT on gold only</div>
              </div>
            </div>
          </div>

          {/* Fan-out label + how-to-read notation */}
          <div className="my-3 flex flex-col items-center">
            <ArrowDown className="h-5 w-5 text-[#227C57]" />
            <span className="text-[11px] font-medium text-ink/45">fans out to four serving primitives — all read gold</span>
            <span className="mt-1 text-[10px] text-ink/35">
              each lane: <code className="text-deep-teal">/api endpoint</code> → primitive → response · with the exact <code className="text-ink/50">databricks-sdk</code> call
            </span>
          </div>

          {/* Four serving lanes */}
          <div className="space-y-2.5">
            <ServingLane
              icon={Server} endpoint="/api/query/{key}"
              sdk="statement_execution.execute_statement(...)"
              primitive="Serverless SQL Warehouse" primitiveSub="named-param SQL · server-side registry"
              returns="Chart rows" note="gold aggregates · auto-stops idle"
            />
            <ServingLane
              icon={MessageSquareText} endpoint="/api/insight · /genie/ask"
              sdk="genie.start_conversation_and_wait(...)"
              primitive="AI/BI Genie" primitiveSub="3 spaces · NL → SQL over gold"
              returns="Card narratives + tables" note="30-min TTL cache · computed fallback"
            />
            <ServingLane
              icon={Search} endpoint="/api/genie/rag"
              sdk="vector_search_indexes.query_index(...)"
              primitive="Vector Search index" primitiveSub="policy_documents_index → Genie grounding"
              returns="Answer + [n] citations" note="top-3 passages from policy corpus"
            />
            <ServingLane
              icon={PlayCircle} endpoint="/api/workflow/partner-report"
              sdk="jobs.run_now(...) · jobs.get_run(...)"
              primitive="Databricks Job" primitiveSub="Spark task → CSV in UC Volume"
              returns="Downloadable report" note="run status polled by the UI"
            />
          </div>

          {/* Where it lands in the app */}
          <div className="mt-3 flex flex-col items-center">
            <ArrowDown className="h-5 w-5 text-[#227C57]" />
            <span className="text-[11px] font-medium text-ink/45">rendered across the three modules + assistant</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Node icon={HeartPulse} title="Health & Wellness" sub="engagement + screenings" />
            <Node icon={Coins} title="Rewards & Premiums" sub="liability + lapse" />
            <Node icon={GitMerge} title="The Bridge" sub="behaviour → outcomes" />
            <Node icon={MessageSquareText} title="Ask Genie" sub="hub + deep-links" />
          </div>
        </div>
      </div>

      {/* ── DEEP DIVE · two side-by-side panels an SA will interrogate ────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* GenAI / RAG pipeline */}
        <div className="col-span-12 lg:col-span-7">
          <SectionHead
            kicker="Deep dive · GenAI"
            title="Grounded RAG — retrieval, then generation"
            blurb="The Documents capability is real retrieval-augmented generation: a Delta Sync Vector Search index over the policy corpus, retrieved top-k, then grounded through Genie with inline [n] citations — no free-floating LLM answers."
          />
          <div className="card-in rounded-xl border border-line bg-white p-6 shadow-card">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-genie-bg px-2.5 py-1 font-semibold text-deep-teal">Delta Sync index</span>
              <span className="rounded-full bg-genie-bg px-2.5 py-1 font-semibold text-deep-teal">databricks-gte-large-en</span>
              <span className="rounded-full bg-genie-bg px-2.5 py-1 font-semibold text-deep-teal">auto-synced from Delta</span>
            </div>
            <RagStep icon={FileText} title="1 · Policy corpus in Delta"
              detail="Vitality rules · partner contracts · clinical passages — governed in UC" />
            <RagStep icon={Scissors} title="2 · Chunk (~800 tok, 120 overlap)"
              detail="heading-aware splits → chunk_id · doc_title · page · section" />
            <RagStep icon={Cpu} title="3 · Embed + index"
              detail="databricks-gte-large-en → Delta Sync index on discovery-vitality-vs-endpoint" />
            <RagStep icon={Search} title="4 · Retrieve top-3"
              detail="w.vector_search_indexes.query_index(...) at request time" />
            <RagStep icon={MessageSquareText} title="5 · Ground through Genie"
              detail="retrieved passages injected as sources → answer cites [n]" last />
            <div className="mt-1 flex items-start gap-2 rounded-lg border border-deep-teal/25 bg-genie-bg/50 px-3 py-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" />
              <span className="text-[11px] leading-snug text-ink/70">
                If retrieval returns nothing, the app says so — it never fabricates a passage. Answers are
                grounded strictly on the top-k sources.
              </span>
            </div>
          </div>
        </div>

        {/* Identity & UC grant matrix */}
        <div className="col-span-12 lg:col-span-5">
          <SectionHead
            kicker="Deep dive · Security"
            title="Identity & least-privilege grants"
            blurb="In-app auth is the no-arg WorkspaceClient() resolving the app's service principal — no tokens in code. Every grant is scoped to exactly what a capability needs."
          />
          <div className="card-in overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <div className="flex items-center gap-2.5 border-b border-line bg-surface/60 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-deep-teal">
                <KeyRound className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">App service principal</div>
                <code className="text-[11px] text-ink/50">a3c85de8-0856-45e7-ab05-72c8a0c6d404</code>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-ink/40">
              <span>UC object</span><span>Grant · rationale</span>
            </div>
            <GrantRow object="…vitality_pulse_gold" grant="SELECT" why="read the app-facing aggregates" />
            <GrantRow object="…vitality_pulse_silver" grant="SELECT" why="Genie space source views" />
            <GrantRow object="warehouse dcb1c3dd8d1570d6" grant="CAN_USE" why="run SQL + Genie NL→SQL" />
            <GrantRow object="job 409748057125494" grant="CAN_MANAGE_RUN" why="trigger the partner report" />
            <div className="flex items-start gap-2 border-t border-line bg-genie-bg/40 px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" />
              <span className="text-[11px] leading-snug text-ink/70">
                No grant on <b>bronze</b> — raw PII never leaves the platform. The UI can only ever surface
                what gold exposes.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div className="card-in overflow-hidden rounded-xl bg-ink p-6 text-white shadow-card">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            { h: "Unified governance", b: "Unity Catalog · gold-only SP grants · SELECT scoping · no PII in UI" },
            { h: "Open formats", b: "Delta Lake · Parquet · read_files ingest" },
            { h: "Cloud", b: "AWS workspace · portable to Azure / GCP" },
            { h: "AI grounded in data", b: "Genie + Vector Search curated to gold · “associated with” framing" },
          ].map((c) => (
            <div key={c.h}>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber">{c.h}</div>
              <div className="text-sm leading-relaxed text-white/70">{c.b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Well-Architected six pillars */}
      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          Well-Architected — how this app maps to the six pillars
        </h2>
        <div className="grid grid-cols-12 gap-6">
          {[
            { icon: ShieldCheck, title: "Data governance & security", body: "Unity Catalog governs every table; the app service principal gets SELECT on the gold schema only. Bronze/silver stay internal; no member PII surfaces in the UI." },
            { icon: Gauge, title: "Reliability", body: "The mock generator asserts its own correlation contract; loads are idempotent (CREATE OR REPLACE); Delta gives ACID + time travel on every gold table." },
            { icon: Rocket, title: "Performance efficiency", body: "Pre-aggregated gold tables keep chart queries under ~1.5s on a serverless warehouse; the React bundle is code-split so the shell loads instantly." },
            { icon: Coins, title: "Cost optimization", body: "One lakehouse, no data copies. Genie reads the same gold tables as the charts; the serverless warehouse auto-stops when idle." },
            { icon: Telescope, title: "Operational excellence", body: "Reproducible build order (generate → load → deploy); every query lives server-side in a versioned registry; Genie spaces are created declaratively." },
            { icon: Ruler, title: "Interoperability & usability", body: "Open formats end-to-end, Genie natural-language access, and a governed Databricks App front-end with an accessible, brand-consistent UI." },
          ].map((p, i) => (
            <div key={p.title} className="col-span-12 md:col-span-6 lg:col-span-4" style={{ animationDelay: `${i * 40}ms` }}>
              <Pillar icon={p.icon} title={p.title} body={p.body} />
            </div>
          ))}
        </div>
      </div>

      {/* Deploy on any cloud — same lakehouse */}
      <div>
        <SectionHead
          kicker="Portability"
          title="Deploy on any cloud — the same lakehouse"
          blurb="The identical medallion + serving + Databricks App topology runs on AWS, Azure or GCP. Only the object store and streaming service change; the app, governance model, serving primitives and open formats stay the same."
        />
        <div className="space-y-4">
          {CLOUDS.map((c) => (
            <CloudTopology key={c.name} cloud={c} />
          ))}
        </div>
      </div>

      {/* Everything on one platform */}
      <div className="card-in rounded-xl border-l-[3px] border-deep-teal bg-genie-bg p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <Wrench className="h-5 w-5 text-deep-teal" />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-semibold text-ink">Everything on one platform</h3>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-ink/70">
              Data generation, transformation, the medallion store, natural-language analytics,
              retrieval, jobs, governance, and the app itself all run on the Databricks Data
              Intelligence Platform — no bolt-on services, one security model, and open storage
              formats end-to-end.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
