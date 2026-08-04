import type { ReactNode } from "react";
import { ArrowRight, ArrowDown, Database, Lock } from "lucide-react";

// A per-cloud Databricks reference topology that traces *this app's* real data
// flow (not a generic platform poster):
//
//   batch + streaming sources
//        │  land in the cloud object store
//        ▼
//   Bronze ──Spark ETL──▶ Silver ──aggregate──▶ Gold      (Delta, medallion)
//        │                                        │
//        └──────── Unity Catalog governs all ─────┘
//                                                 │ gold-only SELECT
//                                                 ▼
//   Serving primitives the app calls: SQL Warehouse · Genie · Vector Search · Jobs
//        │
//        ▼
//   This app — a Databricks App (FastAPI + React) reading gold only
//
// Only the object store and streaming service differ per cloud; the medallion,
// governance model, serving primitives and app stay identical.

export interface CloudSpec {
  name: string;
  accent: string;        // brand accent for the "+ <cloud>" wordmark
  storage: string;       // object store the Delta tables live on
  streaming: string;     // streaming ingestion service
  biTools: string;       // BI ecosystem footnote
}

export const CLOUDS: CloudSpec[] = [
  { name: "AWS", accent: "#E8A33D", storage: "Amazon S3", streaming: "Amazon Kinesis", biTools: "Tableau · AI/BI · Looker" },
  { name: "Azure", accent: "#3B82C4", storage: "ADLS Gen2", streaming: "Event Hubs", biTools: "Tableau · Power BI · AI/BI" },
  { name: "GCP", accent: "#5B9BD5", storage: "GCS", streaming: "Pub/Sub", biTools: "Looker · Tableau · AI/BI" },
];

const BATCH_SOURCES = ["Settlement / claims", "Policy & premium book", "Member & partner registry"];
const STREAM_SOURCES = ["Half-hourly device reads", "Gym / IoT check-ins", "Reward & POS events"];

// The four serving primitives *this app* actually calls (server/*.py), each
// reading the gold schema only. Shown as the fan-out from Gold, annotated with
// the concrete databricks-sdk surface so an SA can trace it to code.
const SERVING = [
  { name: "Serverless SQL", sub: "charts" },
  { name: "AI/BI Genie", sub: "3 spaces · NL→SQL" },
  { name: "Vector Search", sub: "policy RAG · citations" },
  { name: "Databricks Jobs", sub: "partner report → CSV" },
];

function GreenArrow({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1">
      <ArrowRight className="h-4 w-4 text-flow" />
      {label && <span className="mt-0.5 max-w-[72px] text-center text-[10px] leading-tight text-ink/45">{label}</span>}
    </div>
  );
}

function DeltaBox({ tier, layer, storage }: { tier: string; layer: string; storage: string }) {
  return (
    <div className="min-w-[128px] flex-1 rounded-lg border-2 border-delta-edge/50 bg-white px-3 py-2.5 text-center">
      <div className="text-sm font-bold text-ink">{tier}</div>
      <div className="text-[11px] text-ink/45">({layer})</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-deep-teal">Delta Lake</div>
      <div className="mt-0.5 border-t border-line pt-0.5 text-[10px] text-ink/40">{storage}</div>
    </div>
  );
}

function SourceLane({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink/35">{label}</div>
      <div className="mt-1 space-y-0.5">
        {items.map((s) => <div key={s} className="text-xs text-ink/65">{s}</div>)}
      </div>
    </div>
  );
}

function ServingChip({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex flex-col rounded-md border border-line bg-white px-2.5 py-2 text-center">
      <div className="text-xs font-semibold text-ink">{name}</div>
      <div className="text-[10px] leading-tight text-ink/45">{sub}</div>
    </div>
  );
}

function Wordmark({ children }: { children: ReactNode }) {
  return <span className="font-display text-xl font-bold text-ink">{children}</span>;
}

export function CloudTopology({ cloud }: { cloud: CloudSpec }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-5">
      {/* Wordmark */}
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-ink" />
        <Wordmark>databricks</Wordmark>
        <span className="font-display text-xl font-bold" style={{ color: cloud.accent }}>+ {cloud.name}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* 1 · Sources → ingest */}
        <div className="w-full shrink-0 lg:w-48">
          <SourceLane label="Batch" items={BATCH_SOURCES} />
          <div className="mt-3"><SourceLane label="Streaming" items={STREAM_SOURCES} /></div>
          <div className="mt-3 rounded-lg border border-violet/40 bg-violet/5 px-3 py-2 text-center">
            <div className="text-sm font-semibold text-violet">{cloud.streaming}</div>
            <div className="text-[11px] text-ink/45">ingestion → {cloud.storage}</div>
          </div>
        </div>

        <div className="hidden items-center lg:flex"><GreenArrow label="land raw" /></div>

        {/* 2 · Medallion + governance + serving fan-out */}
        <div className="flex-1 space-y-3">
          {/* Medallion lane */}
          <div className="rounded-lg border border-dashed border-line p-3">
            <div className="mb-2 text-[13px] font-semibold text-ink">Data Engineering — medallion on Delta</div>
            <div className="flex flex-wrap items-center gap-1">
              <DeltaBox tier="Raw Data" layer="Bronze" storage={cloud.storage} />
              <GreenArrow label="Spark ETL" />
              <DeltaBox tier="Refined" layer="Silver" storage={cloud.storage} />
              <GreenArrow label="aggregate" />
              <DeltaBox tier="Enriched" layer="Gold" storage={cloud.storage} />
            </div>
          </div>

          {/* Governance band spanning the whole lane */}
          <div className="flex items-center gap-2 rounded-lg border border-deep-teal/25 bg-genie-bg/50 px-3 py-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0 text-deep-teal" />
            <span className="text-[11px] font-medium text-ink/70">
              Unity Catalog governs every layer — app service principal gets <b>SELECT on gold only</b>
            </span>
          </div>

          {/* gold → serving */}
          <div className="flex flex-col items-center">
            <ArrowDown className="h-4 w-4 text-flow" />
            <span className="text-[10px] leading-none text-ink/45">gold-only reads</span>
          </div>
          <div className="rounded-lg border border-dashed border-line p-3">
            <div className="mb-2 text-[13px] font-semibold text-ink">Serving — the primitives this app calls</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SERVING.map((s) => <ServingChip key={s.name} name={s.name} sub={s.sub} />)}
            </div>
            <code className="mt-2 block text-[10px] leading-tight text-deep-teal/70">
              w.statement_execution · w.genie · w.vector_search_indexes · w.jobs
            </code>
          </div>
        </div>

        <div className="hidden items-center lg:flex"><GreenArrow label="HTTPS / SDK" /></div>

        {/* 3 · The app */}
        <div className="flex w-full shrink-0 flex-col rounded-lg border border-line bg-white p-3 lg:w-48">
          <div className="mb-2 text-[13px] font-semibold text-ink">Databricks SQL &amp; Apps</div>
          <div className="rounded-md bg-deep-teal px-3 py-2 text-center text-xs font-semibold text-white">
            This app
            <div className="text-[10px] font-normal text-white/70">Databricks App · FastAPI + React</div>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {["AI/BI Dashboards", "Data Catalog (UC)", "Delta Sharing", "SQL editor"].map((x) => (
              <div key={x} className="rounded-md bg-ink px-3 py-1.5 text-center text-[11px] font-medium text-white/90">{x}</div>
            ))}
          </div>
          <div className="mt-auto pt-2 text-center text-[10px] text-ink/40">{cloud.biTools}</div>
        </div>
      </div>
    </div>
  );
}
