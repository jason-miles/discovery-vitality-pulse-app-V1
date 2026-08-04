// Shared Recharts tooltip styling — Discovery-brand, premium feel.
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid #E3E8EF",
    boxShadow: "0 8px 24px rgba(11,27,43,0.12)",
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(4px)",
  },
  labelStyle: {
    color: "#0B1B2B",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: "1px solid #EEF2F7",
  },
  itemStyle: { padding: "2px 0", fontSize: 12 },
  cursor: { fill: "rgba(0,58,93,0.06)" },
};
