import type { FilterPayload } from "../state/filterStore";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface Insight {
  text: string;
  source: "genie" | "computed" | "error";
  generated_at: string;
  cached: boolean;
}

export type Module = "health" | "finance" | "bridge";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function fetchQuery(sqlKey: string, filters: FilterPayload): Promise<QueryResult> {
  return post<QueryResult>(`/api/query/${sqlKey}`, { filters });
}

export function fetchInsight(
  module: Module,
  prompt: string,
  fallback: string | null,
): Promise<Insight> {
  return post<Insight>(`/api/insight`, { module, prompt, fallback });
}

export interface GenieSpace {
  module: Module;
  space_id: string;
  title: string;
  purpose: string;
  examples: string[];
  deep_link: string | null;
}

export interface GenieAnswer {
  text: string;
  conversation_id: string | null;
  table: { columns: string[]; rows: unknown[][] } | null;
  error: boolean;
}

export async function fetchExecNarrative(): Promise<Insight> {
  const res = await fetch("/api/exec-narrative");
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<Insight>;
}

export async function fetchGenieSpaces(): Promise<GenieSpace[]> {
  const res = await fetch("/api/genie/spaces");
  if (!res.ok) throw new Error(`${res.status}`);
  const data = (await res.json()) as { spaces: GenieSpace[] };
  return data.spaces;
}

export function askGenie(
  module: Module,
  question: string,
  conversationId: string | null,
): Promise<GenieAnswer> {
  return post<GenieAnswer>("/api/genie/ask", {
    module,
    question,
    conversation_id: conversationId,
  });
}
