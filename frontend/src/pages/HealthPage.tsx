import { useChartData } from "../hooks/useChartData";
import { StatCard } from "../components/cards/StatCard";
import { InsightCard } from "../components/cards/InsightCard";
import { ChartFrame } from "../components/charts/ChartFrame";
import { TimeSeriesChart } from "../components/charts/TimeSeriesChart";
import { BarChart } from "../components/charts/BarChart";
import { ScatterChart } from "../components/charts/ScatterChart";
import { CHART, TIER_COLORS } from "../components/charts/chartTheme";
import { num, str, pivot, type Row } from "../lib/shape";
import { formatInt, formatPct, formatMonth, pctDelta } from "../lib/format";

const TIER_ORDER = ["DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"];
const PROV_LABEL: Record<string, string> = {
  GAUTENG: "Gauteng", WESTERN_CAPE: "W. Cape", KWAZULU_NATAL: "KZN",
  EASTERN_CAPE: "E. Cape", FREE_STATE: "Free State", OTHER: "Other",
};

export function HealthPage() {
  const stats = useChartData("health_stat_cards");
  const engagement = useChartData("health_engagement_over_time");
  const gym = useChartData("health_gym_by_province");
  const screening = useChartData("health_screening_uptake");
  const sleep = useChartData("health_sleep_activity");

  const s = (stats.data?.rows[0] ?? {}) as Row;

  // --- Engagement over time: pivot to wide, one line per tier ---
  const engPivot = pivot(engagement.data?.rows ?? [], "week_start", "engagement_tier", "goal_met_pct");
  const engSeries = TIER_ORDER.filter((t) => engPivot.series.includes(t)).map((t) => ({
    key: t, color: TIER_COLORS[t], label: t.replace("_", " ").toLowerCase(),
  }));

  // --- Gym by province ---
  const gymRows = (gym.data?.rows ?? []).map((r) => ({
    province: str(r.province), checkins_per_1000: num(r.checkins_per_1000),
  }));

  // --- Screening: current vs prior ---
  const screenRows = screening.data?.rows ?? [];

  // --- Sleep vs steps: group by tier ---
  const sleepGroups = TIER_ORDER.map((t) => ({
    name: t.replace("_", " ").toLowerCase(),
    color: TIER_COLORS[t],
    points: (sleep.data?.rows ?? [])
      .filter((r) => str(r.engagement_tier) === t)
      .map((r) => ({
        avg_sleep_hours: num(r.avg_sleep_hours),
        avg_steps: num(r.avg_steps),
        members: num(r.active_member_days),
        province: PROV_LABEL[str(r.province)] ?? str(r.province),
      })),
  })).filter((g) => g.points.length > 0);

  return (
    <div className="space-y-6">
      {/* Row 1 — stat cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 lg:col-span-3">
          <StatCard
            index={0}
            label="Active members (30d)"
            value={formatInt(num(s.active_members))}
            delta={pctDelta(num(s.active_members), num(s.active_members_prev))}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard
            index={1}
            label="Goal-met rate"
            value={formatPct(num(s.goal_met_pct))}
            delta={pctDelta(num(s.goal_met_pct), num(s.goal_met_pct_prev))}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard
            index={2}
            label="Gym check-ins (30d)"
            value={formatInt(num(s.gym_checkins))}
            delta={pctDelta(num(s.gym_checkins), num(s.gym_checkins_prev))}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatCard
            index={3}
            label="Screenings (30d)"
            value={formatInt(num(s.screenings_completed))}
            delta={pctDelta(num(s.screenings_completed), num(s.screenings_completed_prev))}
          />
        </div>
      </div>

      {/* Row 2 — engagement over time (full width) */}
      <InsightCard
        cardId="health_engagement"
        module="health"
        index={0}
        title="Engagement over time"
        subtitle="Weekly goal-met rate by engagement tier"
        insightPrompt="Summarise how goal-met rate trends differ across engagement tiers over the selected period, and call out any inflection points such as challenge-cycle drop-off."
        insightFallback="Goal-met rates separate cleanly by tier, with highly-active members sustaining the highest engagement and dormant members flat near the floor."
      >
        <ChartFrame
          isLoading={engagement.isLoading}
          isError={engagement.isError}
          isEmpty={engPivot.data.length === 0}
          onRetry={engagement.refetch}
        >
          <TimeSeriesChart
            data={engPivot.data}
            xKey="week_start"
            series={engSeries}
            xTickFormatter={formatMonth}
            yTickFormatter={(v) => `${v}%`}
            yDomain={[0, 100]}
          />
        </ChartFrame>
      </InsightCard>

      {/* Row 3 — gym by province + screening uptake */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="health_gym"
            module="health"
            index={1}
            title="Gym activity by province"
            subtitle="Check-ins per 1,000 active members"
            insightPrompt="Compare gym check-in rates across provinces and name the province leading engagement."
            insightFallback="Gym check-in rates vary across provinces; the leading province runs materially ahead of the lowest on check-ins per 1,000 members."
          >
            <ChartFrame
              isLoading={gym.isLoading}
              isError={gym.isError}
              isEmpty={gymRows.length === 0}
              onRetry={gym.refetch}
            >
              <BarChart
                data={gymRows}
                categoryKey="province"
                layout="vertical"
                series={[{ key: "checkins_per_1000", color: CHART.deepTeal, label: "per 1,000" }]}
                colorByCategory={Object.fromEntries(gymRows.map((r) => [r.province, CHART.tealMid]))}
                categoryFormatter={(v) => PROV_LABEL[v] ?? v}
                valueFormatter={(v) => v.toFixed(0)}
              />
            </ChartFrame>
          </InsightCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <InsightCard
            cardId="health_screening"
            module="health"
            index={2}
            title="Screening uptake"
            subtitle="Current vs prior quarter, by screening type"
            insightPrompt="Highlight which screening types are lagging on uptake and note the out-of-range implication for any screening whose uptake fell."
            insightFallback="Some screening types trail on uptake this quarter; HbA1c in particular is worth a targeted screening campaign given its rising out-of-range share."
          >
            <ChartFrame
              isLoading={screening.isLoading}
              isError={screening.isError}
              isEmpty={screenRows.length === 0}
              onRetry={screening.refetch}
            >
              <BarChart
                data={screenRows as Row[]}
                categoryKey="screening_type"
                series={[
                  { key: "uptake_prior", color: CHART.tealMid, label: "Prior Q" },
                  { key: "uptake_current", color: CHART.deepTeal, label: "Current Q" },
                ]}
                categoryFormatter={(v) => v.replace(/_/g, " ").replace("VITALITY ", "")}
                valueFormatter={(v) => `${v}%`}
              />
            </ChartFrame>
          </InsightCard>
        </div>
      </div>

      {/* Row 4 — sleep & activity balance */}
      <InsightCard
        cardId="health_sleep"
        module="health"
        index={3}
        title="Sleep & activity balance"
        subtitle="Average sleep vs steps, by tier and province"
        insightPrompt="Describe the relationship between average sleep and daily steps across engagement tiers, framed for a wellness-campaign audience."
        insightFallback="More engaged tiers cluster at higher step counts with broadly similar sleep, suggesting activity — not sleep — is the main differentiator of engagement."
      >
        <ChartFrame
          isLoading={sleep.isLoading}
          isError={sleep.isError}
          isEmpty={sleepGroups.length === 0}
          onRetry={sleep.refetch}
          height={320}
        >
          <ScatterChart
            groups={sleepGroups}
            xKey="avg_sleep_hours"
            yKey="avg_steps"
            sizeKey="members"
            xLabel="Avg sleep (hrs)"
            yLabel="Avg steps"
            yTickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        </ChartFrame>
      </InsightCard>
    </div>
  );
}
