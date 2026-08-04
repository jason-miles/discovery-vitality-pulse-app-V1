import { useQuery } from "@tanstack/react-query";
import {
  Sun, Wallet, ShieldAlert, TrendingUp, ChevronRight,
  Coins, Users, Activity, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { fetchQuery, fetchExecNarrative } from "../api/client";
import { useFilterStore } from "../state/filterStore";
import { useCountUp } from "../hooks/useCountUp";
import { num, str, pivot, type Row } from "../lib/shape";
import { formatZAR, formatZARCompact, formatInt, formatPct, formatMonth } from "../lib/format";
import { CHART, TIER_COLORS, SERIES } from "../components/charts/chartTheme";
import { AXIS_PROPS, GRID_PROPS } from "../components/charts/chartTheme";
import { tooltipStyle } from "../components/charts/tooltip";

const FIXED = { date_from: "2024-08-01", date_to: "2026-07-31", provinces: [], tiers: [] };
const TIER_ORDER = ["DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"];

// A titled chart panel for the exec dashboard.
function Panel({ title, sub, children, className = "" }: {
  title: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-white p-5 shadow-card ${className}`}>
      <div className="mb-3">
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
        {sub && <p className="text-xs text-ink/50">{sub}</p>}
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </div>
  );
}

// A KPI tile: label, animated value, sub, and a delta chip vs prior month.
// Pass raw + fmt to get a count-up animation; or value for a static string.
function Kpi({ icon: Icon, label, value, raw, fmt, sub, delta, higherIsBetter = true }: {
  icon: typeof Wallet; label: string; value?: string; raw?: number; fmt?: (n: number) => string;
  sub: string; delta?: number | null; higherIsBetter?: boolean;
}) {
  const good = delta == null || delta === 0 ? null : higherIsBetter ? delta > 0 : delta < 0;
  const animated = useCountUp(raw ?? 0);
  const display = raw != null && fmt ? fmt(animated) : value;
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink/45">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="tnum font-display text-[32px] font-bold leading-none text-deep-teal">{display}</div>
        {delta != null && delta !== 0 && (
          <span className={`mb-1 tnum text-xs font-semibold ${good ? "text-[#227C57]" : "text-alert"}`}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-ink/50">{sub}</div>
    </div>
  );
}

const STATUS_DOT: Record<string, string> = { RED: "#C0564F", AMBER: "#E8A33D", GREEN: "#227C57" };

export function MorningBriefPage({ onAsk }: { onAsk?: () => void }) {
  // Exec brief is portfolio-wide and time-fixed (ignores page filters).
  const kpis = useQuery({ queryKey: ["exec_kpis"], queryFn: () => fetchQuery("exec_kpis", FIXED), staleTime: 6e5 });
  const concerns = useQuery({ queryKey: ["exec_concerns"], queryFn: () => fetchQuery("exec_concerns", FIXED), staleTime: 6e5 });
  const trend = useQuery({ queryKey: ["exec_trend"], queryFn: () => fetchQuery("exec_trend", FIXED), staleTime: 6e5 });
  const mix = useQuery({ queryKey: ["exec_mix"], queryFn: () => fetchQuery("exec_engagement_mix", FIXED), staleTime: 6e5 });
  const valueLoop = useQuery({ queryKey: ["exec_valueloop"], queryFn: () => fetchQuery("bridge_value_loop", FIXED), staleTime: 6e5 });
  const payout = useQuery({ queryKey: ["exec_payout"], queryFn: () => fetchQuery("finance_cap_utilisation", FIXED), staleTime: 6e5 });
  const narrative = useQuery({ queryKey: ["exec_narrative"], queryFn: fetchExecNarrative, staleTime: 6e5, retry: false });
  // touch the store so the page re-renders consistently with the rest of the app
  useFilterStore();

  // Shaped chart data
  const trendData = (trend.data?.rows ?? []).map((r) => ({
    month_start: str(r.month_start), net: num(r.net_value_pm),
    loss: num(r.loss_ratio_pct), reward: num(r.reward_cost_pm),
  }));
  const mixPivot = pivot(mix.data?.rows ?? [], "month_start", "engagement_tier", "members");
  const loopData = (valueLoop.data?.rows ?? []).map((r) => ({
    tier: str(r.engagement_tier).replace("_", " ").toLowerCase(),
    net: num(r.net_value_per_member_zar), claims: num(r.avg_claims_zar_pm),
  }));
  const payoutData = (payout.data?.rows ?? []).map((r) => ({
    name: str(r.partner_code).replace("_", " "), value: num(r.total_payout_zar),
  }));

  const k = (kpis.data?.rows[0] ?? {}) as Row;
  const rows = concerns.data?.rows ?? [];

  const asOf = k.as_of_month
    ? new Date(str(k.as_of_month)).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const pct = (cur: unknown, prev: unknown) => {
    const c = num(cur), p = num(prev);
    return p ? ((c - p) / p) * 100 : null;
  };

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold text-deep-teal">
          <Sun className="h-7 w-7 text-amber" />
          Good morning — Discovery Vitality
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Shared-value portfolio · South Africa · executive brief as at {asOf || "latest close"}
        </p>
      </div>

      {/* AI morning narrative — generated live from the KPI data */}
      <div className="card-in rounded-xl border-l-[4px] border-amber bg-genie-bg p-5 shadow-card">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-deep-teal">
          <Sparkles className="h-3.5 w-3.5 text-amber" /> Your morning brief
          {narrative.data?.source === "computed" && (
            <span className="ml-1 text-[11px] font-normal text-ink/40">· computed summary</span>
          )}
        </div>
        {narrative.isLoading ? (
          <div className="space-y-2">
            <div className="shimmer h-3.5 w-full rounded" />
            <div className="shimmer h-3.5 w-[85%] rounded" />
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed text-ink/85">
            {narrative.data?.text ?? "Portfolio summary unavailable."}
          </p>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={Coins} label="Net value / member" raw={num(k.net_value_pm)} fmt={(n) => formatZAR(n)}
            sub="premium − claims − rewards − discount, pm"
            delta={pct(k.net_value_pm, k.net_value_pm_prev)} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={ShieldAlert} label="Portfolio loss ratio" raw={num(k.loss_ratio)} fmt={(n) => formatPct(n)}
            sub="claims ÷ premium" delta={pct(k.loss_ratio, k.loss_ratio_prev)} higherIsBetter={false} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={Activity} label="Engaged members" raw={num(k.engaged_pct)} fmt={(n) => formatPct(n)}
            sub="in ACTIVE or HIGHLY_ACTIVE" delta={pct(k.engaged_pct, k.engaged_pct_prev)} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={TrendingUp} label="Lapse rate" raw={num(k.lapse_rate)} fmt={(n) => formatPct(n)}
            sub="monthly, portfolio" delta={pct(k.lapse_rate, k.lapse_rate_prev)} higherIsBetter={false} />
        </div>
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={Wallet} label="Reward payout (MTD)" value={formatZARCompact(num(k.reward_payout))}
            sub="all partners" delta={pct(k.reward_payout, k.reward_payout_prev)} higherIsBetter={false} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={Coins} label="Premium book" value={formatZARCompact(num(k.gross_premium_annual))}
            sub="annualised run-rate" />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={Users} label="Members" value={formatInt(num(k.total_members))} sub="active in portfolio" />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <Kpi icon={AlertTriangle} label="Cap breaches" value={formatInt(num(k.cap_breaches))}
            sub="partners over contracted cap" delta={null} />
        </div>
      </div>

      {/* Analytics — graphical exec views */}
      <div className="grid grid-cols-12 gap-4">
        {/* Headline combo: net value + loss ratio trend */}
        <Panel className="col-span-12 lg:col-span-8" title="Shared-value trend"
          sub="Net value per member (bars) vs portfolio loss ratio (line), monthly">
          <ComposedChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="nvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.deepTeal} stopOpacity={0.9} />
                <stop offset="100%" stopColor={CHART.deepTeal} stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month_start" tickFormatter={formatMonth} {...AXIS_PROPS} tickLine={false} interval={2} />
            <YAxis yAxisId="l" tickFormatter={(v) => formatZAR(v)} {...AXIS_PROPS} tickLine={false} axisLine={false} width={52} />
            <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => `${v}%`} {...AXIS_PROPS} tickLine={false} axisLine={false} width={40} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
            <Bar yAxisId="l" dataKey="net" name="Net value / member" fill="url(#nvGrad)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line yAxisId="r" dataKey="loss" name="Loss ratio %" stroke={CHART.amber} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </Panel>

        {/* Reward payout by partner — donut */}
        <Panel className="col-span-12 lg:col-span-4" title="Reward payout mix"
          sub="Latest month, by partner">
          <PieChart>
            <Tooltip {...tooltipStyle} formatter={(v: number) => formatZARCompact(v)} />
            <Pie data={payoutData} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={48} outerRadius={80} paddingAngle={2} isAnimationActive={false}>
              {payoutData.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Inter" }} />
          </PieChart>
        </Panel>

        {/* Engagement mix stacked area */}
        <Panel className="col-span-12 lg:col-span-7" title="Engagement mix over time"
          sub="Member count by engagement tier">
          <ComposedChart data={mixPivot.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month_start" tickFormatter={formatMonth} {...AXIS_PROPS} tickLine={false} interval={2} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} {...AXIS_PROPS} tickLine={false} axisLine={false} width={40} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
            {TIER_ORDER.filter((t) => mixPivot.series.includes(t)).map((t) => (
              <Area key={t} type="monotone" dataKey={t} name={t.replace("_", " ").toLowerCase()}
                stackId="1" stroke={TIER_COLORS[t]} fill={TIER_COLORS[t]} fillOpacity={0.85} isAnimationActive={false} />
            ))}
          </ComposedChart>
        </Panel>

        {/* Net value by tier — bar */}
        <Panel className="col-span-12 lg:col-span-5" title="Net value by engagement tier"
          sub="Where the shared-value surplus peaks">
          <ComposedChart data={loopData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="tier" {...AXIS_PROPS} tickLine={false} />
            <YAxis tickFormatter={(v) => formatZAR(v)} {...AXIS_PROPS} tickLine={false} axisLine={false} width={52} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => formatZAR(v)} />
            <Bar dataKey="net" name="Net value / member" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {loopData.map((d, i) => (
                <Cell key={i} fill={d.tier === "active" ? CHART.deepTeal : CHART.tealMid} />
              ))}
            </Bar>
          </ComposedChart>
        </Panel>
      </div>

      {/* Today's top concerns */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-deep-teal">
          <AlertTriangle className="h-5 w-5 text-amber" /> Today's top concerns
        </h2>
        <div className="space-y-2.5">
          {concerns.isLoading && [0, 1, 2].map((i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 shadow-card"
              style={{ borderLeft: `4px solid ${STATUS_DOT[str(r.status)] ?? "#E4E7EC"}` }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{str(r.area)}</span>
                  <span className="font-display text-[15px] font-semibold text-ink">{str(r.title).replace(/_/g, " ")}</span>
                </div>
                <div className="mt-0.5 text-sm text-ink/55">{str(r.detail)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="tnum text-sm font-bold" style={{ color: STATUS_DOT[str(r.status)] }}>
                  {str(r.metric_label)}
                </span>
                <ChevronRight className="h-4 w-4 text-ink/30" />
              </div>
            </div>
          ))}
          {!concerns.isLoading && rows.length === 0 && (
            <div className="rounded-xl border border-line bg-[#F1FAF4] px-5 py-4 text-sm text-[#227C57]">
              No red or amber concerns across the portfolio today.
            </div>
          )}
        </div>
      </div>

      {/* Footer note + Genie CTA */}
      <div className="flex items-center justify-between rounded-xl border-l-[3px] border-deep-teal bg-genie-bg px-5 py-3">
        <p className="text-sm text-ink/60">
          Generated from live Unity Catalog gold tables. Drill into any module for detail, or ask Genie for the story behind a number.
        </p>
        {onAsk && (
          <button onClick={onAsk}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-deep-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-deep-teal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40">
            <Sparkles className="h-4 w-4 text-amber" /> Ask the Pulse Assistant
          </button>
        )}
      </div>
    </div>
  );
}
