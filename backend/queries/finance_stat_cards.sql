-- Finance stat cards: latest-month totals with prior-month deltas.
-- Reward payout & premium/discount come from their own gold tables.
WITH liab AS (
  SELECT month_start, sum(total_payout_zar) AS payout
  FROM {{GOLD}}.rewards_liability_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
  GROUP BY month_start
),
prem AS (
  SELECT month_start,
         sum(gross_premium_zar)  AS gross_premium,
         sum(discount_cost_zar)  AS discount_cost,
         sum(active_policies)    AS active_policies,
         sum(lapse_count)        AS lapse_count
  FROM {{GOLD}}.premium_book_monthly
  WHERE month_start BETWEEN :date_from AND :date_to
  GROUP BY month_start
),
bounds AS (SELECT max(month_start) AS m_max FROM prem)
SELECT
  (SELECT payout FROM liab, bounds WHERE month_start = m_max)                       AS reward_payout,
  (SELECT payout FROM liab, bounds WHERE month_start = add_months(m_max, -1))       AS reward_payout_prev,
  (SELECT discount_cost FROM prem, bounds WHERE month_start = m_max)                AS discount_cost,
  (SELECT discount_cost FROM prem, bounds WHERE month_start = add_months(m_max,-1)) AS discount_cost_prev,
  (SELECT active_policies FROM prem, bounds WHERE month_start = m_max)              AS active_policies,
  (SELECT active_policies FROM prem, bounds WHERE month_start = add_months(m_max,-1)) AS active_policies_prev,
  (SELECT round(100.0 * lapse_count / active_policies, 2) FROM prem, bounds WHERE month_start = m_max)              AS lapse_rate,
  (SELECT round(100.0 * lapse_count / active_policies, 2) FROM prem, bounds WHERE month_start = add_months(m_max,-1)) AS lapse_rate_prev;
