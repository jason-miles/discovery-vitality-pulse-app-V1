import {
  ResponsiveContainer, ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { ChartSpec, Row } from "../types";
import { SERIES, AXIS_PROPS, GRID_PROPS } from "../../components/charts/chartTheme";
import { tooltipStyle } from "../../components/charts/tooltip";
import { formatZARCompact, formatPct } from "../../lib/format";

// Renders a ChartSpec (bar | line | area) with our chart theme.
export function ChartRenderer({ spec, rows }: { spec: ChartSpec; rows: Row[] }) {
  const fmt = (v: number) =>
    spec.yFormat === "zar" ? formatZARCompact(v) : spec.yFormat === "percent" ? formatPct(v) : String(v);
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={spec.xKey} {...AXIS_PROPS} tickLine={false} />
          <YAxis tickFormatter={fmt} {...AXIS_PROPS} tickLine={false} axisLine={false} width={52} />
          <Tooltip {...tooltipStyle} />
          {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />}
          {spec.series.map((s, i) => {
            const color = SERIES[i % SERIES.length];
            if (spec.kind === "line")
              return <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />;
            if (spec.kind === "area")
              return <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={color} fill={color} fillOpacity={0.7} isAnimationActive={false} />;
            return <Bar key={s.key} dataKey={s.key} name={s.label} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
