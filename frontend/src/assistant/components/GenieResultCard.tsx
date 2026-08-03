import { useState } from "react";
import { Sparkles, Table2, BarChart3, Code2, X } from "lucide-react";
import clsx from "clsx";
import { ChartRenderer } from "./ChartRenderer";
import { DataTable } from "./DataTable";
import type { AgentBlock } from "../types";

type GenieResult = Extract<AgentBlock, { type: "genie_result" }>;

export function GenieResultCard({ block }: { block: GenieResult }) {
  const [view, setView] = useState<"chart" | "table">(block.chartSpec ? "chart" : "table");
  const [sqlOpen, setSqlOpen] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-deep-teal">
          <Sparkles className="h-3.5 w-3.5 text-amber" />
          {block.spaceName}
          <span className="text-ink/35">· {block.rowCount} rows · as at {block.asOf}</span>
        </div>
        <div className="flex items-center gap-1">
          {block.chartSpec && (
            <button onClick={() => setView(view === "chart" ? "table" : "chart")}
              className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink/60 hover:border-deep-teal/40">
              {view === "chart" ? <Table2 className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
              {view === "chart" ? "Table" : "Chart"}
            </button>
          )}
          <button onClick={() => setSqlOpen(true)}
            className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink/60 hover:border-deep-teal/40">
            <Code2 className="h-3.5 w-3.5" /> SQL
          </button>
        </div>
      </div>
      <div className="p-4">
        {view === "chart" && block.chartSpec
          ? <ChartRenderer spec={block.chartSpec} rows={block.table.rows} />
          : <DataTable columns={block.table.columns} rows={block.table.rows} />}
      </div>

      {/* SQL slide-over */}
      {sqlOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-ink/20" onClick={() => setSqlOpen(false)} aria-hidden />
          <div className={clsx("fixed right-0 top-0 z-40 flex h-full w-[520px] max-w-full flex-col border-l border-line bg-white shadow-xl")}>
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <span className="flex items-center gap-2 font-display font-semibold text-ink"><Code2 className="h-4 w-4 text-deep-teal" /> Generated SQL</span>
              <button onClick={() => setSqlOpen(false)} className="rounded p-1 text-ink/50 hover:bg-surface"><X className="h-5 w-5" /></button>
            </div>
            <pre className="flex-1 overflow-auto bg-surface p-4 text-xs leading-relaxed text-ink/80"><code>{block.sql}</code></pre>
            <div className="border-t border-line px-5 py-3 text-xs text-ink/45">Executed against governed gold tables via the module Genie space.</div>
          </div>
        </>
      )}
    </div>
  );
}
