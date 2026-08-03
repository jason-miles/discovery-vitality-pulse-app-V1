-- Claims frequency vs engagement: aggregate member-month to
-- (goal_met bucket) points; never plot raw members. Point size = members.
SELECT
  CAST(floor(goal_met_pct / 10) * 10 AS INT)                 AS goal_met_bucket,
  engagement_tier,
  round(count(*) / 1000.0, 2)                                AS members_k,
  round(1000.0 * sum(claims_count) / count(*), 1)            AS claims_frequency_per_1000,
  round(avg(claims_paid_zar), 0)                             AS avg_claims_zar
FROM {{GOLD}}.bridge_member_month
WHERE month_start BETWEEN :date_from AND :date_to
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY 1, 2
HAVING count(*) > 50
ORDER BY 1, 2;
