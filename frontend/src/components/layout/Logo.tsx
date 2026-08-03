// Vitality roundel mark, rendered in the official Vitality Pink (#F41C5E,
// 2022+ brand refresh). Brand-accurate without embedding a copyrighted raster.
// To use the official asset instead, drop it in frontend/public/ and point
// <img src="/vitality-logo.svg" /> here.

export const VITALITY_PINK = "#F41C5E";

export function VitalityRoundel({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Vitality"
    >
      {/* pink roundel */}
      <circle cx="24" cy="24" r="24" fill={VITALITY_PINK} />
      {/* stylised chevron/V mark in white */}
      <path
        d="M13 15.5h6.2l4.8 12.4 4.8-12.4H35L26.9 34.5h-5.8L13 15.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Full lock-up used in the sidebar header.
export function VitalityLockup({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <VitalityRoundel size={32} />
      {!collapsed && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold text-ink">Vitality Pulse</div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-ink/40">
            Discovery&nbsp;·&nbsp;Shared Value
          </div>
        </div>
      )}
    </div>
  );
}
