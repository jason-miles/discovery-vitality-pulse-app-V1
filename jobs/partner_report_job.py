# Databricks job task: generate a partner performance report artifact.
# Reads the gold rewards table, writes a per-partner summary to a Volume.
# Parameters: partner (str), period (str). Runs on serverless UC-shared
# compute — no local filesystem access, so write straight to the Volume path.
from pyspark.sql import functions as F

partner = dbutils.widgets.get("partner") if "dbutils" in dir() else "Planet Fitness"
period = dbutils.widgets.get("period") if "dbutils" in dir() else "Q3 2026"

CAT = "elexon_app_for_settlement_acc_catalog"
GOLD = f"{CAT}.vitality_pulse_gold"
VOL = f"/Volumes/{CAT}/vitality_pulse_gold/staging/reports"

partner_code = partner.upper().replace(" ", "_")
df = (spark.table(f"{GOLD}.rewards_liability_monthly")
      .filter(F.col("partner_code") == partner_code)
      .select("month_start", "partner_code", "partner_category", "event_category",
              "txn_count", "total_payout_zar", "avg_payout_zar",
              "contract_cap_zar", "cap_utilisation_pct", "unique_members")
      .orderBy("month_start"))

out = f"{VOL}/{partner_code}_{period.replace(' ', '_')}"
# Write a single-file CSV directly to the Volume (no local fs on serverless UC).
df.coalesce(1).write.mode("overwrite").option("header", "true").csv(out)
print(f"Wrote partner report to {out} ({df.count()} rows)")
