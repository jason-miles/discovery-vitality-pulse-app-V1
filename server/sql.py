"""SQL execution against the serverless warehouse (gold tables only).

Queries live server-side in backend/queries/*.sql and are referenced by
`sqlKey`; the frontend never sends raw SQL. All user-supplied values (dates,
province/tier lists) are passed as *named parameters* to the Statement
Execution API — never string-interpolated — so the endpoints are injection
safe (PRD §5.4).

Named params in .sql files use the `:name` syntax. List filters (provinces,
tiers) are handled with a sentinel pattern: the query includes
`(:all_provinces = 1 OR province IN (:provinces))` and we pass the list as a
single comma-joined value bound through an IDENTIFIER-free ARRAY literal built
server-side from a validated allow-list.
"""

from __future__ import annotations

import functools
import os
from typing import Any

from databricks.sdk.service.sql import (
    StatementParameterListItem,
    StatementState,
)

from .config import GOLD, WAREHOUSE_ID, get_workspace_client

QUERY_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "queries")

# Allow-lists — any value not in these sets is rejected before it reaches SQL.
VALID_PROVINCES = {
    "GAUTENG", "WESTERN_CAPE", "KWAZULU_NATAL",
    "EASTERN_CAPE", "FREE_STATE", "OTHER",
}
VALID_TIERS = {"DORMANT", "LIGHT", "ACTIVE", "HIGHLY_ACTIVE"}


@functools.lru_cache(maxsize=64)
def load_query(sql_key: str) -> str:
    """Load and cache a named query. `sql_key` is validated as a bare filename."""
    if not sql_key.replace("_", "").isalnum():
        raise ValueError(f"invalid sqlKey: {sql_key!r}")
    path = os.path.join(QUERY_DIR, f"{sql_key}.sql")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"unknown sqlKey: {sql_key}")
    with open(path, "r") as f:
        return f.read().replace("{{GOLD}}", GOLD)


def _validated_list(values: list[str] | None, allowed: set[str]) -> list[str]:
    if not values:
        return sorted(allowed)          # empty filter == all
    bad = [v for v in values if v not in allowed]
    if bad:
        raise ValueError(f"disallowed filter values: {bad}")
    return values


def build_params(filters: dict[str, Any]) -> list[StatementParameterListItem]:
    """Translate the frontend filter payload into typed SQL parameters.

    Expected filters: date_from, date_to (ISO dates), provinces (list),
    tiers (list). Provinces/tiers are validated against allow-lists and passed
    as comma-joined strings consumed by `split(:provinces_csv, ',')` in SQL.
    """
    provinces = _validated_list(filters.get("provinces"), VALID_PROVINCES)
    tiers = _validated_list(filters.get("tiers"), VALID_TIERS)

    params = [
        StatementParameterListItem(name="date_from", value=filters["date_from"], type="DATE"),
        StatementParameterListItem(name="date_to", value=filters["date_to"], type="DATE"),
        StatementParameterListItem(name="provinces_csv", value=",".join(provinces), type="STRING"),
        StatementParameterListItem(name="tiers_csv", value=",".join(tiers), type="STRING"),
    ]
    return params


def run_query(sql_key: str, filters: dict[str, Any]) -> dict[str, Any]:
    """Execute a registered query and return {columns, rows}."""
    w = get_workspace_client()
    statement = load_query(sql_key)
    params = build_params(filters)

    resp = w.statement_execution.execute_statement(
        warehouse_id=WAREHOUSE_ID,
        statement=statement,
        parameters=params,
        wait_timeout="30s",
    )
    # A 30s wait_timeout returns terminal or PENDING/RUNNING; poll if needed.
    import time
    while resp.status and resp.status.state in (StatementState.PENDING, StatementState.RUNNING):
        time.sleep(1)
        resp = w.statement_execution.get_statement(resp.statement_id)

    if not resp.status or resp.status.state != StatementState.SUCCEEDED:
        msg = (resp.status.error.message
               if resp.status and resp.status.error else "unknown error")
        raise RuntimeError(f"query {sql_key} failed: {msg}")

    schema = resp.manifest.schema if resp.manifest else None
    columns = [c.name for c in schema.columns] if schema and schema.columns else []
    data = resp.result.data_array if resp.result and resp.result.data_array else []

    # Coerce numeric strings to numbers for clean JSON (Statement API returns
    # all values as strings).
    col_types = ({c.name: (c.type_name.value if c.type_name else "STRING")
                  for c in schema.columns} if schema and schema.columns else {})
    rows = [_coerce_row(columns, r, col_types) for r in data]
    return {"columns": columns, "rows": rows}


_NUMERIC = {"INT", "LONG", "SHORT", "BYTE", "FLOAT", "DOUBLE", "DECIMAL"}


def _coerce_row(columns: list[str], raw: list[str], col_types: dict[str, str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for name, val in zip(columns, raw):
        if val is None:
            out[name] = None
            continue
        t = col_types.get(name, "STRING")
        if t in _NUMERIC:
            try:
                out[name] = float(val) if ("." in val or t in {"FLOAT", "DOUBLE", "DECIMAL"}) else int(val)
            except ValueError:
                out[name] = val
        else:
            out[name] = val
    return out
