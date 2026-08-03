"""
Vitality Pulse — mock data generator.

Produces the GOLD-layer tables the app and Genie query, plus the two
dimension tables, as Parquet files under ./data_out/. A companion loader
(load_to_databricks.py) creates the Delta tables in Unity Catalog from these
files.

Design decisions (see PRD §3):
  * 50,000 members, 24 months (2024-08 .. 2026-07), seed=42.
  * We generate the member x month fact (`bridge_member_month`) with the
    correlation signal embedded, then aggregate every other gold table from it
    where possible. A few tables (health_engagement_daily, screening_uptake,
    rewards_liability) are synthesised directly because their grain does not
    derive cleanly from the member-month fact — the PRD explicitly permits
    generating gold directly for v1.
  * The "correlation contract" (PRD §3.3) is embedded as tier-level means and
    verified by assertions at the end. If the signal ever drifts out of the
    contracted bands, this script fails loudly.

All monetary values are ZAR. Grain and column names match the PRD exactly.
"""

from __future__ import annotations

import os
import numpy as np
import pandas as pd

# --------------------------------------------------------------------------- #
# Constants & configuration
# --------------------------------------------------------------------------- #

SEED = 42
N_MEMBERS = 50_000
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data_out")

# 24 month-starts: 2024-08-01 .. 2026-07-01
MONTHS = pd.date_range("2024-08-01", periods=24, freq="MS")
N_MONTHS = len(MONTHS)

PROVINCES = [
    "GAUTENG", "WESTERN_CAPE", "KWAZULU_NATAL",
    "EASTERN_CAPE", "FREE_STATE", "OTHER",
]
PROVINCE_WEIGHTS = np.array([0.34, 0.22, 0.18, 0.10, 0.08, 0.08])

TIERS = ["DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"]
STATUSES = ["BLUE", "BRONZE", "SILVER", "GOLD", "DIAMOND"]
PRODUCT_LINES = ["LIFE", "HEALTH", "CAR", "HOME"]
EMPLOYER_SEGMENTS = ["CORPORATE", "SME", "INDIVIDUAL"]
RISK_BANDS = ["A_LOW", "B_MODERATE", "C_ELEVATED", "D_HIGH"]

SCREENING_TYPES = [
    "VITALITY_HEALTH_CHECK", "HBA1C", "CHOLESTEROL", "BLOOD_PRESSURE",
    "BMI", "HIV", "MAMMOGRAM", "PROSTATE",
]

# ---- Tier-level monthly economics (the correlation contract, PRD §3.3) ---- #
# Claims are frequency-driven (flat severity); higher tiers claim LESS often.
CLAIM_LAMBDA = {          # expected claims per member per month
    "DORMANT": 0.317, "LIGHT": 0.253, "ACTIVE": 0.206, "HIGHLY_ACTIVE": 0.200,
}
SEVERITY_MEAN = 6000.0    # flat mean claim severity (ZAR), right-skewed
SEVERITY_SHAPE = 1.4      # Gamma shape

PREMIUM_MEAN = {          # gross monthly premium (ZAR)
    "DORMANT": 2550, "LIGHT": 2620, "ACTIVE": 2700, "HIGHLY_ACTIVE": 2760,
}
REWARDS_MEAN = {          # rewards earned / cost to Discovery (ZAR pm)
    "DORMANT": 100, "LIGHT": 210, "ACTIVE": 350, "HIGHLY_ACTIVE": 440,
}
DISCOUNT_MEAN = {         # premium-discount cost (ZAR pm) — climbs at top
    "DORMANT": 110, "LIGHT": 220, "ACTIVE": 340, "HIGHLY_ACTIVE": 480,
}
LAPSE_MONTHLY = {         # monthly lapse hazard
    "DORMANT": 0.0090, "LIGHT": 0.0070, "ACTIVE": 0.0055, "HIGHLY_ACTIVE": 0.0045,
}
# Net value per member per month (premium - claims - rewards - discount):
#   DORMANT ~440, LIGHT ~670, ACTIVE ~775, HIGHLY_ACTIVE ~640
#   => ACTIVE is the most profitable tier (reward+discount cost eats the top).

