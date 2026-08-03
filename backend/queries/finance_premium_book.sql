-- Premium book by month x vitality_status: gross premium (stacked area) with
-- effective discount % overlaid as a line (computed across all tiers/month).
WITH by_status AS (
  SELECT
    month_start,
    vitality_status,
    sum(gross_premium_zar) AS gross_premium_zar
  FROM {{GOLD}}.premium_book_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
  GROUP BY month_start, vitality_status
),
disc AS (
  SELECT
    month_start,
    round(100.0 * sum(discount_cost_zar) / (sum(gross_premium_zar) + sum(discount_cost_zar)), 2) AS effective_discount_pct
  FROM {{GOLD}}.premium_book_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
  GROUP BY month_start
)
SELECT b.month_start, b.vitality_status, b.gross_premium_zar, d.effective_discount_pct
FROM by_status b
JOIN disc d USING (month_start)
ORDER BY b.month_start, b.vitality_status;
