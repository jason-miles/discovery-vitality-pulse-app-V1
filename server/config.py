"""Runtime configuration and dual-mode Databricks auth.

Local dev  -> WorkspaceClient(profile=DATABRICKS_PROFILE) (default "elexon")
Databricks -> WorkspaceClient() (auto-injected app service-principal creds)
"""

from __future__ import annotations

import functools
import os

from databricks.sdk import WorkspaceClient

# Databricks Apps set DATABRICKS_APP_NAME in the runtime environment.
IS_DATABRICKS_APP = bool(os.environ.get("DATABRICKS_APP_NAME"))

# --- Data plane --------------------------------------------------------------
CATALOG = os.environ.get("VP_CATALOG", "elexon_app_for_settlement_acc_catalog")
GOLD_SCHEMA = os.environ.get("VP_GOLD_SCHEMA", "vitality_pulse_gold")
GOLD = f"{CATALOG}.{GOLD_SCHEMA}"
WAREHOUSE_ID = os.environ.get("VP_WAREHOUSE_ID", "dcb1c3dd8d1570d6")

# --- Genie spaces (one per module; overridable via app.yaml env on deploy) ---
# Defaults are the spaces created for this workspace (see scripts/create_genie_spaces).
GENIE_SPACE = {
    "health": os.environ.get("GENIE_SPACE_HEALTH", "01f18f07dc141af0a148d8148f6c788f"),
    "finance": os.environ.get("GENIE_SPACE_FINANCE", "01f18f07e5a515619f6a75c44d1bdaa6"),
    "bridge": os.environ.get("GENIE_SPACE_BRIDGE", "01f18f07efb31f9eb93fc2a7737d773d"),
}

# Workspace host for building shareable Genie deep-links in the UI.
def workspace_host() -> str:
    if IS_DATABRICKS_APP:
        host = os.environ.get("DATABRICKS_HOST", "")
        return host if host.startswith("http") else (f"https://{host}" if host else "")
    try:
        return get_workspace_client().config.host or ""
    except Exception:
        return ""

# Insight timeouts (PRD §5.5)
GENIE_TIMEOUT_S = int(os.environ.get("VP_GENIE_TIMEOUT_S", "30"))


@functools.lru_cache(maxsize=1)
def get_workspace_client() -> WorkspaceClient:
    if IS_DATABRICKS_APP:
        return WorkspaceClient()
    profile = os.environ.get("DATABRICKS_PROFILE", "elexon")
    return WorkspaceClient(profile=profile)
