"""
Load the generated parquet files into Unity Catalog Delta tables.

Workspace constraint: the current user lacks metastore CREATE CATALOG, so — per
the established convention on this workspace (momentum_claims_*, investec_*) — we
co-locate the medallion schemas inside the existing default catalog with a demo
prefix:

    elexon_app_for_settlement_acc_catalog.vitality_pulse_gold      (app + Genie)
    elexon_app_for_settlement_acc_catalog.vitality_pulse_silver    (dims / fact)

The app queries the GOLD schema only. dim_members/dim_partners and the
bridge_member_month fact land in SILVER (member-grain), and everything the app
reads sits in GOLD. bridge_member_month and the dims are also exposed in GOLD as
views so Genie's Bridge space can reach the member-grain fact.

Flow: upload parquet to a UC Volume, then CREATE TABLE ... AS SELECT * FROM
read_files(volume_path). Idempotent (CREATE SCHEMA IF NOT EXISTS, CREATE OR
REPLACE TABLE).

Usage:
    python3 scripts/load_to_databricks.py --profile elexon \
        --warehouse dcb1c3dd8d1570d6
"""

from __future__ import annotations

import argparse
import os
import sys
import time

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

CATALOG = "elexon_app_for_settlement_acc_catalog"
GOLD = f"{CATALOG}.vitality_pulse_gold"
SILVER = f"{CATALOG}.vitality_pulse_silver"
VOLUME = f"{CATALOG}.vitality_pulse_gold.staging"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data_out")

# table name -> target schema
TABLE_SCHEMA = {
    "dim_members": SILVER,
    "dim_partners": SILVER,
    "bridge_member_month": SILVER,
    "bridge_tier_summary_monthly": GOLD,
    "premium_book_monthly": GOLD,
    "rewards_liability_monthly": GOLD,
    "health_engagement_daily": GOLD,
    "screening_uptake_monthly": GOLD,
}

# gold views over silver so Genie's Bridge space reaches member-grain data
GOLD_VIEWS = {
    "bridge_member_month": f"{SILVER}.bridge_member_month",
    "dim_members": f"{SILVER}.dim_members",
    "dim_partners": f"{SILVER}.dim_partners",
}


def run_sql(w: WorkspaceClient, warehouse_id: str, sql: str, label: str = "") -> None:
    resp = w.statement_execution.execute_statement(
        warehouse_id=warehouse_id, statement=sql, wait_timeout="50s",
    )
    # poll if still running
    while resp.status and resp.status.state in (StatementState.PENDING, StatementState.RUNNING):
        time.sleep(2)
        resp = w.statement_execution.get_statement(resp.statement_id)
    state = resp.status.state if resp.status else None
    if state != StatementState.SUCCEEDED:
        err = resp.status.error.message if resp.status and resp.status.error else "unknown"
        raise RuntimeError(f"SQL failed ({label}): {err}\n  SQL: {sql[:200]}")
    print(f"  ok: {label}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default="elexon")
    ap.add_argument("--warehouse", required=True, help="SQL warehouse id")
    args = ap.parse_args()

    w = WorkspaceClient(profile=args.profile)
    wh = args.warehouse

    print("== Creating schemas ==")
    run_sql(w, wh, f"CREATE SCHEMA IF NOT EXISTS {SILVER} "
                   f"COMMENT 'Vitality Pulse demo — silver (member-grain fact + dims)'",
            "schema silver")
    run_sql(w, wh, f"CREATE SCHEMA IF NOT EXISTS {GOLD} "
                   f"COMMENT 'Vitality Pulse demo — gold (app + Genie query these only)'",
            "schema gold")

    print("== Creating staging volume ==")
    run_sql(w, wh, f"CREATE VOLUME IF NOT EXISTS {VOLUME}", "volume staging")
    vol_path = f"/Volumes/{CATALOG}/vitality_pulse_gold/staging"

    print("== Uploading parquet to volume ==")
    for name in TABLE_SCHEMA:
        local = os.path.join(DATA_DIR, f"{name}.parquet")
        if not os.path.exists(local):
            sys.exit(f"missing {local} — run generate_mock_data.py first")
        remote = f"{vol_path}/{name}.parquet"
        with open(local, "rb") as f:
            w.files.upload(remote, f, overwrite=True)
        size = os.path.getsize(local) / 1e6
        print(f"  uploaded {name} ({size:.1f} MB)")

    print("== Creating Delta tables (CTAS from parquet) ==")
    for name, schema in TABLE_SCHEMA.items():
        remote = f"{vol_path}/{name}.parquet"
        fqn = f"{schema}.{name}"
        run_sql(
            w, wh,
            f"CREATE OR REPLACE TABLE {fqn} AS "
            f"SELECT * FROM read_files('{remote}', format => 'parquet')",
            f"table {fqn}",
        )

    print("== Creating gold views over silver ==")
    for view_name, src in GOLD_VIEWS.items():
        run_sql(
            w, wh,
            f"CREATE OR REPLACE VIEW {GOLD}.{view_name} AS SELECT * FROM {src}",
            f"view {GOLD}.{view_name}",
        )

    print("\nAll tables loaded. Gold schema:", GOLD)


if __name__ == "__main__":
    main()