TIER_STATUS_BIAS = {      # status distribution skews richer with engagement
    "DORMANT":       [0.55, 0.28, 0.12, 0.04, 0.01],
    "LIGHT":         [0.30, 0.34, 0.24, 0.10, 0.02],
    "ACTIVE":        [0.10, 0.24, 0.34, 0.24, 0.08],
    "HIGHLY_ACTIVE": [0.03, 0.12, 0.28, 0.35, 0.22],
}
TIER_RISK_BIAS = {        # engaged members sit in lower risk bands
    "DORMANT":       [0.15, 0.30, 0.35, 0.20],
    "LIGHT":         [0.28, 0.36, 0.26, 0.10],
    "ACTIVE":        [0.42, 0.36, 0.17, 0.05],
    "HIGHLY_ACTIVE": [0.55, 0.32, 0.11, 0.02],
}

rng = np.random.default_rng(SEED)


# --------------------------------------------------------------------------- #
# Dimensions
# --------------------------------------------------------------------------- #

def build_dim_members() -> pd.DataFrame:
    member_ids = np.array([f"MBR-{i:08d}" for i in range(1, N_MEMBERS + 1)])

    # Base engagement tier per member (the story's population mix).
    base_tier = rng.choice(TIERS, size=N_MEMBERS, p=[0.30, 0.32, 0.26, 0.12])

    province = rng.choice(PROVINCES, size=N_MEMBERS, p=PROVINCE_WEIGHTS)
    birth_year = rng.integers(1955, 2006, size=N_MEMBERS)
    gender = rng.choice(["F", "M", "X"], size=N_MEMBERS, p=[0.49, 0.49, 0.02])
    employer = rng.choice(EMPLOYER_SEGMENTS, size=N_MEMBERS, p=[0.45, 0.30, 0.25])
    product_line = rng.choice(PRODUCT_LINES, size=N_MEMBERS, p=[0.30, 0.34, 0.22, 0.14])

    # Join dates spread over the ~6 years before the window (drives tenure).
    join_offset_days = rng.integers(30, 6 * 365, size=N_MEMBERS)
    join_date = MONTHS[0] - pd.to_timedelta(join_offset_days, unit="D")

    # Status & risk band drawn conditional on base tier.
    status = np.empty(N_MEMBERS, dtype=object)
    risk_band = np.empty(N_MEMBERS, dtype=object)
    for t in TIERS:
        mask = base_tier == t
        n = int(mask.sum())
        status[mask] = rng.choice(STATUSES, size=n, p=TIER_STATUS_BIAS[t])
        risk_band[mask] = rng.choice(RISK_BANDS, size=n, p=TIER_RISK_BIAS[t])

    # OUT_OF_RANGE screening flag (~18%) with a later-chronic-claims effect,
    # plus the month the screening happened (drives the 3-9 month lag).
    out_of_range = rng.random(N_MEMBERS) < 0.18
    screening_month_idx = rng.integers(0, N_MONTHS, size=N_MEMBERS)

    df = pd.DataFrame({
        "member_id": member_ids,
        "join_date": join_date,
        "birth_year": birth_year,
        "gender": gender,
        "province": province,
        "current_vitality_status": status,
        "engagement_tier": base_tier,          # "current" tier snapshot
        "employer_segment": employer,
        # helper columns (not in PRD dim, dropped before write)
        "_product_line": product_line,
        "_risk_band": risk_band,
        "_out_of_range": out_of_range,
        "_screening_month_idx": screening_month_idx,
    })
    return df


def build_dim_partners() -> pd.DataFrame:
    rows = [
        # code, name, category, monthly_cap_zar, cofund_pct, reward_type
        ("PICKNPAY",      "Pick n Pay",      "GROCERY",  6_500_000, 25.0, "CASHBACK"),
        ("WOOLWORTHS",    "Woolworths",      "GROCERY",  5_800_000, 25.0, "CASHBACK"),
        ("DISCHEM",       "Dis-Chem",        "PHARMACY", 3_200_000, 20.0, "CASHBACK"),
        ("CLICKS",        "Clicks",          "PHARMACY", 3_000_000, 20.0, "CASHBACK"),
        ("KULULA_AIR",    "Kulula.com",      "TRAVEL",   2_000_000, 15.0, "MILES"),
        ("VIRGIN_ACTIVE", "Virgin Active",   "FITNESS",  2_600_000, 30.0, "VOUCHER"),
        ("PLANET_FITNESS","Planet Fitness",  "FITNESS",  1_800_000, 30.0, "VOUCHER"),
        ("GARMIN_STORE",  "Garmin Store",    "DEVICES",  1_500_000, 35.0, "DEVICE_SUBSIDY"),
    ]
    return pd.DataFrame(rows, columns=[
        "partner_code", "partner_name", "partner_category",
        "contract_monthly_cap_zar", "discovery_cofund_pct", "_reward_type",
    ])


