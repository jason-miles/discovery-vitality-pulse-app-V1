"""Populate the policy_documents Delta table (the RAG corpus for the Pulse
Assistant's Documents capability). Realistic Discovery Vitality policy /
partner-contract / clinical passages. Idempotent: truncates then inserts."""

from __future__ import annotations
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABRICKS_PROFILE", "elexon")

from server.config import WAREHOUSE_ID, get_workspace_client  # noqa: E402
from databricks.sdk.service.sql import StatementState  # noqa: E402

TABLE = "elexon_app_for_settlement_acc_catalog.vitality_pulse_gold.policy_documents"

# (chunk_id, doc_title, doc_type, page, section, text)
DOCS = [
    ("VR-034-1", "Vitality Main Rules 2026", "vitality_rules", 34, "Annual Points Caps",
     "The maximum number of Vitality points that may be earned from Health Check activities is limited to 7 500 points per member per calendar year. Points earned in excess of this annual cap are forfeited and do not carry forward into the next Vitality year."),
    ("VR-033-1", "Vitality Main Rules 2026", "vitality_rules", 33, "Health Check Points Schedule",
     "Each qualifying biometric screening completed at an accredited provider — blood pressure, cholesterol, glucose and BMI — earns 1 000 points. Completion of the full annual Vitality Health Check earns an additional 2 500 points, subject to the Health Check annual cap."),
    ("VR-041-1", "Vitality Main Rules 2026", "vitality_rules", 41, "Physical Activity — Events",
     "parkrun completions earn 300 points each, limited to one qualifying event per calendar week. The annual maximum earnable from parkrun events is 15 000 points per member. Points are awarded only where completion is verified through the accredited parkrun SA barcode scan."),
    ("VR-018-1", "Vitality Main Rules 2026", "vitality_rules", 18, "Status Tiers",
     "Vitality status is calculated annually across five tiers — Blue, Bronze, Silver, Gold and Diamond — based on total Vitality points earned in the engagement year. Status determines Discovery Miles earn rates, Active Rewards eligibility and premium-adjustment bands on linked Health and Life products."),
    ("VR-052-1", "Vitality Main Rules 2026", "vitality_rules", 52, "HealthyFood Benefit",
     "Members on the HealthyFood benefit earn up to 25% cash back on qualifying HealthyFood items at Pick n Pay and Woolworths. The cash-back rate is tiered by Vitality status and is subject to a monthly qualifying-spend cap set out in the benefit guide."),
    ("PC-012-1", "Virgin Active Master Services Agreement", "partner_contracts", 12, "12. Term & Termination",
     "Either party may terminate this Agreement without cause upon ninety (90) days' prior written notice to the other party. Termination for material breach requires a thirty (30) day remedy period following written notice."),
    ("PC-018-1", "Virgin Active Master Services Agreement", "partner_contracts", 18, "18. Exclusivity & Co-Marketing",
     "For the term of this Agreement, the Partner grants Vitality category exclusivity across national health-club chains. Co-marketing expenditure exceeding R500 000 per campaign requires joint written approval from both parties' marketing leads."),
    ("PC-024-1", "Planet Fitness Partner Agreement", "partner_contracts", 24, "9. Reward Funding & Caps",
     "Discovery co-funds member check-in rewards up to a contracted monthly cap. Where monthly redemptions exceed the cap, the Partner bears the excess unless a cap increase is agreed in writing. Cap utilisation is reconciled monthly against the agreed schedule."),
    ("PC-007-1", "Kulula.com Rewards Agreement", "partner_contracts", 7, "5. Monthly Payout Cap",
     "The monthly Vitality Miles funding payable to the Partner is capped at the contracted amount. Any breach of the monthly cap must be flagged to the Partnerships team within five business days and does not create an obligation on Discovery to fund the excess."),
    ("CG-003-1", "Vitality Clinical Guidelines 2026", "clinical_guidelines", 3, "Screening Cadence",
     "Members aged 40 and over are advised to complete a comprehensive Vitality Health Check annually. HbA1c screening is recommended every 12 months for members with an elevated BMI result or a family history of diabetes."),
    ("CG-009-1", "Vitality Clinical Guidelines 2026", "clinical_guidelines", 9, "Out-of-Range Follow-up",
     "Where a biometric screening returns an out-of-range result, the member should be referred for a follow-up consultation within 90 days. Elevated HbA1c results are associated with a materially higher likelihood of chronic-medication claims in the following 3 to 9 months."),
    ("CO-002-1", "POPIA & Conduct Standards", "compliance", 2, "Member Data Handling",
     "Member health data is processed under POPIA on the lawful basis of contract performance and legitimate interest. Aggregated, de-identified analytics may be shared internally; individual health records may not be exposed in operational reporting interfaces."),
]


def run(w, sql: str, label: str):
    r = w.statement_execution.execute_statement(warehouse_id=WAREHOUSE_ID, statement=sql, wait_timeout="30s")
    import time
    while r.status and r.status.state in (StatementState.PENDING, StatementState.RUNNING):
        time.sleep(1); r = w.statement_execution.get_statement(r.statement_id)
    st = r.status.state if r.status else None
    if st != StatementState.SUCCEEDED:
        raise RuntimeError(f"{label} failed: {r.status.error.message if r.status and r.status.error else '?'}")
    print(f"  ok: {label}")


def esc(s: str) -> str:
    return s.replace("'", "''")


def main():
    w = get_workspace_client()
    run(w, f"DELETE FROM {TABLE}", "truncate")
    values = ",".join(
        f"('{c}','{esc(t)}','{dt}',{p},'{esc(s)}','{esc(x)}')" for (c, t, dt, p, s, x) in DOCS
    )
    run(w, f"INSERT INTO {TABLE} (chunk_id, doc_title, doc_type, page_number, section_heading, chunk_text) VALUES {values}", f"insert {len(DOCS)} docs")
    print(f"\nLoaded {len(DOCS)} passages into {TABLE}")


if __name__ == "__main__":
    main()
