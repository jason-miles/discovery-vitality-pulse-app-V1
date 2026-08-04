// Single source of chart colours — Discovery Vitality palette.
export const CHART = {
  ink: "#0B1B2B",
  line: "#E3E8EF",
  deepTeal: "#003A5D", // Discovery blue (primary)
  amber: "#ED0080", // Vitality Pink (accent)
  tealMid: "#0E7BA8",
  violet: "#8A6FB8",
  alert: "#C0564F",
  axis: "#667085",
};

// Ordered series palette for generic multi-series charts.
export const SERIES = [CHART.deepTeal, CHART.amber, CHART.tealMid, CHART.violet, "#3FB68B"];

// Engagement-tier ramp: DORMANT -> HIGHLY_ACTIVE (light blue -> Discovery blue).
export const TIER_COLORS: Record<string, string> = {
  DORMANT: "#CBD5E1",
  LIGHT: "#7FB4CE",
  ACTIVE: "#0E7BA8",
  HIGHLY_ACTIVE: "#003A5D",
};

// Vitality status ramp (blue -> diamond).
export const STATUS_COLORS: Record<string, string> = {
  BLUE: "#7FB4CE",
  BRONZE: "#C08457",
  SILVER: "#9CA3AF",
  GOLD: "#E8A33D",
  DIAMOND: "#003A5D",
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
