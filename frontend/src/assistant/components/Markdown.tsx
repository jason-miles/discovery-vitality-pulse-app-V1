import { Fragment, type ReactNode } from "react";

// Minimal, safe markdown renderer — bold, inline code, bullet lists, paragraphs,
// and [n] citation markers rendered as superscript chips. No external deps, no
// raw HTML injection (everything is React text nodes).
function renderInline(text: string, onCite?: (n: number) => void): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on **bold**, `code`, and [n] citation markers.
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k++} className="rounded bg-surface px-1 py-0.5 text-[0.85em] text-deep-teal">{tok.slice(1, -1)}</code>);
    else {
      const n = parseInt(tok.slice(1, -1), 10);
      out.push(
        <sup key={k++}>
          <button onClick={() => onCite?.(n)}
            className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-deep-teal/10 px-1 text-[10px] font-semibold text-deep-teal hover:bg-deep-teal/20">
            {n}
          </button>
        </sup>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return out;
}

export function Markdown({ text, onCite }: { text: string; onCite?: (n: number) => void }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${key}`} className="my-1 ml-4 list-disc space-y-0.5">
        {list.map((li, i) => <li key={i}>{renderInline(li, onCite)}</li>)}
      </ul>,
    );
    list = [];
  };
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (/^[-*]\s+/.test(t)) list.push(t.replace(/^[-*]\s+/, ""));
    else { flush(i); if (t) blocks.push(<p key={i} className="my-1">{renderInline(t, onCite)}</p>); }
  });
  flush(lines.length);
  return <div className="text-sm leading-relaxed text-ink/85">{blocks}</div>;
}
