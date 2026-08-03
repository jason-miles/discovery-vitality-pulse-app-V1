// Single source of chart colours (PRD §5.3).
export const CHART = {
  ink: "#101828",
  line: "#E4E7EC",
  deepTeal: "#0B5563",
  amber: "#E8A33D",
  tealMid: "#4E9BAA",
  violet: "#8A6FB8",
  alert: "#C0564F",
  axis: "#667085",
};

// Ordered series palette for generic multi-series charts.
export const SERIES = [CHART.deepTeal, CHART.amber, CHART.tealMid, CHART.violet, CHART.alert];

// Engagement-tier ramp: DORMANT -> HIGHLY_ACTIVE (PRD §5.3).
export const TIER_COLORS: Record<string, string> = {
  DORMANT: "#CBD5E1",
  LIGHT: "#94B8C2",
  ACTIVE: "#4E9BAA",
  HIGHLY_ACTIVE: "#0B5563",
};

// Vitality status ramp (blue -> diamond) reuses cool tones.
export const STATUS_COLORS: Record<string, string> = {
  BLUE: "#94A3B8",
  BRONZE: "#C08457",
  SILVER: "#9CA3AF",
  GOLD: "#E8A33D",
  DIAMOND: "#0B5563",
};

export const AXIS_PROPS = {
  stroke: CHART.axis,
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
};

export const GRID_PROPS = {
  stroke: CHART.line,
  strokeDasharray: "3 3",
  vertical: false,
};
