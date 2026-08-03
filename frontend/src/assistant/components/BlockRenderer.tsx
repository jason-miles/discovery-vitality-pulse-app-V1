import { Loader2, Sparkles, FileText, Workflow, AlertCircle, RotateCw } from "lucide-react";
import { Markdown } from "./Markdown";
import { GenieResultCard } from "./GenieResultCard";
import { CitationCard } from "./CitationCard";
import { WorkflowPlanCard } from "./WorkflowPlanCard";
import { WorkflowProgressCard } from "./WorkflowProgressCard";
import type { AgentBlock, Capability } from "../types";
import { useChatStream } from "../useChatStream";

const CAP_ICON: Record<Capability, typeof Sparkles> = { genie: Sparkles, rag: FileText, workflow: Workflow };

export function BlockRenderer({ block }: { block: AgentBlock }) {
  const { send } = useChatStream();
  switch (block.type) {
    case "text":
      return <Markdown text={block.markdown} />;
    case "status": {
      const Icon = CAP_ICON[block.capability];
      return (
        <div className="flex items-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-deep-teal" />
          <Icon className="h-3.5 w-3.5 text-amber" /> {block.label}
        </div>
      );
    }
    case "genie_result":
      return <GenieResultCard block={block} />;
    case "citation_answer":
      return <CitationCard block={block} />;
    case "workflow_plan":
      return <WorkflowPlanCard block={block} />;
    case "workflow_progress":
      return <WorkflowProgressCard block={block} />;
    case "followups":
      return (
        <div className="flex flex-wrap gap-2">
          {block.suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink/70 hover:border-deep-teal/40 hover:text-deep-teal">
              {s}
            </button>
          ))}
        </div>
      );
    case "error":
      return (
        <div className="rounded-xl border border-alert/30 bg-alert/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-alert"><AlertCircle className="h-4 w-4" /> {block.title}</div>
          <p className="mt-1 text-sm text-ink/70">{block.detail}</p>
          {block.retryable && (
            <button className="mt-2 flex items-center gap-1.5 rounded-md border border-line px-3 py-1 text-xs text-ink/60 hover:border-deep-teal/40">
              <RotateCw className="h-3.5 w-3.5" /> Try again
            </button>
          )}
        </div>
      );
    default:
      return null;
  }
}
