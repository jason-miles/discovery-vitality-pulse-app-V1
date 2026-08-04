import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

// A guided "Play the story" walkthrough of the shared-value loop. Advances
// through the modules, navigating the app and showing a caption at each stop —
// ideal for a QBR / exec walkthrough.
interface Stop {
  route: string;
  title: string;
  caption: string;
}

const STOPS: Stop[] = [
  {
    route: "/brief",
    title: "1 · The morning position",
    caption:
      "Every morning the C-suite opens to one governed view: net value per member, loss ratio, engagement and the day's top concern — narrated live by AI from the same gold data.",
  },
  {
    route: "/health",
    title: "2 · Behaviour — the input",
    caption:
      "The loop starts with member behaviour. Engagement separates cleanly by tier: highly-active members sustain far higher goal-met rates than dormant ones. This is the wellness team's weekly, self-serve view.",
  },
  {
    route: "/bridge",
    title: "3 · The Bridge — behaviour → money",
    caption:
      "The value loop in one frame: more engaged tiers claim less, but net value peaks at ACTIVE — because reward costs climb at the very top. This is the shared-value thesis, quantified.",
  },
  {
    route: "/finance",
    title: "4 · Rewards & liability — the output",
    caption:
      "The funded side of the loop: partner payout tracked against contracted caps (Kulula's breach flagged red), premium book by tier, and retention — the evidence for every partner renewal.",
  },
  {
    route: "/assistant",
    title: "5 · Ask anything",
    caption:
      "Any of these can be interrogated in plain English — governed analytics, cited policy answers, or a confirm-to-run workflow — all on the same lakehouse.",
  },
];

export function StoryTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setI(0);
      navigate(STOPS[0].route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) navigate(STOPS[i].route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (!open) return null;
  const stop = STOPS[i];
  const last = i === STOPS.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center p-6">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-line bg-white/95 p-5 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-deep-teal">
            <Sparkles className="h-3.5 w-3.5 text-amber" /> Guided story
          </div>
          <button onClick={onClose} className="rounded p-1 text-ink/40 hover:bg-surface" aria-label="End tour">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">{stop.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">{stop.caption}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STOPS.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-deep-teal" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              disabled={i === 0}
              onClick={() => setI((n) => Math.max(0, n - 1))}
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-ink/60 hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {last ? (
              <button onClick={onClose} className="rounded-lg bg-deep-teal px-4 py-1.5 text-sm font-medium text-white hover:bg-deep-teal/90">
                Finish
              </button>
            ) : (
              <button onClick={() => setI((n) => Math.min(STOPS.length - 1, n + 1))}
                className="flex items-center gap-1 rounded-lg bg-deep-teal px-4 py-1.5 text-sm font-medium text-white hover:bg-deep-teal/90">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// The trigger button, placed in the sidebar footer.
export function StoryTourButton({ onClick, collapsed }: { onClick: () => void; collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg bg-amber/10 px-3 py-2 text-sm font-medium text-deep-teal transition hover:bg-amber/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
      title={collapsed ? "Play the story" : undefined}
    >
      <Play className="h-4 w-4 shrink-0 text-amber" />
      {!collapsed && <span>Play the story</span>}
    </button>
  );
}
