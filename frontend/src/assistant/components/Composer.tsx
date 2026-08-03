import { useState } from "react";
import { Send, Square } from "lucide-react";
import { useChatStream } from "../useChatStream";
import { useChatStore } from "../useChatStore";
import { getAgentClient } from "../agentClient";

export function Composer() {
  const [text, setText] = useState("");
  const { send } = useChatStream();
  const streaming = useChatStore((s) => s.streaming);
  const activeId = useChatStore((s) => s.activeId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || streaming) return;
    send(text);
    setText("");
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-3xl items-end gap-2 px-2 pb-4">
      <div className="flex flex-1 items-end rounded-xl border border-line bg-white px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-deep-teal/30">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }}
          rows={1}
          placeholder="Ask about analytics, a policy rule, or request a report…"
          className="max-h-32 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
        />
      </div>
      {streaming ? (
        <button type="button" onClick={() => activeId && getAgentClient().cancel(activeId)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink/60 hover:bg-surface" aria-label="Stop">
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button type="submit" disabled={!text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-deep-teal text-white hover:bg-deep-teal/90 disabled:opacity-40" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