# --------------------------------------------------------------------------- #
# Per-member monthly tier path (mostly sticky, with LIGHT->ACTIVE movers)
# --------------------------------------------------------------------------- #

def build_tier_paths(dim: pd.DataFrame) -> np.ndarray:
    """Return an (N_MEMBERS, N_MONTHS) array of tier strings.

    Most members keep their base tier. ~9% of LIGHT members transition to
    ACTIVE at a random month, which powers the Bridge "behaviour precedes risk"
    cohort chart (claims respond to current tier, so they fall after the move).
    """
    base = dim["engagement_tier"].to_numpy()
    paths = np.repeat(base[:, None], N_MONTHS, axis=1)

    light_idx = np.where(base == "LIGHT")[0]
    movers = rng.choice(light_idx, size=int(len(light_idx) * 0.09), replace=False)
    transition_month = rng.integers(3, N_MONTHS - 3, size=len(movers))
    for m_i, tm in zip(movers, transition_month):
        paths[m_i, tm:] = "ACTIVE"

    # record movers on the dim for the cohort table
    dim["_is_mover"] = False
    dim.loc[movers, "_is_mover"] = True
    dim["_transition_month_idx"] = -1
    dim.loc[movers, "_transition_month_idx"] = transition_month
    return paths


# --------------------------------------------------------------------------- #
# Core fact: bridge_member_month
# --------------------------------------------------------------------------- #

def build_bridge_member_month(dim: pd.DataFrame, tier_paths: np.ndarray) -> pd.DataFrame:
    n = N_MEMBERS
    member_ids = dim["member_id"].to_numpy()
    join_date = dim["join_date"].to_numpy()
    out_of_range = dim["_out_of_range"].to_numpy()
    screen_idx = dim["_screening_month_idx"].to_numpy()
    risk_band = dim["_risk_band"].to_numpy()

    # status per-member is stable in v1 (snapshot); use the dim value.
    status = dim["current_vitality_status"].to_numpy()

    frames = []
    for mi in range(N_MONTHS):
        month = MONTHS[mi]
        tier = tier_paths[:, mi]

        # tenure in months at this month_start
        tenure = ((month.year - pd.to_datetime(join_date).year) * 12
                  + (month.month - pd.to_datetime(join_date).month))
        tenure = np.clip(tenure, 0, None).astype(int)

        # vectorised tier-keyed means
        lam = np.vectorize(CLAIM_LAMBDA.get)(tier).astype(float)

        # chronic-medication lift 3-9 months after an OUT_OF_RANGE screening
        lag = mi - screen_idx
        chronic_window = out_of_range & (lag >= 3) & (lag <= 9)
        lam = lam + np.where(chronic_window, 0.11, 0.0)

        # small healthy-tenure effect (attenuates, doesn't erase, the tier gap)
        lam = lam * (1.0 - np.clip(tenure, 0, 60) / 60.0 * 0.08)

        claims_count = rng.poisson(lam)
        # severity ~ Gamma(shape, mean/shape); total = count * mean draw
        sev = rng.gamma(SEVERITY_SHAPE, SEVERITY_MEAN / SEVERITY_SHAPE, size=n)
        claims_paid = np.round(claims_count * sev, 2)

        premium = np.round(
            np.vectorize(PREMIUM_MEAN.get)(tier).astype(float)
            * rng.lognormal(0.0, 0.10, size=n), 2)
        rewards = np.round(
            np.vectorize(REWARDS_MEAN.get)(tier).astype(float)
            * rng.lognormal(0.0, 0.25, size=n), 2)
        discount = np.round(
            np.vectorize(DISCOUNT_MEAN.get)(tier).astype(float)
            * rng.lognormal(0.0, 0.15, size=n), 2)

        # engagement behaviour proxies
        goal_met = np.clip(
            np.vectorize({"DORMANT": 6, "LIGHT": 26, "ACTIVE": 55,
                          "HIGHLY_ACTIVE": 82}.get)(tier).astype(float)
            + rng.normal(0, 6, size=n), 0, 100).round(1)
        gym_visits = np.maximum(0, np.round(
            np.vectorize({"DORMANT": 0.3, "LIGHT": 2.5, "ACTIVE": 6.5,
                          "HIGHLY_ACTIVE": 12.0}.get)(tier).astype(float)
            + rng.normal(0, 1.5, size=n))).astype(int)
        screenings_ytd = np.minimum(8, rng.poisson(
            np.vectorize({"DORMANT": 0.4, "LIGHT": 1.0, "ACTIVE": 1.8,
                          "HIGHLY_ACTIVE": 2.6}.get)(tier).astype(float)))

        frames.append(pd.DataFrame({
            "member_id": member_ids,
            "month_start": month,
            "engagement_tier": tier,
            "vitality_status": status,
            "goal_met_pct": goal_met,
            "gym_visits": gym_visits,
            "screenings_ytd": screenings_ytd,
            "rewards_earned_zar": rewards,
            "premium_paid_zar": premium,
            "discount_received_zar": discount,
            "claims_count": claims_count.astype(int),
            "claims_paid_zar": claims_paid,
            "risk_band": risk_band,
            "tenure_months": tenure,
        }))

    return pd.concat(frames, ignore_index=True)


