-- "Behaviour precedes risk" cohort view.
-- Identify members who transitioned LIGHT -> ACTIVE within the window (their
-- tier changes across months), then index average claims cost by months
-- relative to that transition, vs a matched non-transition (steady-LIGHT)
-- cohort. Cohort-level only; aggregated server-side.
WITH member_tier AS (
  SELECT member_id, month_start, engagement_tier, claims_paid_zar,
         min(CASE WHEN engagement_tier = 'ACTIVE' THEN month_start END)
           OVER (PARTITION BY member_id)                        AS first_active_month,
         min(CASE WHEN engagement_tier = 'LIGHT' THEN month_start END)
           OVER (PARTITION BY member_id)                        AS first_light_month,
         size(collect_set(engagement_tier)
           OVER (PARTITION BY member_id))                       AS tier_variety
  FROM {{GOLD}}.bridge_member_month
  WHERE month_start BETWEEN :date_from AND :date_to
),
movers AS (   -- were LIGHT before they were ACTIVE
  SELECT member_id, month_start, claims_paid_zar, first_active_month,
         CAST(months_between(month_start, first_active_month) AS INT) AS rel_month
  FROM member_tier
  WHERE first_active_month IS NOT NULL
    AND first_light_month IS NOT NULL
    AND first_light_month < first_active_month
),
steady AS (   -- stayed LIGHT throughout (never varied), used as control
  SELECT member_id, month_start, claims_paid_zar
  FROM member_tier
  WHERE tier_variety = 1 AND engagement_tier = 'LIGHT'
),
steady_baseline AS (SELECT round(avg(claims_paid_zar), 0) AS baseline FROM steady)
SELECT rel_month,
       round(avg(m.claims_paid_zar), 0)          AS mover_claims_zar,
       (SELECT baseline FROM steady_baseline)    AS steady_light_claims_zar,
       count(*)                                  AS member_months
FROM movers m
WHERE rel_month BETWEEN -6 AND 6
GROUP BY rel_month
ORDER BY rel_month;
