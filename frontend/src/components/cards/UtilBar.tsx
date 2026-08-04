import { CHART } from "../charts/chartTheme";
import { formatPct } from "../../lib/format";

const RAG_COLOR: Record<string, string> = {
  RED: CHART.alert,
  AMBER: CHART.amber,
  GREEN: "#227C57",
};

// A compact horizontal utilisation bar coloured by RAG status, with the % value
// beside it. Used in the Finance cap table and the exec concerns list so the
// "how close to the limit" signal reads identically across the app.
export function UtilBar({ pct, rag, width = "flex-1" }: { pct: number; rag?: string; width?: string }) {
  const color = RAG_COLOR[rag ?? ""] ??
    (pct >= 100 ? CHART.alert : pct >= 95 ? CHART.amber : "#227C57");
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 overflow-hidden rounded-full bg-line ${width}`}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <span className="tnum w-12 text-right text-xs font-semibold" style={{ color }}>
        {formatPct(pct)}
      </span>
    </div>
  );
}
