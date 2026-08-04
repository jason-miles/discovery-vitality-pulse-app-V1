import { useEffect } from "react";
import { Sparkles, FileText, Workflow, ArrowRight } from "lucide-react";
import { useChatStore } from "./useChatStore";
import { useChatStream } from "./useChatStream";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";

const EXAMPLES: { icon: typeof Sparkles; tint: string; label: string; prompts: string[] }[] = [
  {
    icon: Sparkles, tint: "text-amber", label: "Analytics",
    prompts: [
      "Compare goal-met rate across engagement tiers",
      "Which partners are closest to their contracted cap?",
      "How much lower are claims for highly-active vs dormant members?",
    ],
  },
  {
    icon: FileText, tint: "text-deep-teal", label: "Documents",
    prompts: [
      "What's the annual cap on Health Check points under the 2026 rules?",
      "What are the termination and exclusivity clauses in the Virgin Active contract?",
    ],
  },
  {
    icon: Workflow, tint: "text-violet", label: "Workflows",
    prompts: [
      "Draft the Q3 performance report for Planet Fitness and email the partnerships team",
      "Submit the KZN HealthyFood cashback anomaly for actuarial review",
    ],
  },
];

function EmptyState() {
  const { send } = useChatStream();
  return (
    <div className="mx-auto max-w-3xl px-2 py-8">
      {/* Branded hero */}
      <div className="hero-pattern card-in mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-deep-teal via-[#00466f] to-[#012740] p-7 text-white shadow-card">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><Sparkles className="h-5 w-5 text-amber" /></div>
          <h2 className="font-display text-2xl font-bold">Pulse Assistant</h2>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-white/70">
          One conversation over the shared-value lakehouse. Ask for <b className="text-white">analytics</b> (governed
          NL→SQL with charts), look up <b className="text-white">policy &amp; contract documents</b> with citations, or
          trigger a governed <b className="text-white">workflow</b> you confirm before it runs. Every analytics answer
          is grounded in the same gold tables as the dashboards.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXAMPLES.map(({ icon: Icon, tint, label, prompts }) => (
          <div key={label} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon className={`h-4 w-4 ${tint}`} /> {label}
            </div>
            <div className="space-y-1.5">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)}
                  className="group flex w-full items-start gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs text-ink/75 hover:border-deep-teal/40">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-deep-teal opacity-0 transition group-hover:opacity-100" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PulseAssistantPage() {
  const conv = useChatStore((s) => (s.activeId ? s.conversations[s.activeId] : null));
  const newConversation = useChatStore((s) => s.newConversation);
  useEffect(() => {
    if (!useChatStore.getState().activeId) newConversation();
  }, [newConversation]);

  const hasMessages = (conv?.messages.length ?? 0) > 0;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {hasMessages ? <MessageList /> : <EmptyState />}
      </div>
      <Composer />
    </div>
  );
}
