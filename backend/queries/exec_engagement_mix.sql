-- Engagement mix over time: member share by tier (stacked area).
SELECT
  month_start,
  engagement_tier,
  members
FROM {{GOLD}}.bridge_tier_summary_monthly
WHERE month_start BETWEEN :date_from AND :date_to
ORDER BY month_start, engagement_tier;
