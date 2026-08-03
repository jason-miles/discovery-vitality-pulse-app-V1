// Helpers to reshape flat query rows into the structures charts expect.

export type Row = Record<string, unknown>;

export function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

export function str(v: unknown): string {
  return v == null ? "" : String(v);
}

// Pivot long rows (x, seriesKey, valueKey) into wide rows keyed by x,
// with one column per distinct series value. Used for multi-line charts.
export function pivot(
  rows: Row[],
  xKey: string,
  seriesKey: string,
  valueKey: string,
): { data: Row[]; series: string[] } {
  const byX = new Map<string, Row>();
  const series = new Set<string>();
  for (const r of rows) {
    const x = str(r[xKey]);
    const s = str(r[seriesKey]);
    series.add(s);
    if (!byX.has(x)) byX.set(x, { [xKey]: x });
    byX.get(x)![s] = num(r[valueKey]);
  }
  return { data: Array.from(byX.values()), series: Array.from(series) };
}
