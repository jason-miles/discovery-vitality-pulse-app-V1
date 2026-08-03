import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { GenieDrawer } from "./components/layout/GenieDrawer";
import type { Module } from "./api/client";
import { formatDate } from "./lib/format";

// Route-level code splitting: each page is its own chunk, so the initial load
// only pulls the landing page (and Recharts only loads for chart pages).
const MorningBriefPage = lazy(() => import("./pages/MorningBriefPage").then((m) => ({ default: m.MorningBriefPage })));
const HealthPage = lazy(() => import("./pages/HealthPage").then((m) => ({ default: m.HealthPage })));
const FinancePage = lazy(() => import("./pages/FinancePage").then((m) => ({ default: m.FinancePage })));
const BridgePage = lazy(() => import("./pages/BridgePage").then((m) => ({ default: m.BridgePage })));
const GeniePage = lazy(() => import("./pages/GeniePage").then((m) => ({ default: m.GeniePage })));
const ArchitecturePage = lazy(() => import("./pages/ArchitecturePage").then((m) => ({ default: m.ArchitecturePage })));
const BusinessOverviewPage = lazy(() => import("./pages/BusinessOverviewPage").then((m) => ({ default: m.BusinessOverviewPage })));

interface ModuleMeta {
  module: Module;
  title: string;
  subtitle: string;
  showTiers: boolean;
}

const META: Record<string, ModuleMeta> = {
  "/brief": {
    module: "bridge",
    title: "GM Morning Brief",
    subtitle: "Executive KPI summary — the shared-value portfolio at a glance.",
    showTiers: false,
  },
  "/health": {
    module: "health",
    title: "Health & Wellness",
    subtitle: "Member engagement, screenings and activity — weekly, not quarterly.",
    showTiers: true,
  },
  "/finance": {
    module: "finance",
    title: "Rewards & Premiums",
    subtitle: "Partner payout liability, premium book and retention.",
    showTiers: false,
  },
  "/bridge": {
    module: "bridge",
    title: "The Bridge",
    subtitle: "Where wellness behaviour meets financial outcomes.",
    showTiers: true,
  },
  "/genie": {
    module: "bridge",
    title: "Ask Genie",
    subtitle: "Natural-language analytics across all three modules.",
    showTiers: false,
  },
  "/architecture": {
    module: "bridge",
    title: "Architecture",
    subtitle: "How Vitality Pulse is built on the Databricks Data Intelligence Platform.",
    showTiers: false,
  },
  "/business": {
    module: "bridge",
    title: "Business Overview",
    subtitle: "The business context and value behind Vitality Pulse.",
    showTiers: false,
  },
};

export default function App() {
  const location = useLocation();
  const [genieOpen, setGenieOpen] = useState(false);
  const [genieModule, setGenieModule] = useState<Module>("health");
  const meta = META[location.pathname] ?? META["/health"];
  const noFilters = ["/genie", "/architecture", "/business", "/brief"].includes(location.pathname);

  // Open the drawer for a specific module (used by the hub cards + top bar).
  // A preset question is seeded via sessionStorage for the drawer to pick up.
  function openGenie(module: Module, question?: string) {
    setGenieModule(module);
    if (question) sessionStorage.setItem("genie:preset", `${module}::${question}`);
    setGenieOpen(true);
  }

  // Data freshness — the gold tables refresh window end (demo static).
  const freshness = formatDate("2026-07-31");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar freshness={freshness} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          showTiers={meta.showTiers}
          showFilters={!noFilters}
          onAskGenie={() => openGenie(meta.module)}
        />
        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="route-fade mx-auto max-w-content px-8 py-6">
            <Suspense fallback={<div className="shimmer h-64 rounded-xl" aria-label="Loading" />}>
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/brief" replace />} />
              <Route path="/brief" element={<MorningBriefPage onAsk={() => openGenie("bridge")} />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/bridge" element={<BridgePage />} />
              <Route path="/genie" element={<GeniePage onAsk={openGenie} />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/business" element={<BusinessOverviewPage />} />
              <Route path="*" element={<Navigate to="/brief" replace />} />
            </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      <GenieDrawer open={genieOpen} onClose={() => setGenieOpen(false)} module={genieModule} />
    </div>
  );
}
