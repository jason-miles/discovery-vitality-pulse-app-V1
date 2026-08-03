import {
  ScatterChart as RScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AXIS_PROPS, GRID_PROPS } from "./chartTheme";
import { tooltipStyle } from "./tooltip";

interface Group {
  name: string;
  color: string;
  points: Record<string, unknown>[];
}

interface Props {
  groups: Group[];
  xKey: string;
  yKey: string;
  sizeKey?: string;
  xLabel?: string;
  yLabel?: string;
  xTickFormatter?: (v: number) => string;
  yTickFormatter?: (v: number) => string;
}

export function ScatterChart({
  groups,
  xKey,
  yKey,
  sizeKey,
  xLabel,
  yLabel,
  xTickFormatter,
  yTickFormatter,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
    <RScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
      <CartesianGrid {...GRID_PROPS} vertical />
      <XAxis
        type="number"
        dataKey={xKey}
        name={xLabel}
        tickFormatter={xTickFormatter}
        {...AXIS_PROPS}
        tickLine={false}
        label={xLabel ? { value: xLabel, position: "insideBottom", offset: -8, fontSize: 11, fill: "#667085" } : undefined}
      />
      <YAxis
        type="number"
        dataKey={yKey}
        name={yLabel}
        tickFormatter={yTickFormatter}
        {...AXIS_PROPS}
        tickLine={false}
        axisLine={false}
        width={48}
      />
      {sizeKey && <ZAxis type="number" dataKey={sizeKey} range={[40, 400]} />}
      <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
      <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
      {groups.map((g) => (
        <Scatter key={g.name} name={g.name} data={g.points} fill={g.color} fillOpacity={0.7} isAnimationActive={false} />
      ))}
    </RScatterChart>
    </ResponsiveContainer>
  );
}
