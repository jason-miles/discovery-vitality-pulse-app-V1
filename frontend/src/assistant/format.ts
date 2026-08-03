// Bridges the assistant's YFormat to the TARGET app's format helpers.
import { formatZAR, formatPct, formatInt } from "../lib/format"
import type { YFormat } from "./types"

export function formatByKind(value: number, kind: YFormat): string {
  switch (kind) {
    case "zar":
      return formatZAR(value)
    case "percent":
      return formatPct(value)
    default:
      return formatInt(value)
  }
}
