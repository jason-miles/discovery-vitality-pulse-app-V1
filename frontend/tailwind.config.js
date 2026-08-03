/** Vitality Pulse design system (PRD §5.3). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        surface: "#F7F8FA",
        card: "#FFFFFF",
        line: "#E4E7EC",
        "deep-teal": "#0B5563",
        amber: "#E8A33D",
        // supporting chart series
        "teal-mid": "#4E9BAA",
        violet: "#8A6FB8",
        alert: "#C0564F",
        // genie panel
        "genie-bg": "#F4F9F9",
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
