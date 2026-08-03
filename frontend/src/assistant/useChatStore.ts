import { create } from "zustand"
import type {
  AgentBlock,
  Conversation,
  Feedback,
  Message,
} from "./types"

// Small id helper — no crypto dependency needed for a mocked demo.
let _seq = 0
function uid(prefix: string): string {
  _seq += 1
  return `${prefix}-${Date.now().toString(36)}-${_seq}`
}

function nowIso(): string {
  return new Date().toISOString()
}

interface ChatState {
  conversations: Record<string, Conversation>
  order: string[] // most-recent-first conversation ids
  activeId: string | null
  streaming: boolean

  // selectors
  active: () => Conversation | null

  // conversation lifecycle
  newConversation: (opts?: { pinnedRoute?: Conversation["pinnedRoute"] }) => string
  setActive: (id: string) => void
  renameConversation: (id: string, title: string) => void

  // messages
  addUserMessage: (conversationId: string, text: string) => string
  addAgentMessage: (conversationId: string) => string
  setStreaming: (v: boolean) => void
  setMessageStreaming: (conversationId: string, messageId: string, v: boolean) => void

  // block mutations used by the stream consumer
  appendBlock: (conversationId: string, messageId: string, block: AgentBlock) => void
  patchLastTextDelta: (conversationId: string, messageId: string, delta: string) => void
  replaceLastBlock: (conversationId: string, messageId: string, block: AgentBlock) => void
  patchBlock: (
    conversationId: string,
    messageId: string,
    predicate: (b: AgentBlock) => boolean,
    next: AgentBlock,
  ) => void

  setFeedback: (
    conversationId: string,
    messageId: string,
    feedback: Feedback,
    comment?: string,
  ) => void
}

function touch(conv: Conversation): Conversation {
  return { ...conv, updatedAt: nowIso() }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  order: [],
  activeId: null,
  streaming: false,

  active: () => {
    const { activeId, conversations } = get()
    return activeId ? conversations[activeId] ?? null : null
  },

  newConversation: (opts) => {
    const id = uid("c")
    const conv: Conversation = {
      id,
      title: "New chat",
      messages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      pinnedRoute: opts?.pinnedRoute,
    }
    set((s) => ({
      conversations: { ...s.conversations, [id]: conv },
      order: [id, ...s.order],
      activeId: id,
    }))
    return id
  },

  setActive: (id) => set({ activeId: id }),

  renameConversation: (id, title) =>
    set((s) => {
      const conv = s.conversations[id]
      if (!conv) return {}
      return { conversations: { ...s.conversations, [id]: { ...conv, title } } }
    }),

  addUserMessage: (conversationId, text) => {
    const msgId = uid("m")
    const msg: Message = {
      id: msgId,
      role: "user",
      blocks: [],
      text,
      createdAt: nowIso(),
    }
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      // First user turn seeds the conversation title.
      const title =
        conv.messages.length === 0
          ? text.slice(0, 48) + (text.length > 48 ? "…" : "")
          : conv.title
      const next = touch({ ...conv, title, messages: [...conv.messages, msg] })
      // Bubble conversation to top of the order.
      const order = [conversationId, ...s.order.filter((x) => x !== conversationId)]
      return { conversations: { ...s.conversations, [conversationId]: next }, order }
    })
    return msgId
  },

  addAgentMessage: (conversationId) => {
    const msgId = uid("m")
    const msg: Message = {
      id: msgId,
      role: "agent",
      blocks: [],
      createdAt: nowIso(),
      streaming: true,
    }
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const next = touch({ ...conv, messages: [...conv.messages, msg] })
      return { conversations: { ...s.conversations, [conversationId]: next } }
    })
    return msgId
  },

  setStreaming: (v) => set({ streaming: v }),

  setMessageStreaming: (conversationId, messageId, v) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) =>
        m.id === messageId ? { ...m, streaming: v } : m,
      )
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),

  appendBlock: (conversationId, messageId, block) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) =>
        m.id === messageId ? { ...m, blocks: [...m.blocks, block] } : m,
      )
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),

  patchLastTextDelta: (conversationId, messageId, delta) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) => {
        if (m.id !== messageId) return m
        const blocks = [...m.blocks]
        const last = blocks[blocks.length - 1]
        if (last && last.type === "text") {
          blocks[blocks.length - 1] = { ...last, markdown: last.markdown + delta }
        } else if (last && last.type === "citation_answer") {
          blocks[blocks.length - 1] = { ...last, markdown: last.markdown + delta }
        }
        return { ...m, blocks }
      })
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),

  replaceLastBlock: (conversationId, messageId, block) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) => {
        if (m.id !== messageId) return m
        const blocks = [...m.blocks]
        if (blocks.length) blocks[blocks.length - 1] = block
        else blocks.push(block)
        return { ...m, blocks }
      })
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),

  patchBlock: (conversationId, messageId, predicate, next) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) => {
        if (m.id !== messageId) return m
        const blocks = m.blocks.map((b) => (predicate(b) ? next : b))
        return { ...m, blocks }
      })
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),

  setFeedback: (conversationId, messageId, feedback, comment) =>
    set((s) => {
      const conv = s.conversations[conversationId]
      if (!conv) return {}
      const messages = conv.messages.map((m) =>
        m.id === messageId ? { ...m, feedback, feedbackComment: comment } : m,
      )
      console.debug("[audit] feedback", { conversationId, messageId, feedback })
      return {
        conversations: { ...s.conversations, [conversationId]: { ...conv, messages } },
      }
    }),
}))
