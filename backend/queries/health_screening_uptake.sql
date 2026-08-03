-- Screening uptake by type: current quarter vs prior quarter (grouped bar).
-- Uses the latest month in range to define "current quarter".
WITH filtered AS (
  SELECT *
  FROM {{GOLD}}.screening_uptake_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
    AND array_contains(split(:provinces_csv, ','), province)
),
bounds AS (SELECT max(month_start) AS m_max FROM filtered)
SELECT
  screening_type,
  round(avg(CASE WHEN month_start >  add_months(m_max, -3) THEN uptake_pct END), 1) AS uptake_current,
  round(avg(CASE WHEN month_start <= add_months(m_max, -3)
                  AND month_start >  add_months(m_max, -6) THEN uptake_pct END), 1) AS uptake_prior,
  round(avg(CASE WHEN month_start >  add_months(m_max, -3) THEN out_of_range_pct END), 1) AS out_of_range_current
FROM filtered, bounds
GROUP BY screening_type
ORDER BY uptake_current DESC;
