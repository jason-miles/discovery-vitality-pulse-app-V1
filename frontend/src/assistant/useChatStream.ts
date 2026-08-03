import { useCallback } from "react";
import { useChatStore } from "./useChatStore";
import { getAgentClient, type ForcedRoute } from "./agentClient";
import type { AgentEvent, WorkflowParam } from "./types";

// Drives an AgentEvent generator into the chat store: appends blocks, streams
// text deltas, and settles final blocks. Shared by send + workflow-confirm.
export function useChatStream() {
  const store = useChatStore;

  const consume = useCallback(async (cid: string, msgId: string, gen: AsyncGenerator<AgentEvent>) => {
    const s = store.getState();
    for await (const ev of gen) {
      if (ev.kind === "block_start") s.appendBlock(cid, msgId, ev.block);
      else if (ev.kind === "block_delta") s.patchLastTextDelta(cid, msgId, ev.delta);
      else if (ev.kind === "block_end" && ev.block) s.replaceLastBlock(cid, msgId, ev.block);
      else if (ev.kind === "done") break;
    }
    s.setMessageStreaming(cid, msgId, false);
    s.setStreaming(false);
  }, [store]);

  const send = useCallback(async (text: string, forced?: ForcedRoute) => {
    const s = store.getState();
    let cid = s.activeId;
    if (!cid) cid = s.newConversation();
    s.addUserMessage(cid, text);
    const msgId = s.addAgentMessage(cid);
    s.setStreaming(true);
    await consume(cid, msgId, getAgentClient().sendMessage(cid, text, forced));
  }, [store, consume]);

  const confirmWorkflow = useCallback(async (runRequestId: string, params: WorkflowParam[]) => {
    const s = store.getState();
    const cid = s.activeId;
    if (!cid) return;
    const msgId = s.addAgentMessage(cid);
    s.setStreaming(true);
    await consume(cid, msgId, getAgentClient().confirmWorkflow(runRequestId, params));
  }, [store, consume]);

  return { send, confirmWorkflow };
}
