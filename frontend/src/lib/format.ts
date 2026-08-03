// SA formatting conventions (PRD §5.2): R 1 234 567 (space thousands),
// percentages 1 decimal, dates dd MMM yyyy.

const NBSP = " ";

export function formatZAR(value: number | null | undefined, decimals = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = value.toFixed(decimals);
  const [intPart, decPart] = rounded.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `R${NBSP}${grouped}${decPart ? "." + decPart : ""}`;
}

export function formatZARCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R${NBSP}${(value / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `R${NBSP}${(value / 1_000).toFixed(0)}k`;
  return formatZAR(value);
}

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-ZA").replace(/,/g, NBSP);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatMonth(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

// Delta helpers for stat cards
export function pctDelta(cur: number, prev: number): number | null {
  if (prev == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}
