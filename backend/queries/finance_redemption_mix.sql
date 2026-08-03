-- Redemption mix over time by event_category (stacked area source).
SELECT
  month_start,
  event_category,
  sum(total_payout_zar) AS total_payout_zar
FROM {{GOLD}}.rewards_liability_monthly
WHERE month_start BETWEEN :date_from AND :date_to
GROUP BY month_start, event_category
ORDER BY month_start, event_category;
