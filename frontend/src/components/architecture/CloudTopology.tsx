import type { ReactNode } from "react";
import { ArrowRight, Database } from "lucide-react";

// A per-cloud Databricks reference topology, following the canonical
// "databricks + <cloud>" reference-architecture layout:
//   source sidebar → ML lane (Notebooks → MLflow → cloud ML)
//                   → Data Engineering lane (Bronze→Silver→Gold Delta)
//                   → streaming ingestion box
//   + right "Databricks SQL & Apps" panel with *this app* highlighted.

export interface CloudSpec {
  name: string;
  accent: string;        // brand accent for the "+ <cloud>" wordmark
  storage: string;       // object store label under each Delta box
  mlInference: string;   // the real-time inference target
  streaming: string;     // streaming ingestion service
  biTools: string;       // BI ecosystem footnote
}

export const CLOUDS: CloudSpec[] = [
  { name: "AWS", accent: "#E8A33D", storage: "Amazon S3", mlInference: "AWS ECS / SageMaker", streaming: "Amazon Kinesis", biTools: "Tableau · AI/BI · Looker" },
  { name: "Azure", accent: "#3B82C4", storage: "ADLS Gen2", mlInference: "Azure ML", streaming: "Event Hubs", biTools: "Tableau · Power BI · AI/BI" },
  { name: "GCP", accent: "#5B9BD5", storage: "GCS", mlInference: "Vertex AI", streaming: "Pub/Sub", biTools: "Looker · Tableau · AI/BI" },
];

const BATCH_SOURCES = ["Settlement / claims", "Policy & premium book", "Member & partner registry"];
const STREAM_SOURCES = ["Half-hourly device reads", "Gym / IoT check-ins", "Reward & POS events"];

function Box({ children, active = false, dashed = false }: { children: ReactNode; active?: boolean; dashed?: boolean }) {
  return (
    <div className={`rounded-lg px-4 py-2.5 text-center ${
      dashed ? "border border-dashed" : "border"
    } ${active ? "border-deep-teal bg-genie-bg" : "border-line bg-white"}`}>
      {children}
    </div>
  );
}

function GreenArrow({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1">
      <ArrowRight className="h-4 w-4 text-[#227C57]" />
      {label && <span className="mt-0.5 text-[10px] leading-none text-ink/40">{label}</span>}
    </div>
  );
}

function DeltaBox({ tier, layer, storage }: { tier: string; layer: string; storage: string }) {
  return (
    <div className="min-w-[120px] rounded-lg border-2 border-[#4E9BAA]/50 bg-white px-3 py-2.5 text-center">
      <div className="text-sm font-bold text-ink">{tier}</div>
      <div className="text-[11px] text-ink/45">({layer})</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-deep-teal">Delta Lake</div>
      <div className="mt-0.5 border-t border-line pt-0.5 text-[10px] text-ink/40">{storage}</div>
    </div>
  );
}

export function CloudTopology({ cloud }: { cloud: CloudSpec }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-5">
      {/* Wordmark */}
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-ink" />
        <span className="font-display text-xl font-bold text-ink">databricks</span>
        <span className="font-display text-xl font-bold" style={{ color: cloud.accent }}>+ {cloud.name}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Source sidebar */}
        <div className="w-full shrink-0 lg:w-44">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink/35">Batch</div>
          <div className="mt-1 space-y-0.5">
            {BATCH_SOURCES.map((s) => <div key={s} className="text-xs text-ink/65">{s}</div>)}
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink/35">Streaming</div>
          <div className="mt-1 space-y-0.5">
            {STREAM_SOURCES.map((s) => <div key={s} className="text-xs text-ink/65">{s}</div>)}
          </div>
          <div className="mt-3 rounded-lg border border-violet/40 bg-violet/5 px-3 py-2 text-center">
            <div className="text-sm font-semibold text-violet">{cloud.streaming}</div>
            <div className="text-[11px] text-ink/45">ingestion</div>
          </div>
        </div>

        {/* Lanes */}
        <div className="flex-1 space-y-3">
          {/* ML lane */}
          <div className="rounded-lg border border-dashed border-line p-3">
            <div className="mb-2 text-[13px] font-semibold text-ink">Databricks Machine Learning</div>
            <div className="flex flex-wrap items-stretch gap-2">
              <Box><div className="text-sm font-semibold text-ink">Notebooks</div><div className="text-[11px] text-ink/45">ML Runtime</div></Box>
              <GreenArrow />
              <Box><div className="text-sm font-semibold text-ink">MLflow</div><div className="text-[11px] text-ink/45">Tracking</div></Box>
              <GreenArrow />
              <Box><div className="text-sm font-semibold text-ink">MLflow</div><div className="text-[11px] text-ink/45">Registry</div></Box>
              <GreenArrow />
              <Box active><div className="text-sm font-semibold text-ink">{cloud.mlInference}</div><div className="text-[11px] text-ink/45">real-time inference</div></Box>
            </div>
          </div>

          {/* Data engineering lane */}
          <div className="rounded-lg border border-dashed border-line p-3">
            <div className="mb-2 text-[13px] font-semibold text-ink">Databricks Data Engineering</div>
            <div className="flex flex-wrap items-center gap-2">
              <DeltaBox tier="Raw Data" layer="Bronze" storage={cloud.storage} />
              <GreenArrow label="Spark ETL" />
              <DeltaBox tier="Refined Data" layer="Silver" storage={cloud.storage} />
              <GreenArrow label="Spark ETL" />
              <DeltaBox tier="Enriched Data" layer="Gold" storage={cloud.storage} />
            </div>
          </div>
        </div>

        {/* Right SQL & Apps panel */}
        <div className="w-full shrink-0 rounded-lg border border-line bg-white p-3 lg:w-52">
          <div className="mb-2 text-[13px] font-semibold text-ink">Databricks SQL &amp; Apps</div>
          <div className="space-y-1.5">
            <div className="rounded-md bg-deep-teal px-3 py-2 text-center text-xs font-semibold text-white">
              This app (Databricks App)
            </div>
            {["AI/BI Dashboards", "AI/BI Genie", "Data Catalog (UC)", "Delta Sharing", "SQL editor"].map((x) => (
              <div key={x} className="rounded-md bg-ink px-3 py-2 text-center text-xs font-medium text-white/90">{x}</div>
            ))}
          </div>
          <div className="mt-2 text-center text-[10px] text-ink/40">{cloud.biTools}</div>
        </div>
      </div>
    </div>
  );
}
