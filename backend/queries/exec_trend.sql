-- Executive trend: monthly net value per member (weighted) + portfolio loss
-- ratio, across the full window. Powers the headline combo chart.
SELECT
  month_start,
  round(sum(net_value_per_member_zar * members) / sum(members))                          AS net_value_pm,
  round(100.0 * sum(avg_claims_zar_pm * members) / sum(avg_premium_zar_pm * members), 1)  AS loss_ratio_pct,
  round(sum(avg_rewards_cost_zar_pm * members) / sum(members))                            AS reward_cost_pm
FROM {{GOLD}}.bridge_tier_summary_monthly
WHERE month_start BETWEEN :date_from AND :date_to
GROUP BY month_start
ORDER BY month_start;
