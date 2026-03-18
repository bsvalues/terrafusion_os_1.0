/**
 * TFT-122: Smart Filter Bar for GAMA
 * Filter by neighborhood, zoning, property class, year built range, sq ft range.
 * Active filter chips with remove. Clear all button.
 */
import { useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartFilterState {
  neighborhood: string | null;
  zoning: string | null;
  propertyClass: string | null;
  yearBuiltMin: number | null;
  yearBuiltMax: number | null;
  sqftMin: number | null;
  sqftMax: number | null;
}

export interface SmartFilterBarProps {
  filters: SmartFilterState;
  onFilterChange: (filters: SmartFilterState) => void;
  neighborhoods?: string[];
  zonings?: string[];
  propertyClasses?: string[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_NEIGHBORHOODS = ['Downtown', 'Riverside', 'West Hills', 'Eastgate', 'Southridge', 'Northview'];
const DEFAULT_ZONINGS = ['R-1', 'R-2', 'R-3', 'C-1', 'C-2', 'I-1', 'I-2', 'AG', 'PUD'];
const DEFAULT_CLASSES = ['Residential', 'Commercial', 'Industrial', 'Multi-Family', 'Agricultural', 'Vacant'];

export const EMPTY_FILTERS: SmartFilterState = {
  neighborhood: null,
  zoning: null,
  propertyClass: null,
  yearBuiltMin: null,
  yearBuiltMax: null,
  sqftMin: null,
  sqftMax: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SmartFilterBar({
  filters,
  onFilterChange,
  neighborhoods = DEFAULT_NEIGHBORHOODS,
  zonings = DEFAULT_ZONINGS,
  propertyClasses = DEFAULT_CLASSES,
  className = '',
}: SmartFilterBarProps) {
  const update = useCallback(
    (partial: Partial<SmartFilterState>) => {
      onFilterChange({ ...filters, ...partial });
    },
    [filters, onFilterChange],
  );

  const clearAll = useCallback(() => {
    onFilterChange(EMPTY_FILTERS);
  }, [onFilterChange]);

  const removeFilter = useCallback(
    (key: keyof SmartFilterState) => {
      update({ [key]: null });
    },
    [update],
  );

  const activeChips = useMemo(() => {
    const chips: { key: keyof SmartFilterState; label: string }[] = [];
    if (filters.neighborhood) chips.push({ key: 'neighborhood', label: `Nbhd: ${filters.neighborhood}` });
    if (filters.zoning) chips.push({ key: 'zoning', label: `Zone: ${filters.zoning}` });
    if (filters.propertyClass) chips.push({ key: 'propertyClass', label: `Class: ${filters.propertyClass}` });
    if (filters.yearBuiltMin != null) chips.push({ key: 'yearBuiltMin', label: `Year >= ${filters.yearBuiltMin}` });
    if (filters.yearBuiltMax != null) chips.push({ key: 'yearBuiltMax', label: `Year <= ${filters.yearBuiltMax}` });
    if (filters.sqftMin != null) chips.push({ key: 'sqftMin', label: `SqFt >= ${filters.sqftMin.toLocaleString()}` });
    if (filters.sqftMax != null) chips.push({ key: 'sqftMax', label: `SqFt <= ${filters.sqftMax.toLocaleString()}` });
    return chips;
  }, [filters]);

  const hasFilters = activeChips.length > 0;

  return (
    <div className={`bg-terra-midnight border-b border-white/10 ${className}`}>
      {/* Filter controls */}
      <div className="flex items-center gap-2 p-2 flex-wrap">
        {/* Neighborhood */}
        <select
          value={filters.neighborhood ?? ''}
          onChange={(e) => update({ neighborhood: e.target.value || null })}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-terra-cyan/40"
          aria-label="Neighborhood filter"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Zoning */}
        <select
          value={filters.zoning ?? ''}
          onChange={(e) => update({ zoning: e.target.value || null })}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-terra-cyan/40"
          aria-label="Zoning filter"
        >
          <option value="">All Zoning</option>
          {zonings.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        {/* Property class */}
        <select
          value={filters.propertyClass ?? ''}
          onChange={(e) => update({ propertyClass: e.target.value || null })}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-terra-cyan/40"
          aria-label="Property class filter"
        >
          <option value="">All Classes</option>
          {propertyClasses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Year built range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Year min"
            value={filters.yearBuiltMin ?? ''}
            onChange={(e) => update({ yearBuiltMin: e.target.value ? Number(e.target.value) : null })}
            className="w-20 bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-terra-cyan/40"
            aria-label="Minimum year built"
          />
          <span className="text-white/30 text-xs">-</span>
          <input
            type="number"
            placeholder="Year max"
            value={filters.yearBuiltMax ?? ''}
            onChange={(e) => update({ yearBuiltMax: e.target.value ? Number(e.target.value) : null })}
            className="w-20 bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-terra-cyan/40"
            aria-label="Maximum year built"
          />
        </div>

        {/* Sq ft range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="SqFt min"
            value={filters.sqftMin ?? ''}
            onChange={(e) => update({ sqftMin: e.target.value ? Number(e.target.value) : null })}
            className="w-20 bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-terra-cyan/40"
            aria-label="Minimum square footage"
          />
          <span className="text-white/30 text-xs">-</span>
          <input
            type="number"
            placeholder="SqFt max"
            value={filters.sqftMax ?? ''}
            onChange={(e) => update({ sqftMax: e.target.value ? Number(e.target.value) : null })}
            className="w-20 bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-terra-cyan/40"
            aria-label="Maximum square footage"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-terra-cyan hover:text-white transition-colors ml-auto"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex items-center gap-1.5 px-2 pb-2 flex-wrap">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-terra-cyan/15 text-terra-cyan border border-terra-cyan/30"
            >
              {chip.label}
              <button
                onClick={() => removeFilter(chip.key)}
                className="hover:text-white transition-colors ml-0.5"
                aria-label={`Remove ${chip.label} filter`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
