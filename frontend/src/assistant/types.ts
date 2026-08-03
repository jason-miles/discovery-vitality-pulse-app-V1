// The block contract — the AgentBlock discriminated union. All components render
// from this. Every agent response is an ordered array of blocks; the renderer
// maps block.type -> component. Never assume one block per message.

export type Capability = "genie" | "rag" | "workflow"

export type DocType =
  | "vitality_rules"
  | "partner_contracts"
  | "clinical_guidelines"
  | "compliance"

export type GenieSpaceId = "members" | "partners" | "financials"

export const GENIE_SPACE_LABELS: Record<GenieSpaceId, string> = {
  members: "Member Engagement & Rewards",
  partners: "Partner Network Performance",
  financials: "Premium & Financial Impact",
}

// ---- Chart + table primitives ----

export type YFormat = "zar" | "number" | "percent"

export interface ChartSpec {
  kind: "bar" | "line" | "area"
  xKey: string
  series: { key: string; label: string }[]
  yFormat: YFormat
}

export interface ColumnDef {
  key: string
  label: string
  /** How to render numeric cells; omit for plain strings. */
  format?: YFormat
  numeric?: boolean
}

export type Row = Record<string, string | number | null>

// ---- Workflow primitives ----

export type WorkflowId =
  | "generate_partner_performance_report"
  | "submit_reward_adjustment_review"

export interface WorkflowParam {
  key: string
  label: string
  value: string
  /** Editable inline in the plan card. */
  editable?: boolean
  /** Constrains edits to an enum (e.g. recipient groups). */
  options?: string[]
  kind?: "text" | "enum" | "bool" | "multiline"
}

export type WorkflowStepState = "pending" | "running" | "done" | "failed"

export interface WorkflowStep {
  label: string
  state: WorkflowStepState
  detail?: string
}

export interface WorkflowArtifact {
  name: string
  kind: "pdf" | "csv"
  url: string
}

// ---- Citations ----

export interface Citation {
  id: number
  docTitle: string
  docType: DocType
  page: number
  section: string
  passage: string
}

// ---- The discriminated union ----

export type AgentBlock =
  | { type: "text"; markdown: string } // streamed
  | { type: "status"; label: string; capability: Capability } // transient
  | {
      type: "genie_result"
      summary: string
      chartSpec: ChartSpec | null
      table: { columns: ColumnDef[]; rows: Row[] }
      sql: string
      spaceName: string
      rowCount: number
      executionMs: number
      asOf: string
    }
  | {
      type: "citation_answer"
      markdown: string // contains [1] markers
      citations: Citation[]
      /** True when retrieval confidence was too low to answer. */
      lowConfidence?: boolean
    }
  | {
      type: "workflow_plan"
      workflowId: WorkflowId
      /** Correlates plan -> confirm -> progress. */
      runRequestId: string
      title: string
      params: WorkflowParam[]
      steps: string[]
      consequence: string
      recipients?: string[]
      /** priority=urgent paths require a typed "URGENT" confirmation. */
      requiresTypedConfirmation?: boolean
    }
  | {
      type: "workflow_progress"
      runId: string
      workflowId: WorkflowId
      steps: WorkflowStep[]
      artifacts: WorkflowArtifact[]
      /** Audit chip: who ran it, when. */
      executedBy?: string
      executedAt?: string
      done?: boolean
    }
  | { type: "followups"; suggestions: string[] }
  | { type: "error"; title: string; detail: string; retryable: boolean }

export type BlockType = AgentBlock["type"]

// ---- Streaming event envelope (matches AgentClient async generator) ----

export type AgentEvent =
  | { kind: "block_start"; block: AgentBlock }
  | { kind: "block_delta"; delta: string } // token text for the open text/citation block
  | { kind: "block_end"; block?: AgentBlock } // final settled block (patched in)
  | { kind: "done" }

// ---- Conversation-level model (Zustand store) ----

export type Feedback = "up" | "down" | null

export interface Message {
  id: string
  role: "user" | "agent"
  /** Agent messages hold an ordered list of typed blocks. */
  blocks: AgentBlock[]
  /** User messages hold plain text. */
  text?: string
  createdAt: string
  streaming?: boolean
  feedback?: Feedback
  feedbackComment?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  pinnedRoute?: Capability | GenieSpaceId
}
