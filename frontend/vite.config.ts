import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api to the FastAPI backend on :8000.
// Build emits to ./dist which FastAPI serves in production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Keep the small, stable framework libs in one long-cache vendor chunk.
        // Recharts is deliberately NOT forced here — with route-level lazy
        // imports it now only ships in the chart pages' own chunks, so the
        // landing page never downloads it up front.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "zustand"],
        },
      },
    },
  },
});