# --------------------------------------------------------------------------- #
# Derived gold aggregates
# --------------------------------------------------------------------------- #

def build_bridge_tier_summary(fact: pd.DataFrame) -> pd.DataFrame:
    g = fact.groupby(["month_start", "engagement_tier"])
    out = g.agg(
        members=("member_id", "nunique"),
        avg_claims_zar_pm=("claims_paid_zar", "mean"),
        total_claims=("claims_count", "sum"),
        avg_rewards_cost_zar_pm=("rewards_earned_zar", "mean"),
        avg_premium_zar_pm=("premium_paid_zar", "mean"),
        avg_discount=("discount_received_zar", "mean"),
        total_premium=("premium_paid_zar", "sum"),
        total_claims_zar=("claims_paid_zar", "sum"),
    ).reset_index()

    out["claims_frequency_per_1000"] = (out["total_claims"] / out["members"] * 1000).round(2)
    out["loss_ratio_pct"] = (out["total_claims_zar"] / out["total_premium"] * 100).round(2)
    out["net_value_per_member_zar"] = (
        out["avg_premium_zar_pm"] - out["avg_claims_zar_pm"]
        - out["avg_rewards_cost_zar_pm"] - out["avg_discount"]
    ).round(2)
    out["avg_claims_zar_pm"] = out["avg_claims_zar_pm"].round(2)
    out["avg_rewards_cost_zar_pm"] = out["avg_rewards_cost_zar_pm"].round(2)
    out["avg_premium_zar_pm"] = out["avg_premium_zar_pm"].round(2)

    # lapse rate by tier-month (independent hazard draw, contract-controlled)
    lam = out["engagement_tier"].map(LAPSE_MONTHLY).to_numpy()
    out["lapse_rate_pct"] = (lam * 100 * rng.lognormal(0, 0.06, size=len(out))).round(2)

    return out[[
        "month_start", "engagement_tier", "members", "avg_claims_zar_pm",
        "claims_frequency_per_1000", "avg_rewards_cost_zar_pm",
        "avg_premium_zar_pm", "loss_ratio_pct", "net_value_per_member_zar",
        "lapse_rate_pct",
    ]]


