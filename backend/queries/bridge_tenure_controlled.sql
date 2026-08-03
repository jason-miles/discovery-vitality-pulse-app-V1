-- Tenure-controlled view: avg claims cost by tier, split into tenure bands.
-- Pieter's healthy-selection check — the tier gap should persist within bands.
SELECT
  engagement_tier,
  CASE
    WHEN tenure_months < 12 THEN '<12'
    WHEN tenure_months < 24 THEN '12-24'
    ELSE '>24'
  END                                       AS tenure_band,
  round(avg(claims_paid_zar), 0)            AS avg_claims_zar,
  count(*)                                  AS member_months
FROM {{GOLD}}.bridge_member_month
WHERE month_start BETWEEN :date_from AND :date_to
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY 1, 2
ORDER BY
  array_position(array('DORMANT','LIGHT','ACTIVE','HIGHLY_ACTIVE'), engagement_tier),
  array_position(array('<12','12-24','>24'), tenure_band);
