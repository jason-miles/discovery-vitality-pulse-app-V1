import clsx from "clsx";
import {
  PROVINCES,
  TIERS,
  useFilterStore,
  type Province,
  type Tier,
} from "../../state/filterStore";

const PROVINCE_LABEL: Record<Province, string> = {
  GAUTENG: "Gauteng",
  WESTERN_CAPE: "W. Cape",
  KWAZULU_NATAL: "KZN",
  EASTERN_CAPE: "E. Cape",
  FREE_STATE: "Free State",
  OTHER: "Other",
};

const TIER_LABEL: Record<Tier, string> = {
  DORMANT: "Dormant",
  LIGHT: "Light",
  ACTIVE: "Active",
  HIGHLY_ACTIVE: "Highly active",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
        active
          ? "border-deep-teal bg-deep-teal text-white"
          : "border-line bg-white text-ink/70 hover:border-deep-teal/40",
      )}
    >
      {children}
    </button>
  );
}

// showTiers=false on modules where tier filtering is not meaningful.
export function FilterBar({ showTiers = true }: { showTiers?: boolean }) {
  const {
    dateFrom,
    dateTo,
    provinces,
    tiers,
    setDateRange,
    toggleProvince,
    toggleTier,
  } = useFilterStore();

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          min="2024-08-01"
          max={dateTo}
          onChange={(e) => setDateRange(e.target.value, dateTo)}
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
        />
        <span className="text-xs text-ink/40">to</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom}
          max="2026-07-31"
          onChange={(e) => setDateRange(dateFrom, e.target.value)}
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
        />
      </div>

      {/* Provinces */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PROVINCES.map((p) => (
          <Chip key={p} active={provinces.includes(p)} onClick={() => toggleProvince(p)}>
            {PROVINCE_LABEL[p]}
          </Chip>
        ))}
      </div>

      {/* Tiers */}
      {showTiers && (
        <div className="flex flex-wrap items-center gap-1.5">
          {TIERS.map((t) => (
            <Chip key={t} active={tiers.includes(t)} onClick={() => toggleTier(t)}>
              {TIER_LABEL[t]}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
