/** Vitality Pulse design system (PRD §5.3). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Discovery Vitality brand palette. Class names are kept stable
      // (deep-teal = primary, amber = accent) but the VALUES are the Discovery
      // Vitality identity: Discovery blue primary + signature Vitality Pink accent.
      colors: {
        ink: "#0B1B2B", // Discovery near-navy text
        surface: "#E9EDF2", // light grey app background (cards pop against it)
        card: "#FFFFFF",
        line: "#DCE2EA", // hairline borders (slightly deeper for grey bg)
        "deep-teal": "#003A5D", // PRIMARY — Discovery blue (nav, buttons, chart series 1)
        amber: "#ED0080", // ACCENT — Vitality Pink (✦ mark, CTAs, positive pop, series 2)
        // supporting chart series
        "teal-mid": "#0E7BA8", // mid Discovery blue
        violet: "#8A6FB8",
        alert: "#C0564F",
        flow: "#227C57", // data-flow arrows / edges in the architecture diagrams
        "delta-edge": "#4E9BAA", // Delta Lake medallion-box border in topology diagrams
        // AI insight / assistant panel — soft Vitality-pink tint
        "genie-bg": "#FDEFF6",
      },
      fontFamily: {
        display: ['"Sora"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.05)",
        "card-hover": "0 4px 12px rgba(16,24,40,0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};
