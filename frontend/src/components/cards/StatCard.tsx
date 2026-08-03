import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import clsx from "clsx";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { CHART } from "../charts/chartTheme";

interface Props {
  label: string;
  value: string;
  /** Percentage delta vs prior period; null hides the delta. */
  delta?: number | null;
  /** true = up is good (green up), false = up is bad (e.g. lapse rate). */
  higherIsBetter?: boolean;
  sparkline?: number[];
  index?: number;
}

export function StatCard({
  label,
  value,
  delta,
  higherIsBetter = true,
  sparkline,
  index = 0,
}: Props) {
  const good = delta == null ? null : higherIsBetter ? delta >= 0 : delta <= 0;
  const Icon = delta == null ? Minus : delta >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className="card-in rounded-xl border border-line bg-white p-5 shadow-card"
      style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
    >
      <div className="text-xs font-medium text-ink/55">{label}</div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="tnum font-display text-[32px] font-semibold leading-none text-ink">
          {value}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="h-8 w-20 opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={CHART.deepTeal}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {delta != null && (
        <div
          className={clsx(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            good ? "text-[#227C57]" : "text-alert",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="tnum">{Math.abs(delta).toFixed(1)}%</span>
          <span className="text-ink/40">vs prior period</span>
        </div>
      )}
    </div>
  );
}
