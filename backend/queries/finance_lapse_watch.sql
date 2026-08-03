-- Lapse rate by month x vitality_status (multi-line source).
SELECT
  month_start,
  vitality_status,
  round(100.0 * sum(lapse_count) / sum(active_policies), 2) AS lapse_rate_pct
FROM {{GOLD}}.premium_book_monthly
WHERE month_start BETWEEN :date_from AND :date_to
GROUP BY month_start, vitality_status
ORDER BY month_start, vitality_status;
