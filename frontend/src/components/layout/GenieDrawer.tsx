import { Sparkles, X, Send, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { askGenie, fetchGenieSpaces, type GenieAnswer, type GenieSpace, type Module } from "../../api/client";

interface Msg {
  role: "user" | "genie";
  text: string;
  table?: GenieAnswer["table"];
  pending?: boolean;
}

// Conversational drawer scoped to a module's Genie space, backed by the real
// /api/genie/ask endpoint (multi-turn via conversation_id).
export function GenieDrawer({
  open,
  onClose,
  module,
}: {
  open: boolean;
  onClose: () => void;
  module: Module;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [space, setSpace] = useState<GenieSpace | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset conversation when the module changes.
  useEffect(() => {
    setMessages([]);
    setConvId(null);
  }, [module]);

  // Load space metadata (purpose + examples + deep link).
  useEffect(() => {
    fetchGenieSpaces()
      .then((spaces) => setSpace(spaces.find((s) => s.module === module) ?? null))
      .catch(() => setSpace(null));
  }, [module]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Pick up a preset question seeded by the Genie hub when the drawer opens.
  useEffect(() => {
    if (!open) return;
    const preset = sessionStorage.getItem("genie:preset");
    if (preset) {
      const [presetModule, question] = preset.split("::");
      sessionStorage.removeItem("genie:preset");
      if (presetModule === module && question) send(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, module]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }, { role: "genie", text: "", pending: true }]);
    setBusy(true);
    try {
      const ans = await askGenie(module, text, convId);
      if (ans.conversation_id) setConvId(ans.conversation_id);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "genie", text: ans.text, table: ans.table };
        return next;
      });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "genie", text: "Genie is unavailable right now. Please try again." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-ink/20" onClick={onClose} aria-hidden />}
      <div
        className={clsx(
          "fixed right-0 top-0 z-30 flex h-full w-[440px] max-w-full flex-col border-l border-line bg-white shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="Ask Genie"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber" />
            <span className="font-display font-semibold text-ink">Ask Genie</span>
            <span className="rounded bg-genie-bg px-2 py-0.5 text-xs text-deep-teal">{space?.title ?? module}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-ink/50 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="space-y-3">
              {space?.purpose && (
                <p className="rounded-lg border-l-[3px] border-deep-teal bg-genie-bg px-3 py-2 text-sm text-ink/75">
                  {space.purpose}
                </p>
              )}
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Try asking</p>
              {(space?.examples ?? []).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm text-ink/80 hover:border-deep-teal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
                >
                  {s}
                </button>
              ))}
              {space?.deep_link && (
                <a
                  href={space.deep_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-deep-teal hover:underline"
                >
                  Open this space in Databricks <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={clsx("max-w-[92%]", m.role === "user" ? "ml-auto" : "")}>
              <div
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-deep-teal text-white"
                    : "border-l-[3px] border-deep-teal bg-genie-bg text-ink/85",
                )}
              >
                {m.pending ? (
                  <div className="space-y-2 py-1">
                    <div className="shimmer h-3 w-40 rounded" />
                    <div className="shimmer h-3 w-28 rounded" />
                  </div>
                ) : (
                  m.text
                )}
                {m.table && m.table.rows.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-auto rounded border border-line bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-surface text-ink/55">
                        <tr>
                          {m.table.columns.map((c) => (
                            <th key={c} className="px-2 py-1 text-left font-medium">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.rows.slice(0, 12).map((row, ri) => (
                          <tr key={ri} className="border-t border-line">
                            {(row as unknown[]).map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 tnum text-ink/75">{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          className="flex items-center gap-2 border-t border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${space?.title ?? "this module"}…`}
            disabled={busy}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-deep-teal p-2 text-white hover:bg-deep-teal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
