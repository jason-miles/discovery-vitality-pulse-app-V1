import { useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import clsx from "clsx";
import { BlockRenderer } from "./BlockRenderer";
import { useChatStore } from "../useChatStore";
import type { Message } from "../types";

function AgentTurn({ m }: { m: Message }) {
  const setFeedback = useChatStore((s) => s.setFeedback);
  const activeId = useChatStore((s) => s.activeId)!;
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-deep-teal">
        <Sparkles className="h-4 w-4 text-amber" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {m.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
        {!m.streaming && m.blocks.some((b) => b.type === "genie_result" || b.type === "citation_answer") && (
          <div className="flex items-center gap-1">
            <button onClick={() => setFeedback(activeId, m.id, m.feedback === "up" ? null : "up")}
              className={clsx("rounded p-1 hover:bg-surface", m.feedback === "up" ? "text-[#227C57]" : "text-ink/30")}><ThumbsUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => setFeedback(activeId, m.id, m.feedback === "down" ? null : "down")}
              className={clsx("rounded p-1 hover:bg-surface", m.feedback === "down" ? "text-alert" : "text-ink/30")}><ThumbsDown className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageList() {
  const conv = useChatStore((s) => (s.activeId ? s.conversations[s.activeId] : null));
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages]);
  if (!conv) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-2 py-4">
      {conv.messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-deep-teal px-4 py-2 text-sm text-white">{m.text}</div>
          </div>
        ) : (
          <AgentTurn key={m.id} m={m} />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
