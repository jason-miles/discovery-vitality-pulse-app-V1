import { create } from "zustand";

// Collects the latest rendered insight text per card, so the Bridge
// "Copy executive summary" button can concatenate them (PRD §4.4).
interface InsightRegistry {
  texts: Record<string, { title: string; text: string }>;
  register: (cardId: string, title: string, text: string) => void;
}

export const useInsightRegistry = create<InsightRegistry>((set) => ({
  texts: {},
  register: (cardId, title, text) =>
    set((s) => ({ texts: { ...s.texts, [cardId]: { title, text } } })),
}));
