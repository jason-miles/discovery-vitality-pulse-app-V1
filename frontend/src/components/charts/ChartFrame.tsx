import { ReactNode } from "react";

interface Props {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  height?: number;
  onRetry?: () => void;
  children: ReactNode;
}

// Wraps every chart with consistent loading / empty / error states (PRD §5.5).
export function ChartFrame({
  isLoading,
  isError,
  isEmpty,
  height = 280,
  onRetry,
  children,
}: Props) {
  if (isLoading) {
    return (
      <div className="shimmer rounded-lg" style={{ height }} aria-busy="true" aria-label="Loading chart" />
    );
  }
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg bg-surface text-sm text-ink/50"
        style={{ height }}
      >
        <span>Couldn't load this view.</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md border border-line px-3 py-1 text-xs hover:border-deep-teal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-surface text-sm text-ink/40"
        style={{ height }}
      >
        No data for the selected filters
      </div>
    );
  }
  // Each chart wrapper renders its own ResponsiveContainer (so the container's
  // direct child is a real Recharts chart, which it needs to inject size into).
  return <div style={{ height }}>{children}</div>;
}
