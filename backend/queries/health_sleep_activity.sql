-- Sleep & activity balance: avg sleep vs avg steps, aggregated to
-- province x tier points (never raw member rows).
SELECT
  engagement_tier,
  province,
  round(avg(avg_sleep_hours), 2)   AS avg_sleep_hours,
  round(avg(avg_steps))            AS avg_steps,
  round(avg(goal_met_pct), 1)      AS goal_met_pct,
  sum(active_members)              AS active_member_days
FROM {{GOLD}}.health_engagement_daily
WHERE activity_date BETWEEN :date_from AND :date_to
  AND array_contains(split(:provinces_csv, ','), province)
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY engagement_tier, province
ORDER BY engagement_tier, province;
