import { useQuery } from "@tanstack/react-query";
import { fetchInsight, type Insight, type Module } from "../api/client";
import { filterHash, useFilterStore } from "../state/filterStore";

// Fetches a Genie insight for a card, independently from the chart data so the
// chart is never blocked (PRD §4.1). Cached per (cardId, filterHash).
export function useGenieInsight(
  cardId: string,
  module: Module,
  prompt: string,
  fallback: string | null,
  enabled = true,
) {
  const filters = useFilterStore();
  const hash = filterHash(filters);
  return useQuery<Insight>({
    queryKey: ["insight", cardId, hash],
    queryFn: () => fetchInsight(module, prompt, fallback),
    enabled: enabled && !!prompt,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
