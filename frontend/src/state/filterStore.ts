import { create } from "zustand";

export const PROVINCES = [
  "GAUTENG", "WESTERN_CAPE", "KWAZULU_NATAL",
  "EASTERN_CAPE", "FREE_STATE", "OTHER",
] as const;

export const TIERS = ["DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"] as const;

export type Province = (typeof PROVINCES)[number];
export type Tier = (typeof TIERS)[number];

export interface FilterState {
  dateFrom: string; // ISO yyyy-mm-dd
  dateTo: string;
  provinces: Province[]; // empty = all
  tiers: Tier[]; // empty = all
  setDateRange: (from: string, to: string) => void;
  toggleProvince: (p: Province) => void;
  toggleTier: (t: Tier) => void;
  clearProvinces: () => void;
  clearTiers: () => void;
}

// Default: trailing 12 months ending at the data's max month (2026-07).
// The demo data window is 2024-08 .. 2026-07; default to the last 12 months.
const DEFAULT_TO = "2026-07-31";
const DEFAULT_FROM = "2025-08-01";

export const useFilterStore = create<FilterState>((set) => ({
  dateFrom: DEFAULT_FROM,
  dateTo: DEFAULT_TO,
  provinces: [],
  tiers: [],
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  toggleProvince: (p) =>
    set((s) => ({
      provinces: s.provinces.includes(p)
        ? s.provinces.filter((x) => x !== p)
        : [...s.provinces, p],
    })),
  toggleTier: (t) =>
    set((s) => ({
      tiers: s.tiers.includes(t)
        ? s.tiers.filter((x) => x !== t)
        : [...s.tiers, t],
    })),
  clearProvinces: () => set({ provinces: [] }),
  clearTiers: () => set({ tiers: [] }),
}));

// Serialise filters into the API payload shape + a stable hash for caching.
export interface FilterPayload {
  date_from: string;
  date_to: string;
  provinces: string[];
  tiers: string[];
}

export function toPayload(s: FilterState): FilterPayload {
  return {
    date_from: s.dateFrom,
    date_to: s.dateTo,
    provinces: s.provinces,
    tiers: s.tiers,
  };
}

export function filterHash(s: FilterState): string {
  return JSON.stringify([s.dateFrom, s.dateTo, [...s.provinces].sort(), [...s.tiers].sort()]);
}
