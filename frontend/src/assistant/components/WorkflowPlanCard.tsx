import { useState } from "react";
import { Workflow, AlertTriangle, Check } from "lucide-react";
import type { AgentBlock, WorkflowParam } from "../types";
import { useChatStream } from "../useChatStream";

type Plan = Extract<AgentBlock, { type: "workflow_plan" }>;

export function WorkflowPlanCard({ block }: { block: Plan }) {
  const [params, setParams] = useState<WorkflowParam[]>(block.params);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { confirmWorkflow } = useChatStream();

  const set = (key: string, value: string) =>
    setParams((p) => p.map((x) => (x.key === key ? { ...x, value } : x)));

  const canConfirm = !block.requiresTypedConfirmation || typed.trim().toUpperCase() === "URGENT";

  async function run() {
    setSubmitted(true);
    setConfirming(false);
    await confirmWorkflow(block.runRequestId, params);
  }

  return (
    <div className="rounded-xl border border-violet/30 bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs font-semibold text-violet">
        <Workflow className="h-3.5 w-3.5" /> Workflow · needs your confirmation
      </div>
      <div className="p-4">
        <h3 className="font-display text-[15px] font-semibold text-ink">{block.title}</h3>

        {/* Editable params */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {params.map((p) => (
            <label key={p.key} className="text-xs">
              <span className="text-ink/50">{p.label}</span>
              {p.kind === "enum" && p.options ? (
                <select value={p.value} disabled={!p.editable || submitted} onChange={(e) => set(p.key, e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-line px-2 py-1 text-sm text-ink disabled:bg-surface">
                  {p.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : p.kind === "multiline" ? (
                <textarea value={p.value} disabled={!p.editable || submitted} onChange={(e) => set(p.key, e.target.value)} rows={3}
                  className="mt-0.5 w-full rounded-md border border-line px-2 py-1 text-sm text-ink disabled:bg-surface" />
              ) : (
                <input value={p.value} disabled={!p.editable || submitted} onChange={(e) => set(p.key, e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-line px-2 py-1 text-sm text-ink disabled:bg-surface" />
              )}
            </label>
          ))}
        </div>

        {/* Steps */}
        <ol className="mt-3 space-y-1 text-xs text-ink/60">
          {block.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="text-ink/35">{i + 1}.</span>{s}</li>)}
        </ol>

        {/* Consequence */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber/10 px-3 py-2 text-xs text-ink/75">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
          {block.consequence}
        </div>

        {/* Confirm */}
        {!submitted ? (
          !confirming ? (
            <button onClick={() => setConfirming(true)}
              className="mt-3 rounded-lg bg-deep-teal px-4 py-2 text-sm font-medium text-white hover:bg-deep-teal/90">
              Review & confirm
            </button>
          ) : (
            <div className="mt-3 rounded-lg border border-line bg-surface p-3">
              {block.requiresTypedConfirmation && (
                <label className="mb-2 block text-xs text-ink/60">
                  This action is flagged urgent — type <b>URGENT</b> to confirm
                  <input value={typed} onChange={(e) => setTyped(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line px-2 py-1 text-sm" placeholder="URGENT" />
                </label>
              )}
              <div className="flex gap-2">
                <button disabled={!canConfirm} onClick={run}
                  className="flex items-center gap-1.5 rounded-lg bg-deep-teal px-4 py-2 text-sm font-medium text-white hover:bg-deep-teal/90 disabled:opacity-40">
                  <Check className="h-4 w-4" /> Confirm & run
                </button>
                <button onClick={() => setConfirming(false)} className="rounded-lg border border-line px-4 py-2 text-sm text-ink/60 hover:bg-white">Cancel</button>
              </div>
            </div>
          )
        ) : (
          <div className="mt-3 text-xs font-medium text-[#227C57]">✓ Confirmed — running below.</div>
        )}
      </div>
    </div>
  );
}
