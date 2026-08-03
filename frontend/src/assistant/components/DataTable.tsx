import type { ColumnDef, Row } from "../types";
import { formatByKind } from "../format";

export function DataTable({ columns, rows }: { columns: ColumnDef[]; rows: Row[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-xs text-ink/55">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium ${c.numeric ? "text-right" : "text-left"}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => {
                const v = r[c.key];
                const txt = v == null ? "—" : c.numeric && typeof v === "number" ? formatByKind(v, c.format ?? "number") : String(v);
                return <td key={c.key} className={`px-3 py-1.5 ${c.numeric ? "text-right tnum text-ink/80" : "text-ink/70"}`}>{txt}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
