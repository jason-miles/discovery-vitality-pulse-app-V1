-- Cap-utilisation table for the latest month in range (partner, payout, cap,
-- utilisation %, RAG). The seeded KULULA_AIR breach surfaces here.
WITH bounds AS (
  SELECT max(month_start) AS m_max
  FROM {{GOLD}}.rewards_liability_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
)
SELECT
  r.partner_code,
  r.partner_category,
  r.total_payout_zar,
  r.contract_cap_zar,
  r.cap_utilisation_pct,
  CASE
    WHEN r.cap_utilisation_pct >= 100 THEN 'RED'
    WHEN r.cap_utilisation_pct >= 95  THEN 'AMBER'
    ELSE 'GREEN'
  END AS rag
FROM {{GOLD}}.rewards_liability_monthly r, bounds
WHERE r.month_start = bounds.m_max
ORDER BY r.cap_utilisation_pct DESC;
