import { Loader2, Check, X, FileText, Download, Workflow } from "lucide-react";
import type { AgentBlock } from "../types";

type Progress = Extract<AgentBlock, { type: "workflow_progress" }>;

export function WorkflowProgressCard({ block }: { block: Progress }) {
  return (
    <div className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs font-semibold text-violet">
        <span className="flex items-center gap-2"><Workflow className="h-3.5 w-3.5" /> Workflow run · {block.runId}</span>
        {block.done && <span className="text-[#227C57]">Completed</span>}
      </div>
      <div className="p-4">
        <ol className="space-y-2">
          {block.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                {s.state === "done" ? <Check className="h-4 w-4 text-[#227C57]" />
                  : s.state === "running" ? <Loader2 className="h-4 w-4 animate-spin text-deep-teal" />
                  : s.state === "failed" ? <X className="h-4 w-4 text-alert" />
                  : <span className="block h-4 w-4 rounded-full border border-line" />}
              </span>
              <span className={s.state === "pending" ? "text-ink/40" : "text-ink/75"}>
                {s.label}
                {s.detail && <span className="block text-xs text-alert">{s.detail}</span>}
              </span>
            </li>
          ))}
        </ol>

        {block.artifacts.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-line pt-3">
            {block.artifacts.map((a) => (
              <a key={a.name} href={a.url} download className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-deep-teal hover:bg-genie-bg">
                <FileText className="h-4 w-4" /> {a.name}
                <Download className="ml-auto h-3.5 w-3.5 text-ink/40" />
              </a>
            ))}
          </div>
        )}
        {block.done && block.executedBy && (
          <div className="mt-3 text-[11px] text-ink/40">Executed by {block.executedBy} · {new Date(block.executedAt!).toLocaleString("en-ZA")}</div>
        )}
      </div>
    </div>
  );
}
