import { useQuery } from "@tanstack/react-query";
import { Sparkles, ExternalLink, ArrowRight, Activity, Wallet, GitMerge } from "lucide-react";
import { fetchGenieSpaces, type GenieSpace, type Module } from "../api/client";

const MODULE_ICON: Record<Module, typeof Activity> = {
  health: Activity,
  finance: Wallet,
  bridge: GitMerge,
};

// The Genie hub: a browsable directory of all three module Genie spaces,
// each with its purpose, example questions, and a link into the module drawer
// or directly into the Databricks Genie room.
export function GeniePage({ onAsk }: { onAsk: (module: Module, question?: string) => void }) {
  const { data: spaces, isLoading, isError } = useQuery<GenieSpace[]>({
    queryKey: ["genie-spaces"],
    queryFn: fetchGenieSpaces,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card-in rounded-xl border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber" />
          <h2 className="font-display text-lg font-semibold text-ink">Ask Genie</h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">
          Genie lets you ask questions of Vitality Pulse data in plain English — no SQL, no analyst
          ticket. Each module has its own governed Genie space, curated to that module's gold tables
          and briefed on its metrics. Pick a space below, or use the <b>Ask Genie</b> button on any
          module. Every answer is grounded in the same governed data as the dashboards.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-12 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="col-span-12 lg:col-span-4">
              <div className="shimmer h-72 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-line bg-white p-8 text-sm text-ink/50">
          Couldn't load Genie spaces.
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {(spaces ?? []).map((s, i) => {
          const Icon = MODULE_ICON[s.module];
          return (
            <div
              key={s.space_id}
              className="card-in col-span-12 flex flex-col rounded-xl border border-line bg-white p-6 shadow-card lg:col-span-4"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-genie-bg">
                  <Icon className="h-5 w-5 text-deep-teal" />
                </div>
                <h3 className="font-display text-[15px] font-semibold text-ink">{s.title}</h3>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-ink/70">{s.purpose}</p>

              <div className="mb-4 flex-1 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-ink/40">
                  Example questions
                </div>
                {s.examples.map((q) => (
                  <button
                    key={q}
                    onClick={() => onAsk(s.module, q)}
                    className="group flex w-full items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-ink/80 transition hover:border-deep-teal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-deep-teal opacity-0 transition group-hover:opacity-100" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <button
                  onClick={() => onAsk(s.module)}
                  className="flex items-center gap-1.5 rounded-lg bg-deep-teal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-deep-teal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
                >
                  <Sparkles className="h-4 w-4 text-amber" />
                  Ask here
                </button>
                {s.deep_link && (
                  <a
                    href={s.deep_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink/50 hover:text-deep-teal"
                  >
                    Open in Databricks <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
