import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { AXIS_PROPS, GRID_PROPS } from "./chartTheme";
import { tooltipStyle } from "./tooltip";

interface BarSeries {
  key: string;
  color: string;
  label?: string;
}
interface LineSeries {
  key: string;
  color: string;
  label?: string;
}

interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarSeries[];
  lines?: LineSeries[];
  /** Column whose value is printed above each x category (e.g. net value). */
  labelKey?: string;
  labelFormatter?: (v: number) => string;
  xTickFormatter?: (v: string) => string;
  yTickFormatter?: (v: number) => string;
  rightTickFormatter?: (v: number) => string;
}

// Combo: bars + overlaid line(s), used by the Bridge hero "value loop" chart.
export function ComboChart({
  data,
  xKey,
  bars,
  lines = [],
  labelKey,
  labelFormatter,
  xTickFormatter,
  yTickFormatter,
  rightTickFormatter,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey={xKey} tickFormatter={xTickFormatter} {...AXIS_PROPS} tickLine={false} />
      <YAxis yAxisId="left" tickFormatter={yTickFormatter} {...AXIS_PROPS} tickLine={false} axisLine={false} width={48} />
      {lines.length > 0 && (
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={rightTickFormatter}
          {...AXIS_PROPS}
          tickLine={false}
          axisLine={false}
          width={48}
        />
      )}
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
      {bars.map((b) => (
        <Bar key={b.key} yAxisId="left" dataKey={b.key} name={b.label ?? b.key} fill={b.color} radius={[4, 4, 0, 0]}>
          {labelKey && b === bars[0] && (
            <LabelList
              dataKey={labelKey}
              position="top"
              formatter={labelFormatter}
              style={{ fontSize: 11, fill: "#101828", fontWeight: 600 }}
            />
          )}
        </Bar>
      ))}
      {lines.map((l) => (
        <Line
          key={l.key}
          yAxisId="right"
          type="monotone"
          dataKey={l.key}
          name={l.label ?? l.key}
          stroke={l.color}
          strokeWidth={2.5}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      ))}
    </ComposedChart>
    </ResponsiveContainer>
  );
}
