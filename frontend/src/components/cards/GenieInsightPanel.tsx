import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { Insight } from "../../api/client";

interface Props {
  insight?: Insight;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

// The signature element (PRD §5.3): soft teal-tinted panel, 3px teal left
// border, amber ✦ mark. Consistent across every card so users learn
// "teal-edged panel = AI narrative grounded in this chart".
export function GenieInsightPanel({ insight, isLoading, isError, onRefresh }: Props) {
  return (
    <div className="mt-4 rounded-r-lg border-l-[3px] border-deep-teal bg-genie-bg px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-deep-teal">
          <Sparkles className="h-3.5 w-3.5 text-amber" />
          Genie
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded p-1 text-ink/40 transition hover:text-deep-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 disabled:opacity-40"
          aria-label="Refresh insight"
          title="Refresh insight"
        >
          <RefreshCw className={clsx("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <div className="shimmer h-3 w-full rounded" />
          <div className="shimmer h-3 w-[92%] rounded" />
          <div className="shimmer h-3 w-[70%] rounded" />
        </div>
      )}

      {!isLoading && insight && (
        <>
          <p className="text-sm leading-relaxed text-ink/85">{insight.text}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink/40">
            {insight.source === "computed" && (
              <span className="flex items-center gap-1 text-ink/50">
                <AlertCircle className="h-3 w-3" />
                AI insight unavailable — showing computed summary
              </span>
            )}
            <span className="ml-auto tnum">
              {new Date(insight.generated_at).toLocaleTimeString("en-ZA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </>
      )}

      {!isLoading && !insight && isError && (
        <p className="text-sm text-ink/50">AI insight unavailable for this view.</p>
      )}
    </div>
  );
}
