-- Health module stat cards: latest-period values + prior-period deltas.
-- Grain: single row. active_members & goal_met from the last 30 days in range;
-- gym & screenings month-to-date of the latest month in range.
WITH filtered AS (
  SELECT *
  FROM {{GOLD}}.health_engagement_daily
  WHERE activity_date BETWEEN :date_from AND :date_to
    AND array_contains(split(:provinces_csv, ','), province)
    AND array_contains(split(:tiers_csv, ','), engagement_tier)
),
bounds AS (SELECT max(activity_date) AS d_max FROM filtered),
cur AS (
  SELECT
    sum(active_members)                            AS active_members,
    round(avg(goal_met_pct), 1)                    AS goal_met_pct,
    sum(gym_checkins)                              AS gym_checkins,
    sum(screenings_completed)                     AS screenings_completed
  FROM filtered, bounds
  WHERE activity_date > date_sub(d_max, 30)
),
prev AS (
  SELECT
    sum(active_members)                            AS active_members,
    round(avg(goal_met_pct), 1)                    AS goal_met_pct,
    sum(gym_checkins)                              AS gym_checkins,
    sum(screenings_completed)                     AS screenings_completed
  FROM filtered, bounds
  WHERE activity_date > date_sub(d_max, 60)
    AND activity_date <= date_sub(d_max, 30)
)
SELECT
  cur.active_members, prev.active_members AS active_members_prev,
  cur.goal_met_pct,   prev.goal_met_pct   AS goal_met_pct_prev,
  cur.gym_checkins,   prev.gym_checkins   AS gym_checkins_prev,
  cur.screenings_completed, prev.screenings_completed AS screenings_completed_prev
FROM cur, prev;
