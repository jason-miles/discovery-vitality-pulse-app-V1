import {
  Check, Activity, GitMerge, Wallet, MessageSquareText, ShieldCheck, Users,
} from "lucide-react";

function Capability({ icon: Icon, title, body }: { icon: typeof Activity; title: string; body: string }) {
  return (
    <div className="card-in rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-genie-bg">
          <Icon className="h-5 w-5 text-deep-teal" />
        </div>
        <h4 className="font-display text-[15px] font-semibold text-ink">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-ink/65">{body}</p>
    </div>
  );
}

export function BusinessOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Hero — "Why this matters" */}
      <div className="card-in overflow-hidden rounded-xl bg-gradient-to-br from-deep-teal to-[#083f4a] p-8 text-white shadow-card">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber">
          <span className="h-2 w-2 rounded-full bg-amber" /> Business Overview
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Why this <span className="text-amber">matters</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70">
          The business context behind Vitality Pulse — proving the shared-value loop where healthier
          member behaviour funds richer rewards, and giving the Wellness, Actuarial and Commercial
          teams one shared evidence base instead of three data silos.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: "50 000", l: "Members analysed" },
            { n: "3", l: "Teams, one P&L" },
            { n: "24 mo", l: "Behaviour → claims history" },
            { n: "~36%", l: "Lower claims, top tier" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-white/15 bg-white/5 px-4 py-4">
              <div className="font-display text-3xl font-bold tnum">{s.n}</div>
              <div className="mt-1 text-[11px] leading-tight text-white/60">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Business value callout */}
      <div className="card-in rounded-xl border-l-[4px] border-[#227C57] bg-[#F1FAF4] p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#227C57]/10">
            <Check className="h-5 w-5 text-[#227C57]" />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-semibold text-ink">Business value</h3>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-ink/70">
              Vitality Pulse gives Discovery a single place to see the whole shared-value circle —
              engagement telemetry expressed in Rand, reward liability tracked against partner caps,
              and quantified behaviour→claims linkage — replacing a three-week quarterly slide
              exercise with a governed, always-current portal that each team can self-serve and query
              in plain English.
            </p>
          </div>
        </div>
      </div>

      {/* Key capabilities */}
      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Key capabilities</h2>
        <div className="grid grid-cols-12 gap-6">
          {[
            { icon: Activity, title: "Weekly engagement visibility", body: "The Wellness team self-serves engagement by segment, region and tier on weekly — not quarterly — data, and proves campaigns move the Vitality-status distribution." },
            { icon: Wallet, title: "Reward liability control", body: "Commercial tracks partner payout against contracted caps in near-real-time, with cap breaches flagged automatically (e.g. the Kulula Air overrun) ahead of renewals." },
            { icon: GitMerge, title: "Quantified shared-value loop", body: "The Bridge module links wellness behaviour to claims, net value and retention per tier — the evidence actuarial and executives need for pricing and benefit design." },
            { icon: MessageSquareText, title: "Natural-language answers", body: "Ask Genie turns plain-English questions into governed SQL over the same gold tables, so any team gets answers in under a minute without an analyst ticket." },
            { icon: ShieldCheck, title: "Governed & private", body: "Unity Catalog governs every table; the app reads gold only, no member PII surfaces in the UI, and every insight is grounded in the same certified data." },
            { icon: Users, title: "One shared evidence base", body: "Wellness, Actuarial and Commercial finally see the same numbers — ending the three-silos, one-P&L, zero-shared-evidence pathology." },
          ].map((c, i) => (
            <div key={c.title} className="col-span-12 md:col-span-6 lg:col-span-4" style={{ animationDelay: `${i * 40}ms` }}>
              <Capability icon={c.icon} title={c.title} body={c.body} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
