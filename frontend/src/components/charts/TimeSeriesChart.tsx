import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
  series: Series[];
  xTickFormatter?: (v: string) => string;
  yTickFormatter?: (v: number) => string;
  yDomain?: [number | "auto", number | "auto"];
}

export function TimeSeriesChart({
  data,
  xKey,
  series,
  xTickFormatter,
  yTickFormatter,
  yDomain,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey={xKey} tickFormatter={xTickFormatter} {...AXIS_PROPS} tickLine={false} />
      <YAxis
        tickFormatter={yTickFormatter}
        domain={yDomain}
        {...AXIS_PROPS}
        tickLine={false}
        axisLine={false}
        width={44}
      />
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
      {series.map((s) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label ?? s.key}
          stroke={s.color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      ))}
    </LineChart>
    </ResponsiveContainer>
  );
}