def build_premium_book_monthly(fact: pd.DataFrame, dim: pd.DataFrame) -> pd.DataFrame:
    pl = dim.set_index("member_id")["_product_line"]
    f = fact[["member_id", "month_start", "vitality_status",
              "premium_paid_zar", "discount_received_zar"]].copy()
    f["product_line"] = f["member_id"].map(pl).to_numpy()

    g = f.groupby(["month_start", "product_line", "vitality_status"])
    out = g.agg(
        active_policies=("member_id", "nunique"),
        gross_premium_zar=("premium_paid_zar", "sum"),
        discount_cost_zar=("discount_received_zar", "sum"),
    ).reset_index()
    out["effective_discount_pct"] = (
        out["discount_cost_zar"] / (out["gross_premium_zar"] + out["discount_cost_zar"]) * 100
    ).round(2)
    # lapse counts scaled off active policies with a status-linked hazard
    status_hazard = {"BLUE": 0.010, "BRONZE": 0.008, "SILVER": 0.006,
                     "GOLD": 0.0045, "DIAMOND": 0.0035}
    haz = out["vitality_status"].map(status_hazard).to_numpy()
    out["lapse_count"] = np.round(out["active_policies"] * haz
                                  * rng.lognormal(0, 0.1, size=len(out))).astype(int)
    out["lapse_rate_pct"] = (out["lapse_count"] / out["active_policies"] * 100).round(2)
    out["gross_premium_zar"] = out["gross_premium_zar"].round(2)
    out["discount_cost_zar"] = out["discount_cost_zar"].round(2)
    return out


def build_rewards_liability_monthly(partners: pd.DataFrame) -> pd.DataFrame:
    """Synthesised at month x partner x reward_type with a controlled KULULA_AIR
    cap breach in 2 of the last 6 months (PRD §3.3 anomaly #5)."""
    rows = []
    last6 = set(range(N_MONTHS - 6, N_MONTHS))
    breach_months = {N_MONTHS - 5, N_MONTHS - 1}  # 2 of the last 6

    for _, p in partners.iterrows():
        cap = p["contract_monthly_cap_zar"]
        # baseline utilisation the partner runs at, growing slightly over time
        base_util = {"GROCERY": 0.72, "PHARMACY": 0.66, "TRAVEL": 0.80,
                     "FITNESS": 0.58, "DEVICES": 0.55}[p["partner_category"]]
        for mi in range(N_MONTHS):
            growth = 1.0 + mi / N_MONTHS * 0.18
            util = base_util * growth * rng.lognormal(0, 0.05)
            if p["partner_code"] == "KULULA_AIR":
                if mi in breach_months:
                    util = rng.uniform(1.04, 1.08)          # planted breach
                elif mi in last6:
                    util = rng.uniform(0.90, 0.99)          # running hot
            payout = round(cap * util, 2)
            txn_count = int(max(50, payout / rng.uniform(180, 320)))
            rows.append({
                "month_start": MONTHS[mi],
                "partner_code": p["partner_code"],
                "partner_category": p["partner_category"],
                "event_category": {"CASHBACK": "PARTNER_CASHBACK",
                                   "MILES": "PARTNER_CASHBACK",
                                   "VOUCHER": "ACTIVE_REWARD_REDEMPTION",
                                   "DEVICE_SUBSIDY": "DEVICE_SUBSIDY"}[p["_reward_type"]],
                "txn_count": txn_count,
                "total_payout_zar": payout,
                "avg_payout_zar": round(payout / txn_count, 2),
                "contract_cap_zar": round(cap, 2),
                "cap_utilisation_pct": round(util * 100, 2),
                "unique_members": int(txn_count * rng.uniform(0.55, 0.8)),
            })
    return pd.DataFrame(rows)


