import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";
import { useChartData } from "../hooks/useChartData";
import { InsightCard } from "../components/cards/InsightCard";
import { ChartFrame } from "../components/charts/ChartFrame";
import { ComboChart } from "../components/charts/ComboChart";
import { BarChart } from "../components/charts/BarChart";
import { ScatterChart } from "../components/charts/ScatterChart";
import { TimeSeriesChart } from "../components/charts/TimeSeriesChart";
import { CHART, TIER_COLORS } from "../components/charts/chartTheme";
import { useInsightRegistry } from "../state/insightRegistry";
import { num, str, type Row } from "../lib/shape";
import { formatZAR } from "../lib/format";

const TIER_ORDER = ["DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"];
const TIER_LABEL = (t: string) => t.replace("_", " ").toLowerCase();
const BRIDGE_CARDS = ["bridge_value_loop", "bridge_claims", "bridge_tenure", "bridge_lapse"];

function tierLabelRow(rows: Row[]) {
  return rows.map((r) => ({ ...r, tier_label: TIER_LABEL(str(r.engagement_tier)) }));
}

export function BridgePage() {
  const loop = useChartData("bridge_value_loop");
  const scatter = useChartData("bridge_claims_vs_engagement");
  const tenure = useChartData("bridge_tenure_controlled");
  const cohort = useChartData("bridge_behaviour_precedes");
  const lapseLtv = useChartData("bridge_lapse_ltv");

  const [copied, setCopied] = useState(false);
  const registry = useInsightRegistry((s) => s.texts);

  function copyExecSummary() {
    const parts = BRIDGE_CARDS.map((id) => registry[id]).filter(Boolean);
    const body = parts.map((p) => `${p.title}\n${p.text}`).join("\n\n");
    const text = `VITALITY PULSE — SHARED-VALUE EXECUTIVE SUMMARY\n\n${body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Hero value loop
  const loopData = tierLabelRow(loop.data?.rows ?? []);

  // Claims vs engagement scatter, grouped by tier
  const scatterGroups = TIER_ORDER.map((t) => ({
    name: TIER_LABEL(t),
    color: TIER_COLORS[t],
    points: (scatter.data?.rows ?? [])
      .filter((r) => str(r.engagement_tier) === t)
      .map((r) => ({
        goal_met_bucket: num(r.goal_met_bucket),
        claims_frequency_per_1000: num(r.claims_frequency_per_1000),
        members: num(r.members_k),
      })),
  })).filter((g) => g.points.length > 0);

  // Tenure-controlled: pivot to bands as series, tier on x
  const tenureRows = tenure.data?.rows ?? [];
  const tenureByTier = new Map<string, Row>();
  for (const r of tenureRows) {
    const t = str(r.engagement_tier);
    if (!tenureByTier.has(t)) tenureByTier.set(t, { tier_label: TIER_LABEL(t) });
    tenureByTier.get(t)![str(r.tenure_band)] = num(r.avg_claims_zar);
  }
  const tenureData = TIER_ORDER.filter((t) => tenureByTier.has(t)).map((t) => tenureByTier.get(t)!);

  // Cohort: mover vs steady over rel_month
  const cohortData = cohort.data?.rows ?? [];

  // Lapse & LTV
  const lapseData = tierLabelRow(lapseLtv.data?.rows ?? []);

  return (
    <div className="space-y-6">
      {/* Copy executive summary */}
      <div className="flex justify-end">
        <button
          onClick={copyExecSummary}
          className="flex items-center gap-2 rounded-lg border border-deep-teal/30 bg-white px-3 py-1.5 text-sm font-medium text-deep-teal shadow-card transition hover:bg-genie-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
        >
          {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy executive summary"}
        </button>
      </div>

      {/* Hero — the value loop */}
      <InsightCard
        cardId="bridge_value_loop"
        module="bridge"
        index={0}
        title="The value loop"
        subtitle="Average monthly claims, reward cost and net value per member, by engagement tier"
        insightPrompt="Quantify the claims-cost gap between DORMANT and HIGHLY_ACTIVE in Rand and percent, state net value per member for each tier, and surface the nuance that ACTIVE — not HIGHLY_ACTIVE — is the most profitable tier because reward costs climb at the top, with the implication for benefit design. Use 'associated with' rather than causal language."
        insightFallback="Highly-active members average markedly lower monthly claims than dormant members, but net value per member peaks at the ACTIVE tier — because reward and discount costs climb faster than claims fall at the very top. This suggests benefit design should protect the ACTIVE tier's economics rather than simply pushing everyone to the highest tier."
      >
        <ChartFrame isLoading={loop.isLoading} isError={loop.isError} isEmpty={loopData.length === 0} onRetry={loop.refetch} height={360}>
          <ComboChart
            data={loopData}
            xKey="tier_label"
            bars={[{ key: "avg_claims_zar_pm", color: CHART.deepTeal, label: "Avg claims / member" }]}
            lines={[{ key: "avg_rewards_cost_zar_pm", color: CHART.amber, label: "Avg reward cost" }]}
            labelKey="net_value_per_member_zar"
            labelFormatter={(v) => formatZAR(v)}
            yTickFormatter={(v) => formatZAR(v)}
            rightTickFormatter={(v) => formatZAR(v)}
          />
        </ChartFrame>
      </InsightCard>

      {/* Row 2 — claims vs engagement + tenure-controlled */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="bridge_claims"
            module="bridge"
            index={1}
            title="Claims frequency vs engagement"
            subtitle="Cohort-level; goal-met bucket vs claims per 1,000"
            insightPrompt="Describe the strength of the association between goal-met rate and claims frequency at cohort level, and caveat selection effects. Use 'associated with' not causal language."
            insightFallback="Higher goal-met buckets are associated with materially lower claims frequency at cohort level. This is a cohort-level association and may partly reflect healthy selection; the tenure-controlled view alongside tests for that."
          >
            <ChartFrame isLoading={scatter.isLoading} isError={scatter.isError} isEmpty={scatterGroups.length === 0} onRetry={scatter.refetch} height={300}>
              <ScatterChart
                groups={scatterGroups}
                xKey="goal_met_bucket"
                yKey="claims_frequency_per_1000"
                sizeKey="members"
                xLabel="Goal-met %"
                yLabel="Claims / 1,000"
                xTickFormatter={(v) => `${v}%`}
              />
            </ChartFrame>
          </InsightCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="bridge_tenure"
            module="bridge"
            index={2}
            title="Tenure-controlled view"
            subtitle="Avg claims by tier, split by tenure band"
            insightPrompt="State whether the claims gap between engagement tiers persists within tenure bands, addressing the healthy-selection concern."
            insightFallback="The claims gap between engagement tiers persists within every tenure band — attenuated but not eliminated — which argues the engagement effect is not purely healthy selection by tenure."
          >
            <ChartFrame isLoading={tenure.isLoading} isError={tenure.isError} isEmpty={tenureData.length === 0} onRetry={tenure.refetch} height={300}>
              <BarChart
                data={tenureData}
                categoryKey="tier_label"
                series={[
                  { key: "<12", color: TIER_COLORS.LIGHT, label: "<12 mo" },
                  { key: "12-24", color: TIER_COLORS.ACTIVE, label: "12–24 mo" },
                  { key: ">24", color: TIER_COLORS.HIGHLY_ACTIVE, label: ">24 mo" },
                ]}
                valueFormatter={(v) => formatZAR(v)}
              />
            </ChartFrame>
          </InsightCard>
        </div>
      </div>

      {/* Row 3 — behaviour precedes risk */}
      <InsightCard
        cardId="bridge_cohort"
        module="bridge"
        index={3}
        title="Behaviour precedes risk"
        subtitle="Indexed claims cost around a LIGHT→ACTIVE transition vs steady-LIGHT members"
        insightPrompt="Narrate the before/after change in claims cost around the engagement transition relative to the steady comparison cohort. Use 'associated with', never 'caused'."
        insightFallback="Members who moved from LIGHT to ACTIVE show claims costs that step down in the months following the transition, relative to a flat steady-LIGHT comparison cohort. The pattern is associated with the behaviour change; it is not proof of causation."
      >
        <ChartFrame isLoading={cohort.isLoading} isError={cohort.isError} isEmpty={cohortData.length === 0} onRetry={cohort.refetch} height={300}>
          <TimeSeriesChart
            data={cohortData}
            xKey="rel_month"
            series={[
              { key: "mover_claims_zar", color: CHART.deepTeal, label: "LIGHT→ACTIVE movers" },
              { key: "steady_light_claims_zar", color: CHART.violet, label: "Steady LIGHT (control)" },
            ]}
            xTickFormatter={(v) => (Number(v) === 0 ? "transition" : `${Number(v) > 0 ? "+" : ""}${v}`)}
            yTickFormatter={(v) => formatZAR(v)}
          />
        </ChartFrame>
      </InsightCard>

      {/* Row 4 — lapse & lifetime value */}
      <InsightCard
        cardId="bridge_lapse"
        module="bridge"
        index={4}
        title="Lapse & lifetime value"
        subtitle="Lapse rate vs net value per member, by tier"
        insightPrompt="Tie retention (lapse rate) to engagement and net value per member in one executive narrative."
        insightFallback="More engaged tiers combine lower lapse rates with higher net value per member, so engagement compounds retention and margin together — the core of the shared-value case for executive audiences."
      >
        <ChartFrame isLoading={lapseLtv.isLoading} isError={lapseLtv.isError} isEmpty={lapseData.length === 0} onRetry={lapseLtv.refetch} height={300}>
          <ComboChart
            data={lapseData}
            xKey="tier_label"
            bars={[{ key: "net_value_per_member_zar", color: CHART.deepTeal, label: "Net value / member" }]}
            lines={[{ key: "lapse_rate_pct", color: CHART.alert, label: "Lapse rate %" }]}
            yTickFormatter={(v) => formatZAR(v)}
            rightTickFormatter={(v) => `${v}%`}
          />
        </ChartFrame>
      </InsightCard>
    </div>
  );
}
