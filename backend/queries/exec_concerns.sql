-- Executive "today's top concerns" — a ranked watchlist across the portfolio
-- for the latest month in range. Each row: area, title, detail, metric, status.
WITH b AS (
  SELECT max(month_start) AS m FROM {{GOLD}}.rewards_liability_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
),
-- Partners over/near their contracted cap
cap AS (
  SELECT
    'Reward liability'                                          AS area,
    partner_code                                                AS title,
    concat(partner_category, ' partner · cap ', cast(round(cap_utilisation_pct) as int), '% utilised') AS detail,
    cap_utilisation_pct                                         AS metric_value,
    concat(cast(round(cap_utilisation_pct,1) as string), '%')  AS metric_label,
    CASE WHEN cap_utilisation_pct >= 100 THEN 'RED'
         WHEN cap_utilisation_pct >= 95  THEN 'AMBER' ELSE 'GREEN' END AS status,
    cap_utilisation_pct                                         AS sort_key
  FROM {{GOLD}}.rewards_liability_monthly r, b
  WHERE r.month_start = b.m AND r.cap_utilisation_pct >= 90
),
-- Screening types with worst uptake (latest month)
scr AS (
  SELECT
    'Wellness'                                                  AS area,
    screening_type                                              AS title,
    'Screening uptake lagging portfolio'                        AS detail,
    avg(uptake_pct)                                             AS metric_value,
    concat(cast(round(avg(uptake_pct),1) as string), '% uptake') AS metric_label,
    CASE WHEN avg(uptake_pct) < 25 THEN 'RED'
         WHEN avg(uptake_pct) < 35 THEN 'AMBER' ELSE 'GREEN' END AS status,
    (100 - avg(uptake_pct))                                     AS sort_key
  FROM {{GOLD}}.screening_uptake_monthly s, b
  WHERE s.month_start = b.m
  GROUP BY screening_type
  HAVING avg(uptake_pct) < 35
),
-- Highest-lapse status tier (retention risk)
lap AS (
  SELECT
    'Retention'                                                 AS area,
    concat(vitality_status, ' tier')                            AS title,
    'Highest lapse rate among status tiers'                     AS detail,
    (sum(lapse_count) * 100.0 / sum(active_policies))           AS metric_value,
    concat(cast(round(sum(lapse_count) * 100.0 / sum(active_policies),2) as string), '% lapse') AS metric_label,
    'AMBER'                                                     AS status,
    (sum(lapse_count) * 100.0 / sum(active_policies)) * 10      AS sort_key
  FROM {{GOLD}}.premium_book_monthly p, b
  WHERE p.month_start = b.m
  GROUP BY vitality_status
  ORDER BY metric_value DESC
  LIMIT 1
)
SELECT area, title, detail, metric_label, status FROM (
  SELECT * FROM cap
  UNION ALL SELECT * FROM scr
  UNION ALL SELECT * FROM lap
) ORDER BY CASE status WHEN 'RED' THEN 0 WHEN 'AMBER' THEN 1 ELSE 2 END, sort_key DESC
LIMIT 6;
