import { Sparkles } from "lucide-react";
import { FilterBar } from "./FilterBar";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showTiers?: boolean;
  showFilters?: boolean;
  onAskGenie: () => void;
}

export function TopBar({ title, subtitle, showTiers = true, showFilters = true, onAskGenie }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto max-w-content px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-ink/60">{subtitle}</p>}
          </div>
          <button
            onClick={onAskGenie}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-deep-teal px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-deep-teal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
          >
            <Sparkles className="h-4 w-4 text-amber" />
            Ask the Pulse Assistant
          </button>
        </div>
        {showFilters && (
          <div className="mt-4">
            <FilterBar showTiers={showTiers} />
          </div>
        )}
      </div>
    </div>
  );
}
