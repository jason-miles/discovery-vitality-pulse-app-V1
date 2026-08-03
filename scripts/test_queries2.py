"""Smoke-test Finance + Bridge queries against the live warehouse."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABRICKS_PROFILE", "elexon")

from server.sql import run_query  # noqa: E402

FILTERS = {"date_from": "2025-08-01", "date_to": "2026-07-31",
           "provinces": [], "tiers": []}

KEYS = [
    "finance_stat_cards", "finance_partner_liability", "finance_cap_utilisation",
    "finance_redemption_mix", "finance_premium_book", "finance_lapse_watch",
    "bridge_value_loop", "bridge_claims_vs_engagement", "bridge_tenure_controlled",
    "bridge_behaviour_precedes", "bridge_lapse_ltv",
]

for key in KEYS:
    try:
        r = run_query(key, FILTERS)
        print(f"OK  {key} :: {len(r['rows'])} rows :: {r['columns']}")
        for row in r["rows"][:2]:
            print("      ", row)
    except Exception as e:
        print(f"FAIL {key} :: {e}")
