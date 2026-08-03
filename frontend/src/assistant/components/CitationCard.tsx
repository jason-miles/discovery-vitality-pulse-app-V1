import { useState } from "react";
import { FileText, BookOpen } from "lucide-react";
import { Markdown } from "./Markdown";
import type { AgentBlock } from "../types";

type CitationAnswer = Extract<AgentBlock, { type: "citation_answer" }>;

const DOC_LABEL: Record<string, string> = {
  vitality_rules: "Vitality Rules", partner_contracts: "Partner Contract",
  clinical_guidelines: "Clinical Guideline", compliance: "Compliance",
};

export function CitationCard({ block }: { block: CitationAnswer }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="rounded-xl border-l-[3px] border-deep-teal bg-genie-bg p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-deep-teal">
        <BookOpen className="h-3.5 w-3.5" /> Documents
        {block.lowConfidence && <span className="ml-2 rounded bg-amber/15 px-1.5 py-0.5 text-[11px] font-medium text-amber">low confidence</span>}
      </div>
      <Markdown text={block.markdown} onCite={(n) => setOpen(open === n ? null : n)} />

      {/* Citation list */}
      <div className="mt-3 space-y-1.5 border-t border-deep-teal/15 pt-3">
        {block.citations.map((c) => (
          <div key={c.id}>
            <button onClick={() => setOpen(open === c.id ? null : c.id)}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-white/60">
              <span className="mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-deep-teal/10 px-1 font-semibold text-deep-teal">{c.id}</span>
              <span className="flex items-center gap-1.5 text-ink/70">
                <FileText className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                <span className="font-medium text-ink/80">{c.docTitle}</span>
                <span className="text-ink/40">· {DOC_LABEL[c.docType] ?? c.docType} · p.{c.page} · {c.section}</span>
              </span>
            </button>
            {open === c.id && (
              <blockquote className="ml-6 mt-1 rounded-md border-l-2 border-amber bg-white px-3 py-2 text-xs italic leading-relaxed text-ink/70">
                “{c.passage}”
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