def build_health_engagement_daily(dim: pd.DataFrame) -> pd.DataFrame:
    """province x engagement_tier x date, daily over the 24-month window."""
    days = pd.date_range(MONTHS[0], MONTHS[-1] + pd.offsets.MonthEnd(1), freq="D")

    # member counts per province x tier (for active_members scaling)
    counts = (dim.groupby(["province", "engagement_tier"])["member_id"]
              .count().rename("pop").reset_index())

    steps_base = {"DORMANT": 3200, "LIGHT": 6000, "ACTIVE": 9200, "HIGHLY_ACTIVE": 13500}
    goal_base = {"DORMANT": 6, "LIGHT": 26, "ACTIVE": 55, "HIGHLY_ACTIVE": 82}
    active_frac = {"DORMANT": 0.15, "LIGHT": 0.45, "ACTIVE": 0.72, "HIGHLY_ACTIVE": 0.90}

    rows = []
    doy = days.dayofyear.to_numpy()
    # winter step-challenge bump (SA winter ~Jun-Aug, doy ~150-240) then drop-off
    challenge = np.where((doy >= 150) & (doy <= 215), 1.14, 1.0)
    challenge = np.where((doy > 215) & (doy <= 245), 0.90, challenge)  # post-challenge dip
    weekday_factor = np.where(pd.Series(days).dt.dayofweek.to_numpy() >= 5, 0.88, 1.04)

    for _, c in counts.iterrows():
        prov, tier, pop = c["province"], c["engagement_tier"], int(c["pop"])
        noise = rng.lognormal(0, 0.05, size=len(days))
        steps = (steps_base[tier] * challenge * weekday_factor * noise).round().astype(int)
        goal_pct = np.clip(goal_base[tier] * challenge * noise, 0, 100).round(1)
        active = np.round(pop * active_frac[tier]
                          * rng.uniform(0.9, 1.0, size=len(days))).astype(int)
        rows.append(pd.DataFrame({
            "activity_date": days,
            "province": prov,
            "engagement_tier": tier,
            "active_members": active,
            "avg_steps": steps,
            "avg_active_minutes": np.round(steps / 130).astype(int),
            "avg_sleep_hours": np.round(rng.normal(6.9, 0.5, len(days)), 2).clip(3, 11),
            "goal_met_pct": goal_pct,
            "gym_checkins": np.round(active * {"DORMANT": 0.02, "LIGHT": 0.12,
                                     "ACTIVE": 0.28, "HIGHLY_ACTIVE": 0.5}[tier]).astype(int),
            "screenings_completed": np.round(active * 0.01
                                     * rng.uniform(0.5, 1.5, len(days))).astype(int),
        }))
    return pd.concat(rows, ignore_index=True)


def build_screening_uptake_monthly(dim: pd.DataFrame) -> pd.DataFrame:
    """month x screening_type x province with a planted HbA1c narrative:
    uptake falls while out_of_range rises over the window."""
    prov_pop = dim.groupby("province")["member_id"].count()
    rows = []
    for mi, month in enumerate(MONTHS):
        t = mi / (N_MONTHS - 1)
        for stype in SCREENING_TYPES:
            base_uptake = {"VITALITY_HEALTH_CHECK": 0.42, "HBA1C": 0.30,
                           "CHOLESTEROL": 0.34, "BLOOD_PRESSURE": 0.48,
                           "BMI": 0.55, "HIV": 0.26, "MAMMOGRAM": 0.22,
                           "PROSTATE": 0.19}[stype]
            base_oor = {"VITALITY_HEALTH_CHECK": 0.14, "HBA1C": 0.18,
                        "CHOLESTEROL": 0.22, "BLOOD_PRESSURE": 0.20,
                        "BMI": 0.28, "HIV": 0.03, "MAMMOGRAM": 0.06,
                        "PROSTATE": 0.09}[stype]
            # HbA1c: uptake drifts DOWN, out-of-range drifts UP
            if stype == "HBA1C":
                uptake = base_uptake - 0.06 * t
                oor = base_oor + 0.05 * t
            else:
                uptake = base_uptake + 0.02 * t
                oor = base_oor
            for prov in PROVINCES:
                pop = int(prov_pop[prov])
                eligible = int(pop * rng.uniform(0.85, 0.95))
                u = float(np.clip(uptake * rng.lognormal(0, 0.05), 0, 1))
                completed = int(eligible * u)
                rows.append({
                    "month_start": month,
                    "screening_type": stype,
                    "province": prov,
                    "eligible_members": eligible,
                    "completed": completed,
                    "uptake_pct": round(u * 100, 2),
                    "out_of_range_pct": round(float(np.clip(oor * rng.lognormal(0, 0.06), 0, 1)) * 100, 2),
                })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
# Assertions — the correlation contract must hold (PRD §3.3)
# --------------------------------------------------------------------------- #

