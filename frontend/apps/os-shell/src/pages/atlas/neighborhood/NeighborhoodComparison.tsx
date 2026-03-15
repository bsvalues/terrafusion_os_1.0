/**
 * BIV-119: Neighborhood Comparison Wizard
 * Side-by-side comparison of 2-4 neighborhoods.
 * Physical characteristics only -- NO value comparisons.
 * Atlas answers "where is it?" and "what is near it?"
 */
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NeighborhoodStats {
  id: string;
  name: string;
  parcelCount: number;
  avgSqFt: number;
  avgLotSize: number;
  avgYearBuilt: number;
  predominantZoning: string;
  color: string;
  center: [number, number];
  boundary?: [number, number][];
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const NEIGHBORHOODS: NeighborhoodStats[] = [
  {
    id: 'n1',
    name: 'Downtown',
    parcelCount: 1245,
    avgSqFt: 2800,
    avgLotSize: 4200,
    avgYearBuilt: 1968,
    predominantZoning: 'C-1',
    color: '#3B82F6',
    center: [46.23, -119.2],
  },
  {
    id: 'n2',
    name: 'Riverside',
    parcelCount: 3420,
    avgSqFt: 1950,
    avgLotSize: 7800,
    avgYearBuilt: 1998,
    predominantZoning: 'R-1',
    color: '#10B981',
    center: [46.24, -119.21],
  },
  {
    id: 'n3',
    name: 'West Hills',
    parcelCount: 2180,
    avgSqFt: 2400,
    avgLotSize: 9200,
    avgYearBuilt: 2005,
    predominantZoning: 'R-2',
    color: '#F59E0B',
    center: [46.25, -119.23],
  },
  {
    id: 'n4',
    name: 'Eastgate',
    parcelCount: 890,
    avgSqFt: 5600,
    avgLotSize: 15000,
    avgYearBuilt: 1982,
    predominantZoning: 'I-1',
    color: '#EF4444',
    center: [46.22, -119.18],
  },
  {
    id: 'n5',
    name: 'Southridge',
    parcelCount: 4100,
    avgSqFt: 1780,
    avgLotSize: 6500,
    avgYearBuilt: 2012,
    predominantZoning: 'R-1',
    color: '#8B5CF6',
    center: [46.21, -119.22],
  },
  {
    id: 'n6',
    name: 'Northview',
    parcelCount: 1560,
    avgSqFt: 2100,
    avgLotSize: 8800,
    avgYearBuilt: 1990,
    predominantZoning: 'R-2',
    color: '#EC4899',
    center: [46.26, -119.19],
  },
];

const MAX_SELECTIONS = 4;

const COMPARISON_FIELDS: { key: keyof NeighborhoodStats; label: string; format: (v: unknown) => string }[] = [
  { key: 'parcelCount', label: 'Parcel Count', format: (v) => Number(v).toLocaleString() },
  { key: 'avgSqFt', label: 'Avg Sq Ft', format: (v) => `${Number(v).toLocaleString()} sq ft` },
  { key: 'avgLotSize', label: 'Avg Lot Size', format: (v) => `${Number(v).toLocaleString()} sq ft` },
  { key: 'avgYearBuilt', label: 'Avg Year Built', format: (v) => String(v) },
  { key: 'predominantZoning', label: 'Predominant Zoning', format: (v) => String(v) },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NeighborhoodComparison() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= MAX_SELECTIONS) return prev;
        return [...prev, id];
      });
    },
    [],
  );

  const selectedNeighborhoods = useMemo(
    () => NEIGHBORHOODS.filter((n) => selectedIds.includes(n.id)),
    [selectedIds],
  );

  return (
    <div className="flex flex-col h-full bg-terra-midnight text-white">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-white/10">
        <h1 className="text-lg font-semibold text-terra-cyan">Neighborhood Comparison</h1>
        <p className="text-xs text-white/50 mt-1">
          Select 2-4 neighborhoods to compare physical characteristics
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Selection sidebar */}
        <aside className="w-56 flex-shrink-0 p-4 border-r border-white/10 overflow-y-auto">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Neighborhoods ({selectedIds.length}/{MAX_SELECTIONS})
          </p>
          <div className="space-y-2">
            {NEIGHBORHOODS.map((n) => {
              const isSelected = selectedIds.includes(n.id);
              const isDisabled = !isSelected && selectedIds.length >= MAX_SELECTIONS;
              return (
                <button
                  key={n.id}
                  onClick={() => toggleSelection(n.id)}
                  disabled={isDisabled}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all border ${
                    isSelected
                      ? 'border-terra-cyan/60 bg-terra-cyan/10 text-white'
                      : isDisabled
                        ? 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: n.color, opacity: isSelected ? 1 : 0.4 }}
                    />
                    {n.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Map area */}
          <div className="flex-1 relative bg-terra-midnight overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="nbhd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#nbhd-grid)" />
              </svg>
            </div>

            {NEIGHBORHOODS.map((n) => {
              const isSelected = selectedIds.includes(n.id);
              const xPct = ((n.center[1] + 119.24) / 0.08) * 100;
              const yPct = ((46.27 - n.center[0]) / 0.08) * 100;
              return (
                <div
                  key={n.id}
                  className="absolute transition-all duration-300"
                  style={{
                    left: `${Math.max(10, Math.min(85, xPct))}%`,
                    top: `${Math.max(10, Math.min(85, yPct))}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-[10px] font-medium transition-all"
                    style={{
                      width: isSelected ? 64 : 40,
                      height: isSelected ? 64 : 40,
                      backgroundColor: `${n.color}${isSelected ? '44' : '18'}`,
                      border: `2px solid ${n.color}${isSelected ? 'CC' : '44'}`,
                      boxShadow: isSelected ? `0 0 20px ${n.color}44` : 'none',
                      color: isSelected ? '#FFFFFF' : `${n.color}AA`,
                    }}
                  >
                    {n.name.substring(0, 2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison grid */}
          {selectedNeighborhoods.length >= 2 && (
            <div className="flex-shrink-0 border-t border-white/10 p-4 overflow-x-auto">
              <Card variant="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-terra-cyan">Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/40 font-normal">Metric</th>
                        {selectedNeighborhoods.map((n) => (
                          <th key={n.id} className="text-right py-2 font-medium" style={{ color: n.color }}>
                            {n.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_FIELDS.map((field) => (
                        <tr key={field.key} className="border-b border-white/5">
                          <td className="py-2 text-white/60">{field.label}</td>
                          {selectedNeighborhoods.map((n) => (
                            <td key={n.id} className="py-2 text-right text-white/90">
                              {field.format(n[field.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedNeighborhoods.length < 2 && (
            <div className="flex-shrink-0 border-t border-white/10 p-8 text-center text-white/30 text-sm">
              Select at least 2 neighborhoods to compare
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
