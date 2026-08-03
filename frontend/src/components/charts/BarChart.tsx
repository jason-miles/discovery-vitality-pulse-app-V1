import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AXIS_PROPS, GRID_PROPS, CHART } from "./chartTheme";
import { tooltipStyle } from "./tooltip";

interface Series {
  key: string;
  color: string;
  label?: string;
}

interface Props {
  data: Record<string, unknown>[];
  categoryKey: string;
  series: Series[];
  layout?: "horizontal" | "vertical";
  /** Stack all series into one bar per category. */
  stacked?: boolean;
  /** For single-series charts, colour each bar via this map keyed on category. */
  colorByCategory?: Record<string, string>;
  valueFormatter?: (v: number) => string;
  categoryFormatter?: (v: string) => string;
}

export function BarChart({
  data,
  categoryKey,
  series,
  layout = "horizontal",
  stacked = false,
  colorByCategory,
  valueFormatter,
  categoryFormatter,
}: Props) {
  const vertical = layout === "vertical"; // bars run left-to-right

  return (
    <ResponsiveContainer width="100%" height="100%">
    <RBarChart
      data={data}
      layout={vertical ? "vertical" : "horizontal"}
      margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
      barCategoryGap="25%"
    >
      <CartesianGrid {...GRID_PROPS} vertical={vertical} horizontal={!vertical} />
      {vertical ? (
        <>
          <XAxis type="number" tickFormatter={valueFormatter} {...AXIS_PROPS} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey={categoryKey}
            tickFormatter={categoryFormatter}
            {...AXIS_PROPS}
            tickLine={false}
            axisLine={false}
            width={110}
          />
        </>
      ) : (
        <>
          <XAxis dataKey={categoryKey} tickFormatter={categoryFormatter} {...AXIS_PROPS} tickLine={false} />
          <YAxis tickFormatter={valueFormatter} {...AXIS_PROPS} tickLine={false} axisLine={false} width={44} />
        </>
      )}
      <Tooltip {...tooltipStyle} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />}
      {series.map((s) => (
        <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={s.color} isAnimationActive={false} stackId={stacked ? "stack" : undefined} radius={stacked ? undefined : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
          {colorByCategory &&
            data.map((row, i) => (
              <Cell
                key={i}
                fill={colorByCategory[String(row[categoryKey])] ?? s.color ?? CHART.deepTeal}
              />
            ))}
        </Bar>
      ))}
    </RBarChart>
    </ResponsiveContainer>
  );
}
