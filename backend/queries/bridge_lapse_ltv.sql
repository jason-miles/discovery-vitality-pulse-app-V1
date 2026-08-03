-- Lapse & lifetime value: lapse rate and net value per member by tier.
SELECT
  engagement_tier,
  round(avg(lapse_rate_pct), 2)          AS lapse_rate_pct,
  round(avg(net_value_per_member_zar))   AS net_value_per_member_zar
FROM {{GOLD}}.bridge_tier_summary_monthly
WHERE month_start BETWEEN :date_from AND :date_to
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY engagement_tier
ORDER BY array_position(array('DORMANT','LIGHT','ACTIVE','HIGHLY_ACTIVE'), engagement_tier);
