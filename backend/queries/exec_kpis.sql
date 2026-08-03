-- Executive morning-brief KPIs (portfolio-level, latest month in range vs prior).
-- Blends the shared-value P&L headline with growth, risk and liability metrics
-- the CEO / CRO / CFO care about.
WITH tier AS (
  SELECT * FROM {{GOLD}}.bridge_tier_summary_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
),
prem AS (
  SELECT * FROM {{GOLD}}.premium_book_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
),
liab AS (
  SELECT * FROM {{GOLD}}.rewards_liability_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
),
b AS (SELECT max(month_start) AS m FROM tier)
SELECT
  -- CFO: net value per member (weighted), latest vs prior month
  (SELECT round(sum(net_value_per_member_zar * members) / sum(members))
     FROM tier, b WHERE month_start = m)                                       AS net_value_pm,
  (SELECT round(sum(net_value_per_member_zar * members) / sum(members))
     FROM tier, b WHERE month_start = add_months(m, -1))                       AS net_value_pm_prev,
  -- CFO: portfolio loss ratio (claims / premium), latest vs prior
  (SELECT round(100.0 * sum(avg_claims_zar_pm * members) / sum(avg_premium_zar_pm * members), 1)
     FROM tier, b WHERE month_start = m)                                       AS loss_ratio,
  (SELECT round(100.0 * sum(avg_claims_zar_pm * members) / sum(avg_premium_zar_pm * members), 1)
     FROM tier, b WHERE month_start = add_months(m, -1))                       AS loss_ratio_prev,
  -- CFO: reward payout liability (MTD) latest vs prior
  (SELECT round(sum(total_payout_zar)) FROM liab, b WHERE month_start = m)     AS reward_payout,
  (SELECT round(sum(total_payout_zar)) FROM liab, b WHERE month_start = add_months(m,-1)) AS reward_payout_prev,
  -- CRO: engaged share (% of members in ACTIVE or HIGHLY_ACTIVE), latest vs prior
  (SELECT round(100.0 * sum(CASE WHEN engagement_tier IN ('ACTIVE','HIGHLY_ACTIVE') THEN members END) / sum(members), 1)
     FROM tier, b WHERE month_start = m)                                       AS engaged_pct,
  (SELECT round(100.0 * sum(CASE WHEN engagement_tier IN ('ACTIVE','HIGHLY_ACTIVE') THEN members END) / sum(members), 1)
     FROM tier, b WHERE month_start = add_months(m,-1))                        AS engaged_pct_prev,
  -- CRO: portfolio lapse rate, latest vs prior
  (SELECT round(sum(lapse_count) * 100.0 / sum(active_policies), 2) FROM prem, b WHERE month_start = m)              AS lapse_rate,
  (SELECT round(sum(lapse_count) * 100.0 / sum(active_policies), 2) FROM prem, b WHERE month_start = add_months(m,-1)) AS lapse_rate_prev,
  -- CEO scale: total members + gross premium book (annualised run-rate)
  (SELECT sum(members) FROM tier, b WHERE month_start = m)                     AS total_members,
  (SELECT round(sum(gross_premium_zar) * 12) FROM prem, b WHERE month_start = m) AS gross_premium_annual,
  -- liability watch: partners breaching cap this month
  (SELECT count(*) FROM liab, b WHERE month_start = m AND cap_utilisation_pct >= 100) AS cap_breaches,
  (SELECT max(month_start) FROM tier)                                          AS as_of_month;
