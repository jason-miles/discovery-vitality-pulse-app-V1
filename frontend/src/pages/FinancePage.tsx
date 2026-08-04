import { useChartData } from "../hooks/useChartData";
import { StatCard } from "../components/cards/StatCard";
import { InsightCard } from "../components/cards/InsightCard";
import { ChartFrame } from "../components/charts/ChartFrame";
import { BarChart } from "../components/charts/BarChart";
import { StackedAreaChart } from "../components/charts/StackedAreaChart";
import { TimeSeriesChart } from "../components/charts/TimeSeriesChart";
import { CHART, SERIES, STATUS_COLORS } from "../components/charts/chartTheme";
import { num, str, pivot, type Row } from "../lib/shape";
import { formatZAR, formatZARCompact, formatInt, formatPct, formatMonth, pctDelta } from "../lib/format";

const STATUS_ORDER = ["BLUE", "BRONZE", "SILVER", "GOLD", "DIAMOND"];
const CATEGORY_LABEL: Record<string, string> = {
  PARTNER_CASHBACK: "Partner cashback",
  ACTIVE_REWARD_REDEMPTION: "Active Rewards",
  DEVICE_SUBSIDY: "Device subsidy",
  PREMIUM_DISCOUNT: "Premium discount",
};

function RagDot({ rag }: { rag: string }) {
  const color = rag === "RED" ? CHART.alert : rag === "AMBER" ? CHART.amber : "#227C57";
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

export function FinancePage() {
  const stats = useChartData("finance_stat_cards");
  const liability = useChartData("finance_partner_liability");
  const caps = useChartData("finance_cap_utilisation");
  const mix = useChartData("finance_redemption_mix");
  const premium = useChartData("finance_premium_book");
  const lapse = useChartData("finance_lapse_watch");

  const s = (stats.data?.rows[0] ?? {}) as Row;

  // Partner liability -> stacked bar by partner over months
  const liabPivot = pivot(liability.data?.rows ?? [], "month_start", "partner_code", "total_payout_zar");
  const partners = liabPivot.series.sort();

  // Redemption mix -> stacked area by category
  const mixPivot = pivot(mix.data?.rows ?? [], "month_start", "event_category", "total_payout_zar");

  // Premium book -> stacked area by status + discount overlay
  const premRows = premium.data?.rows ?? [];
  const premByMonth = new Map<string, Row>();
  for (const r of premRows) {
    const m = str(r.month_start);
    if (!premByMonth.has(m)) premByMonth.set(m, { month_start: m, effective_discount_pct: num(r.effective_discount_pct) });
    premByMonth.get(m)![str(r.vitality_status)] = num(r.gross_premium_zar);
  }
  const premData = Array.from(premByMonth.values());

  // Lapse watch -> multi-line by status
  const lapsePivot = pivot(lapse.data?.rows ?? [], "month_start", "vitality_status", "lapse_rate_pct");

  const capRows = caps.data?.rows ?? [];

  return (
    <div className="space-y-6">
      {/* Row 1 — stat cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 lg:col-span-3">
          <StatCard index={0} label="Reward payout (MTD)" value={formatZARCompact(num(s.reward_payout))}
            delta={pctDelta(num(s.reward_payout), num(s.reward_payout_prev))} higherIsBetter={false} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard index={1} label="Premium discount cost" value={formatZARCompact(num(s.discount_cost))}
            delta={pctDelta(num(s.discount_cost), num(s.discount_cost_prev))} higherIsBetter={false} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard index={2} label="Active policies" value={formatInt(num(s.active_policies))}
            delta={pctDelta(num(s.active_policies), num(s.active_policies_prev))} />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard index={3} label="Lapse rate" value={formatPct(num(s.lapse_rate))}
            delta={pctDelta(num(s.lapse_rate), num(s.lapse_rate_prev))} higherIsBetter={false} />
        </div>
      </div>

      {/* Row 2 — partner payout liability + cap table */}
      <InsightCard
        cardId="finance_liability"
        module="finance"
        index={0}
        title="Partner payout liability"
        subtitle="Monthly payout by partner, with cap utilisation"
        insightPrompt="Summarise partner payout liability and explicitly flag any partner breaching or approaching its contracted monthly cap, with the trajectory."
        insightFallback="Most partners run comfortably below their contracted caps, but Kulula Air has breached its cap in recent months and is trending above 100% — the standout liability risk to flag at renewal."
      >
        <ChartFrame isLoading={liability.isLoading} isError={liability.isError} isEmpty={liabPivot.data.length === 0} onRetry={liability.refetch}>
          <BarChart
            data={liabPivot.data}
            categoryKey="month_start"
            series={partners.map((p, i) => ({ key: p, color: SERIES[i % SERIES.length], label: p.replace("_", " ") }))}
            stacked
            categoryFormatter={formatMonth}
            valueFormatter={(v) => formatZARCompact(v)}
          />
        </ChartFrame>
        {/* Cap-utilisation table with inline utilisation bars */}
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs text-ink/55">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Partner</th>
                <th className="px-3 py-2 text-right font-medium">MTD payout</th>
                <th className="px-3 py-2 text-right font-medium">Cap</th>
                <th className="px-3 py-2 text-left font-medium">Cap utilisation</th>
              </tr>
            </thead>
            <tbody>
              {capRows.map((r, i) => {
                const rag = str(r.rag);
                const util = num(r.cap_utilisation_pct);
                const color = rag === "RED" ? CHART.alert : rag === "AMBER" ? CHART.amber : "#227C57";
                const breached = rag === "RED";
                return (
                  <tr key={i} className={`border-t border-line ${breached ? "bg-alert/5" : ""}`}>
                    <td className="px-3 py-2 font-medium text-ink">
                      <span className="flex items-center gap-2">
                        <RagDot rag={rag} />
                        {str(r.partner_code).replace("_", " ")}
                        {breached && (
                          <span className="rounded bg-alert/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-alert">
                            over cap
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tnum text-ink/80">{formatZAR(num(r.total_payout_zar))}</td>
                    <td className="px-3 py-2 text-right tnum text-ink/60">{formatZAR(num(r.contract_cap_zar))}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, util)}%`, background: color }} />
                        </div>
                        <span className="tnum w-12 text-right text-xs font-semibold" style={{ color }}>
                          {formatPct(util)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </InsightCard>

      {/* Row 3 — redemption mix + premium book */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="finance_mix"
            module="finance"
            index={1}
            title="Redemption mix"
            subtitle="Payout by reward category over time"
            insightPrompt="Explain how the reward redemption mix has shifted over the period across categories."
            insightFallback="The redemption mix is broadly stable, with partner cashback the largest category and device subsidies a growing share over the period."
          >
            <ChartFrame isLoading={mix.isLoading} isError={mix.isError} isEmpty={mixPivot.data.length === 0} onRetry={mix.refetch}>
              <StackedAreaChart
                data={mixPivot.data}
                xKey="month_start"
                areas={mixPivot.series.map((c, i) => ({ key: c, color: SERIES[i % SERIES.length], label: CATEGORY_LABEL[c] ?? c }))}
                xTickFormatter={formatMonth}
                yTickFormatter={(v) => formatZARCompact(v)}
              />
            </ChartFrame>
          </InsightCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="finance_premium"
            module="finance"
            index={2}
            title="Premium book by status tier"
            subtitle="Gross premium with effective discount %"
            insightPrompt="Quantify premium-discount cost as a percentage of gross premium and describe its trend across the period."
            insightFallback="Gross premium is concentrated in the lower status tiers by volume, while the effective discount rate holds steady around 9% of gross premium."
          >
            <ChartFrame isLoading={premium.isLoading} isError={premium.isError} isEmpty={premData.length === 0} onRetry={premium.refetch}>
              <StackedAreaChart
                data={premData}
                xKey="month_start"
                areas={STATUS_ORDER.map((st) => ({ key: st, color: STATUS_COLORS[st], label: st.toLowerCase() }))}
                overlayLine={{ key: "effective_discount_pct", color: CHART.amber, label: "Discount %" }}
                xTickFormatter={formatMonth}
                yTickFormatter={(v) => formatZARCompact(v)}
                overlayTickFormatter={(v) => `${v}%`}
              />
            </ChartFrame>
          </InsightCard>
        </div>
      </div>

      {/* Row 4 — lapse watch */}
      <InsightCard
        cardId="finance_lapse"
        module="finance"
        index={3}
        title="Lapse watch"
        subtitle="Monthly lapse rate by status tier"
        insightPrompt="Contrast lapse rates across status tiers and note the retention value of higher tiers."
        insightFallback="Lapse rates are consistently lower in higher status tiers, underlining the retention value of moving members up the Vitality-status ladder."
      >
        <ChartFrame isLoading={lapse.isLoading} isError={lapse.isError} isEmpty={lapsePivot.data.length === 0} onRetry={lapse.refetch}>
          <TimeSeriesChart
            data={lapsePivot.data}
            xKey="month_start"
            series={STATUS_ORDER.filter((st) => lapsePivot.series.includes(st)).map((st) => ({ key: st, color: STATUS_COLORS[st], label: st.toLowerCase() }))}
            xTickFormatter={formatMonth}
            yTickFormatter={(v) => `${v}%`}
          />
        </ChartFrame>
      </InsightCard>
    </div>
  );
}
