import {
  HeartPulse, Dumbbell, Gift, FileText, ShieldCheck, Stethoscope, Users,
  Shuffle, Timer, Sparkles, Database, MessageSquareText, GitMerge, Wallet,
  Activity, TableProperties, Server, ClipboardCheck, Gauge, Rocket,
  Wrench, Coins, Telescope, Ruler, ArrowRight,
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

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <h3 className="mb-3 border-b border-line pb-2 font-display text-[13px] font-semibold uppercase tracking-wide text-ink/70">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden shrink-0 items-center self-center px-1 xl:flex">
      <ArrowRight className="h-5 w-5 text-ink/25" />
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

export function ArchitecturePage() {
  return (
    <div className="space-y-6">
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
              An end-to-end, Well-Architected flow — from raw wellness &amp; claims data to a
              governed Databricks App with AI narratives — all on one lakehouse, one security model.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat value={3} label="Medallion layers" />
            <HeroStat value={1} label="Governance plane (UC)" />
            <HeroStat value={0} label="Data copies to share" />
          </div>
        </div>
      </div>

      {/* Horizontal data-flow */}
      <div className="card-in rounded-xl border border-line bg-white p-6 shadow-card" style={{ animationDelay: "50ms" }}>
        <div className="flex flex-col gap-6 xl:flex-row">
          <Column title="Data Sources">
            <GroupLabel color="text-[#227C57]">Structured</GroupLabel>
            <Node icon={HeartPulse} title="Device telemetry" sub="Garmin · Apple · Fitbit reads" />
            <Node icon={Dumbbell} title="Gym check-ins" sub="partner turnstile feeds" />
            <Node icon={Gift} title="Reward events" sub="partner POS / redemptions" />
            <Node icon={FileText} title="Claims & policies" sub="actuarial book" />
            <GroupLabel color="text-amber">Semi-structured</GroupLabel>
            <Node icon={Stethoscope} title="Health screenings" sub="results + result bands" />
            <GroupLabel color="text-deep-teal">Reference</GroupLabel>
            <Node icon={Users} title="Members & partners" sub="dims · status · caps" />
          </Column>

          <Arrow />

          <Column title="Ingest & ETL">
            <Node icon={Shuffle} title="Mock generator" sub="seed=42 · reproducible" accent />
            <Node icon={Timer} title="Correlation contract" sub="signal embedded + asserted" />
            <Node icon={Database} title="Parquet → UC Volume" sub="staged for load" />
            <Node icon={TableProperties} title="CTAS → Delta" sub="read_files → managed tables" />
          </Column>

          <Arrow />

          <Column title="Storage · Medallion">
            <Node icon={Database} title="Bronze" sub="raw landing (lineage)" accent />
            <Node icon={Database} title="Silver" sub="member-month fact + dims" accent />
            <Node icon={Database} title="Gold" sub="app-facing aggregates" accent />
            <Node icon={TableProperties} title="Delta tables" sub="ACID · time travel" />
          </Column>

          <Arrow />

          <Column title="Serving & AI">
            <Node icon={Server} title="Serverless SQL" sub="parameterised, gold-only" accent />
            <Node icon={MessageSquareText} title="AI/BI Genie" sub="3 spaces · NL → SQL" accent />
            <Node icon={GitMerge} title="Correlation engine" sub="the value loop" />
            <Node icon={ClipboardCheck} title="Computed fallback" sub="never an empty insight" />
          </Column>

          <Arrow />

          {/* App column — highlighted */}
          <div className="flex-1 rounded-xl border border-deep-teal/30 bg-genie-bg/40 p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-deep-teal/20 pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-deep-teal">
                <Sparkles className="h-4 w-4 text-amber" />
              </div>
              <div>
                <div className="font-display text-sm font-bold text-deep-teal">Vitality Pulse App</div>
                <div className="text-[11px] text-ink/50">this app · FastAPI + React</div>
              </div>
            </div>
            <div className="space-y-2.5">
              <Node icon={Activity} title="Health & Wellness" sub="engagement + screenings" />
              <Node icon={Wallet} title="Rewards & Premiums" sub="liability + lapse" />
              <Node icon={GitMerge} title="The Bridge" sub="behaviour → outcomes" />
              <Node icon={MessageSquareText} title="Ask Genie" sub="hub + deep-links" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer band */}
      <div className="card-in overflow-hidden rounded-xl bg-ink p-6 text-white shadow-card" style={{ animationDelay: "100ms" }}>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            { h: "Unified governance", b: "Unity Catalog · gold-only SP grants · SELECT scoping · no PII in UI" },
            { h: "Open formats", b: "Delta Lake · Parquet · read_files ingest" },
            { h: "Cloud", b: "AWS workspace · portable to Azure / GCP" },
            { h: "AI grounded in data", b: "Genie spaces curated to gold · “associated with” framing" },
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
        <h2 className="mb-1 font-display text-xl font-semibold text-ink">
          Deploy on any cloud — the same lakehouse
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-ink/60">
          The identical medallion + Genie + Databricks App topology runs on AWS, Azure or GCP.
          Only the object store, streaming service and managed-ML target change; the app,
          governance model and open formats stay the same.
        </p>
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
              governance, and the app itself all run on the Databricks Data Intelligence Platform —
              no bolt-on services, one security model, and open storage formats end-to-end.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
