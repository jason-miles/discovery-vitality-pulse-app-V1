import { useEffect, useRef, useState } from "react";

// Animate a number from 0 → target once, on first render (respects
// prefers-reduced-motion). Returns the current animated value.
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();
  const startedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    // Respect reduced motion — jump straight to the value.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    if (startedFor.current === target) return;
    startedFor.current = target;
    const from = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, durationMs]);

  return value;
}
