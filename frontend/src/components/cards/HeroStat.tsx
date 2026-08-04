import { useCountUp } from "../../hooks/useCountUp";

// A hero stat tile whose numeric part counts up on mount. Pass the number plus
// optional prefix/suffix (e.g. prefix "~", suffix " mo" or "%"); `decimals` and
// `space` control formatting (space=true → "50 000" SA grouping).
export function HeroStat({
  value, label, prefix = "", suffix = "", decimals = 0, space = false, size = "text-4xl",
}: {
  value: number; label: string; prefix?: string; suffix?: string;
  decimals?: number; space?: boolean; size?: string;
}) {
  const n = useCountUp(value);
  const fixed = n.toFixed(decimals);
  const grouped = space ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : fixed;
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-center">
      <div className={`tnum font-display ${size} font-bold`}>{prefix}{grouped}{suffix}</div>
      <div className="mt-1 text-[11px] leading-tight text-white/60">{label}</div>
    </div>
  );
}
