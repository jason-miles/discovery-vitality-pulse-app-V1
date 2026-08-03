"""Smoke-test the SQL query registry against the live warehouse."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABRICKS_PROFILE", "elexon")

from server.sql import run_query  # noqa: E402

FILTERS = {"date_from": "2025-08-01", "date_to": "2026-07-31",
           "provinces": [], "tiers": []}

KEYS = [
    "health_stat_cards",
    "health_engagement_over_time",
    "health_gym_by_province",
    "health_screening_uptake",
    "health_sleep_activity",
]

for key in KEYS:
    r = run_query(key, FILTERS)
    print(f"=== {key} :: {len(r['rows'])} rows :: cols={r['columns']}")
    for row in r["rows"][:2]:
        print("   ", row)
