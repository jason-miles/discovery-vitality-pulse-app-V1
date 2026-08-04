# Vitality Pulse — Value-Loop Demo Script

**App:** https://vitality-pulse-7474654808133980.aws.databricksapps.com (workspace SSO)
**Audience:** Discovery Vitality exec + data stakeholders
**Length:** ~8 minutes. Tip: click **"Play the story"** (sidebar footer) to auto-walk stops 1–5.

The whole demo tells one story: **healthier member behaviour → lower claims → funded rewards** — and that Databricks quantifies the entire loop on one governed lakehouse.

---

## 0 · Framing (30s)
> "Today three Discovery teams each see one arc of the shared-value loop and none see the circle. Vitality Pulse puts the whole loop in one governed app — and every number you'll see is live, from Unity Catalog gold tables, with AI grounded in that same data."

---

## 1 · GM Morning Brief — the exec position (90s)
**Open on `/brief`.**
- "This is what the CEO, CRO and CFO open to each morning."
- Point to the **AI morning narrative** (pink-edged banner): *"This paragraph was written live by Genie from the same governed data — net value per member, loss ratio, and today's one thing to watch."*
- Note the **KPI count-ups** and the **cap-breach concern** (KULULA AIR, red).
- **Wow line:** "No analyst, no slide deck — the shared-value engine briefs its own executives."

## 2 · Health & Wellness — the behaviour input (60s)
**Sidebar → Health & Wellness.**
- "The loop starts with behaviour." Point to **Engagement over time** — tiers separate cleanly (highly-active ~80% goal-met vs dormant near the floor), now shown **monthly**.
- Under each chart, the **Genie insight** explains it in plain English.
- "This is the Wellness team's weekly self-serve view — no BI ticket queue."

## 3 · The Bridge — behaviour becomes money (2 min) ⭐ the centrepiece
**Sidebar → The Bridge.**
- **The value loop** hero: bars = claims (falling across tiers), line = reward cost (rising), labels = net value per member.
- **Wow line:** *"Here's the non-obvious finding — net value peaks at ACTIVE, not the most-engaged tier, because reward costs climb faster than claims fall at the very top. That's a benefit-design lever worth millions."*
- Scroll: **Behaviour precedes risk** — movers' claims step down after they become active vs a flat control cohort. "Note the language — 'associated with', never 'caused'. Governed and defensible."
- Click **Copy executive summary** — "That just put all four AI insights on the clipboard. There's your QBR paragraph."

## 4 · Rewards & Premiums — the funded output (60s)
**Sidebar → Rewards & Premiums.**
- **Partner payout liability** stacked bars + the **cap-utilisation table**: KULULA AIR flagged **RED at 107.8%**.
- "Commercial walks into the Kulula renewal with this, not week-old spreadsheets."

## 5 · Pulse Assistant — ask anything (2 min)
**Sidebar → Pulse Assistant.** Show all three capabilities:
1. **Analytics:** click *"Compare goal-met rate across engagement tiers"* → streams a **real Genie** answer + chart/table. "Governed NL→SQL over the gold tables."
2. **Documents:** type *"What's the annual cap on Health Check points?"* → cited answer from **real Vector Search** with clickable source passages. "Every policy answer carries a citation — a POPIA/FSCA requirement, enforced by the UI."
3. **Workflow:** type *"Draft the Q3 report for Planet Fitness and email the partnerships team"* → review the plan, hit **Confirm** → it triggers a **real Databricks Job** that writes a report artifact to a Volume. "That wasn't a mock — a governed job just ran on the lakehouse."

## 6 · Architecture — how it's built (45s)
**Sidebar → Architecture.**
- One-frame data flow: sources → medallion → serving/Genie → this app. Per-cloud (AWS/Azure/GCP) reference topologies + the six Well-Architected pillars.
- "Ingestion, transformation, ML, serving, governance, sharing, and the app itself — all on one platform, one security model, open formats."

---

## Closing (30s)
> "Three teams, one shared evidence base, on one governed lakehouse — with AI that briefs executives, cites policy, and runs governed actions. That's the shared-value loop, finally measurable end to end."

## Backup / FAQ
- **"Is the data real?"** — Synthetic (50k members, 24 months, seeded), but the *pipeline, governance, Genie, Vector Search and Jobs are all real* on Databricks.
- **"What's mocked?"** — Only the reward-adjustment workflow's downstream email. RAG and the partner-report job are genuinely live.
- **If Genie is slow** — the app never blocks: charts render instantly and each insight falls back to a computed summary if Genie exceeds 30s.
- **Reset the Assistant** — reload `/assistant` for a fresh conversation.
