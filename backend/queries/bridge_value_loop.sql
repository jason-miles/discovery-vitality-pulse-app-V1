-- Hero "value loop": per engagement tier, avg claims (bars), avg rewards cost
-- (line), and net value per member (label). Averaged across months in range.
SELECT
  engagement_tier,
  round(avg(avg_claims_zar_pm))         AS avg_claims_zar_pm,
  round(avg(avg_rewards_cost_zar_pm))   AS avg_rewards_cost_zar_pm,
  round(avg(avg_premium_zar_pm))        AS avg_premium_zar_pm,
  round(avg(net_value_per_member_zar))  AS net_value_per_member_zar,
  round(avg(loss_ratio_pct), 1)         AS loss_ratio_pct
FROM {{GOLD}}.bridge_tier_summary_monthly
WHERE month_start BETWEEN :date_from AND :date_to
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY engagement_tier
ORDER BY array_position(array('DORMANT','LIGHT','ACTIVE','HIGHLY_ACTIVE'), engagement_tier);