def verify_contract(tier_summary: pd.DataFrame, rewards_liab: pd.DataFrame) -> None:
    by_tier = tier_summary.groupby("engagement_tier").agg(
        claims=("avg_claims_zar_pm", "mean"),
        rewards=("avg_rewards_cost_zar_pm", "mean"),
        net=("net_value_per_member_zar", "mean"),
        lapse=("lapse_rate_pct", "mean"),
    )

    # (1) HIGHLY_ACTIVE 35-45% lower claims than DORMANT
    claims_gap = 1 - by_tier.loc["HIGHLY_ACTIVE", "claims"] / by_tier.loc["DORMANT", "claims"]
    assert 0.33 <= claims_gap <= 0.47, f"claims gap {claims_gap:.3f} out of band"

    # (1b) ~50% lower lapse
    lapse_ratio = by_tier.loc["HIGHLY_ACTIVE", "lapse"] / by_tier.loc["DORMANT", "lapse"]
    assert 0.40 <= lapse_ratio <= 0.60, f"lapse ratio {lapse_ratio:.3f} out of band"

    # (2) ACTIVE/HIGHLY_ACTIVE earn 3-5x rewards of DORMANT
    rr = by_tier.loc["HIGHLY_ACTIVE", "rewards"] / by_tier.loc["DORMANT", "rewards"]
    assert 3.0 <= rr <= 5.0, f"reward ratio {rr:.3f} out of band"

    # (3) net value positive everywhere and HIGHEST for ACTIVE (not HIGHLY_ACTIVE)
    assert (by_tier["net"] > 0).all(), "net value not positive for all tiers"
    assert by_tier["net"].idxmax() == "ACTIVE", \
        f"peak net-value tier is {by_tier['net'].idxmax()}, expected ACTIVE"

    # (5) KULULA_AIR breaches cap in exactly 2 months
    k = rewards_liab[rewards_liab["partner_code"] == "KULULA_AIR"]
    breaches = int((k["cap_utilisation_pct"] > 100).sum())
    assert breaches == 2, f"KULULA_AIR breaches = {breaches}, expected 2"

    print("\n=== Correlation contract verified ===")
    print(by_tier.round(2).to_string())
    print(f"\nclaims_gap(HA vs DORMANT) = {claims_gap:.1%}  (target 35-45%)")
    print(f"lapse_ratio(HA/DORMANT)   = {lapse_ratio:.2f}   (target ~0.50)")
    print(f"reward_ratio(HA/DORMANT)  = {rr:.2f}x   (target 3-5x)")
    print(f"peak net-value tier       = {by_tier['net'].idxmax()}  (target ACTIVE)")
    print(f"KULULA_AIR cap breaches   = {breaches}  (target 2)")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Generating Vitality Pulse mock data (seed={SEED}, "
          f"{N_MEMBERS:,} members, {N_MONTHS} months)...")

    dim = build_dim_members()
    partners = build_dim_partners()
    tier_paths = build_tier_paths(dim)

    print("  - bridge_member_month (member x month fact)...")
    fact = build_bridge_member_month(dim, tier_paths)

    print("  - deriving gold aggregates...")
    tier_summary = build_bridge_tier_summary(fact)
    premium_book = build_premium_book_monthly(fact, dim)
    rewards_liab = build_rewards_liability_monthly(partners)
    health_daily = build_health_engagement_daily(dim)
    screening = build_screening_uptake_monthly(dim)

    verify_contract(tier_summary, rewards_liab)

    # public-facing dimension columns only
    dim_out = dim[[
        "member_id", "join_date", "birth_year", "gender", "province",
        "current_vitality_status", "engagement_tier", "employer_segment",
    ]]
    partners_out = partners.drop(columns=["_reward_type"])

    tables = {
        "dim_members": dim_out,
        "dim_partners": partners_out,
        "bridge_member_month": fact,
        "bridge_tier_summary_monthly": tier_summary,
        "premium_book_monthly": premium_book,
        "rewards_liability_monthly": rewards_liab,
        "health_engagement_daily": health_daily,
        "screening_uptake_monthly": screening,
    }

    print("\n=== Writing parquet to data_out/ ===")
    for name, df in tables.items():
        path = os.path.join(OUT_DIR, f"{name}.parquet")
        df.to_parquet(path, index=False)
        print(f"  {name:32s} {len(df):>10,} rows -> {os.path.basename(path)}")

    print("\nDone.")


if __name__ == "__main__":
    main()
