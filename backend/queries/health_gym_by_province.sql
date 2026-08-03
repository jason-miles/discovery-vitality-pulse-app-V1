-- Gym check-ins per 1,000 active members by province (horizontal bar).
SELECT
  province,
  sum(gym_checkins)                                        AS gym_checkins,
  sum(active_members)                                      AS active_member_days,
  round(sum(gym_checkins) / (sum(active_members) / 1000.0), 1) AS checkins_per_1000
FROM {{GOLD}}.health_engagement_daily
WHERE activity_date BETWEEN :date_from AND :date_to
  AND array_contains(split(:provinces_csv, ','), province)
  AND array_contains(split(:tiers_csv, ','), engagement_tier)
GROUP BY province
ORDER BY checkins_per_1000 DESC;
