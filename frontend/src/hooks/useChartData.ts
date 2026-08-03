import { useQuery } from "@tanstack/react-query";
import { fetchQuery, type QueryResult } from "../api/client";
import { toPayload, filterHash, useFilterStore } from "../state/filterStore";

// Fetches chart data for a card's sqlKey, keyed on the current filter state.
// TanStack Query caches per (sqlKey, filterHash) for the session.
export function useChartData(sqlKey: string) {
  const filters = useFilterStore();
  const hash = filterHash(filters);
  return useQuery<QueryResult>({
    queryKey: ["query", sqlKey, hash],
    queryFn: () => fetchQuery(sqlKey, toPayload(filters)),
    staleTime: 5 * 60 * 1000,
  });
}
