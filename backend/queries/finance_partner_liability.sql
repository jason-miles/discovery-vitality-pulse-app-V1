-- Partner payout liability by month x partner (stacked bar source).
SELECT
  month_start,
  partner_code,
  partner_category,
  sum(total_payout_zar) AS total_payout_zar
FROM {{GOLD}}.rewards_liability_monthly
WHERE month_start BETWEEN :date_from AND :date_to
GROUP BY month_start, partner_code, partner_category
ORDER BY month_start, partner_code;
