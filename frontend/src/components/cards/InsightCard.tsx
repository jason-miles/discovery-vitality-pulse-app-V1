import { ReactNode, useEffect, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import clsx from "clsx";
import { useGenieInsight } from "../../hooks/useGenieInsight";
import { useInView } from "../../hooks/useInView";
import { GenieInsightPanel } from "./GenieInsightPanel";
import { useInsightRegistry } from "../../state/insightRegistry";
import type { Module } from "../../api/client";

interface Props {
  cardId: string;
  module: Module;
  title: string;
  subtitle?: string;
  /** Genie prompt (filters interpolated server-side); empty disables insight. */
  insightPrompt: string;
  /** Computed fallback sentence if Genie fails/times out. */
  insightFallback?: string | null;
  /** The chart element. */
  children: ReactNode;
  /** Optional accessible table view of the same data. */
  tableView?: ReactNode;
  className?: string;
  /** Stagger index for mount animation. */
  index?: number;
}

// THE core composite (PRD §4.1): title + chart + Genie insight panel beneath.
// Chart and insight load independently; the card never blocks on Genie.
export function InsightCard({
  cardId,
  module,
  title,
  subtitle,
  insightPrompt,
  insightFallback,
  children,
  tableView,
  className,
  index = 0,
}: Props) {
  const [showTable, setShowTable] = useState(false);
  // Defer the Genie call until the card scrolls into view, so chart-heavy
  // pages don't fire every insight request at once (perceived speed).
  const { ref, inView } = useInView<HTMLElement>("300px");
  const insight = useGenieInsight(cardId, module, insightPrompt, insightFallback ?? null, inView);
  const register = useInsightRegistry((s) => s.register);

  useEffect(() => {
    if (insight.data?.text) register(cardId, title, insight.data.text);
  }, [insight.data?.text, cardId, title, register]);

  return (
    <section
      ref={ref}
      className={clsx(
        "card-in rounded-xl border border-line bg-white p-6 shadow-card",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink/50">{subtitle}</p>}
        </div>
        {tableView && (
          <button
            onClick={() => setShowTable((s) => !s)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink/60 hover:border-deep-teal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
            aria-pressed={showTable}
          >
            {showTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>

      <div>{showTable && tableView ? tableView : children}</div>

      {insightPrompt && (
        <GenieInsightPanel
          insight={insight.data}
          isLoading={insight.isLoading || insight.isFetching}
          isError={insight.isError}
          onRefresh={() => insight.refetch()}
        />
      )}
    </section>
  );
}
