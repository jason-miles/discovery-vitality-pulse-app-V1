-- Engagement over time: weekly goal_met_pct by engagement_tier.
SELECT
  date_trunc('week', activity_date)              AS week_start,
  engagement_tier,
  round(avg(goal_met_pct), 1)                    AS goal_met_pct,
  round(avg(avg_steps))                          AS avg_steps
FROM {{GOLD}}.health_engagement_daily
WHERE activity_date BETWEEN :date_from AND :date_to
  AND array_contains(split(:provinces_csv, ','), province)
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY 1, 2
ORDER BY 1, 2;
