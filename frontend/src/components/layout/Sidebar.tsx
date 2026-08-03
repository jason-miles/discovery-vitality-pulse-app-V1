import { NavLink } from "react-router-dom";
import { Activity, Wallet, GitMerge, PanelLeftClose, PanelLeft, Sparkles, Network, Briefcase, Sunrise, Bot } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { VitalityLockup } from "./Logo";

const NAV = [
  { to: "/health", label: "Health & Wellness", icon: Activity },
  { to: "/finance", label: "Rewards & Premiums", icon: Wallet },
  { to: "/bridge", label: "The Bridge", icon: GitMerge },
];

const GENIE_NAV = { to: "/genie", label: "Ask the Pulse Assistant", icon: Sparkles };

export function Sidebar({ freshness }: { freshness?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "flex flex-col border-r border-line bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* App mark — Discovery Vitality lock-up */}
      <div className="flex h-16 items-center px-4">
        <VitalityLockup collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Exec brief — top billing */}
        <NavLink
          to="/brief"
          className={({ isActive }) =>
            clsx(
              "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
              isActive ? "bg-deep-teal text-white" : "text-ink/70 hover:bg-surface hover:text-ink",
            )
          }
          title={collapsed ? "GM Morning Brief" : undefined}
        >
          <Sunrise className="h-5 w-5 shrink-0 text-amber" />
          {!collapsed && <span>GM Morning Brief</span>}
        </NavLink>
        <div className="mb-1 border-t border-line" />

        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
                isActive
                  ? "bg-deep-teal text-white"
                  : "text-ink/70 hover:bg-surface hover:text-ink",
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Secondary nav — business + Genie + architecture */}
        <div className="!mt-4 space-y-1 border-t border-line pt-4">
          <NavLink
            to="/business"
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
                isActive ? "bg-deep-teal text-white" : "text-ink/70 hover:bg-surface hover:text-ink",
              )
            }
            title={collapsed ? "Business Overview" : undefined}
          >
            <Briefcase className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Business Overview</span>}
          </NavLink>

          <NavLink
            to="/architecture"
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
                isActive ? "bg-deep-teal text-white" : "text-ink/70 hover:bg-surface hover:text-ink",
              )
            }
            title={collapsed ? "Architecture" : undefined}
          >
            <Network className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Architecture</span>}
          </NavLink>

          {/* Separator, then the two AI experiences pinned at the bottom */}
          <div className="!mt-3 space-y-1 border-t border-line pt-3">
            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
                  isActive ? "bg-deep-teal text-white" : "text-ink/70 hover:bg-surface hover:text-ink",
                )
              }
              title={collapsed ? "Pulse Assistant" : undefined}
            >
              <Bot className="h-5 w-5 shrink-0 text-amber" />
              {!collapsed && <span>Pulse Assistant</span>}
            </NavLink>

            <NavLink
              to={GENIE_NAV.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
                  isActive ? "bg-deep-teal text-white" : "text-ink/70 hover:bg-surface hover:text-ink",
                )
              }
              title={collapsed ? GENIE_NAV.label : undefined}
            >
              <GENIE_NAV.icon className="h-5 w-5 shrink-0 text-amber" />
              {!collapsed && <span>{GENIE_NAV.label}</span>}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Footer: data freshness */}
      <div className="border-t border-line px-3 py-3">
        {!collapsed && (
          <div className="mb-2 px-2 text-xs text-ink/50">
            <div className="font-medium text-ink/70">Data freshness</div>
            <div className="tnum">{freshness ?? "—"}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/60 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
