import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AXIS_PROPS, GRID_PROPS } from "./chartTheme";
import { tooltipStyle } from "./tooltip";

interface Series {
  key: string;
  color: string;
  label?: string;
}

interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  areas: Series[];
  /** Optional overlaid line on a secondary axis (e.g. effective_discount_pct). */
  overlayLine?: Series;
  xTickFormatter?: (v: string) => string;
  yTickFormatter?: (v: number) => string;
  overlayTickFormatter?: (v: number) => string;
}

export function StackedAreaChart({
  data,
  xKey,
  areas,
  overlayLine,
  xTickFormatter,
  yTickFormatter,
  overlayTickFormatter,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey={xKey} tickFormatter={xTickFormatter} {...AXIS_PROPS} tickLine={false} />
      <YAxis yAxisId="left" tickFormatter={yTickFormatter} {...AXIS_PROPS} tickLine={false} axisLine={false} width={48} />
      {overlayLine && (
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={overlayTickFormatter}
          {...AXIS_PROPS}
          tickLine={false}
          axisLine={false}
          width={44}
        />
      )}
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
      {areas.map((s) => (
        <Area
          key={s.key}
          yAxisId="left"
          type="monotone"
          dataKey={s.key}
          name={s.label ?? s.key}
          stackId="1"
          stroke={s.color}
          fill={s.color}
          fillOpacity={0.75}
          isAnimationActive={false}
        />
      ))}
      {overlayLine && (
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={overlayLine.key}
          name={overlayLine.label ?? overlayLine.key}
          stroke={overlayLine.color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      )}
    </ComposedChart>
    </ResponsiveContainer>
  );
}
