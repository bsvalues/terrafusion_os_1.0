/**
 * TFT-123: TerraGAMA Page
 * Map with parcel polygons colored by zoning, spatial filters, zoning analysis.
 * Filter bar for zoning type, neighborhood, property class.
 * Regulation overlay toggle.
 */
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GamaParcel {
  id: string;
  parcelNumber: string;
  address: string;
  neighborhood: string;
  zoning: string;
  propertyClass: string;
  sqft: number;
  yearBuilt: number;
  center: [number, number];
}

interface GamaFilters {
  zoning: string | null;
  neighborhood: string | null;
  propertyClass: string | null;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const GAMA_PARCELS: GamaParcel[] = [
  { id: 'g1', parcelNumber: '1-0234-001', address: '100 Main St', neighborhood: 'Downtown', zoning: 'C-1', propertyClass: 'Commercial', sqft: 4200, yearBuilt: 1985, center: [46.23, -119.2] },
  { id: 'g2', parcelNumber: '1-0234-002', address: '200 Oak Ave', neighborhood: 'Riverside', zoning: 'R-1', propertyClass: 'Residential', sqft: 1850, yearBuilt: 2001, center: [46.235, -119.21] },
  { id: 'g3', parcelNumber: '1-0234-003', address: '300 Industrial Pkwy', neighborhood: 'Eastgate', zoning: 'I-1', propertyClass: 'Industrial', sqft: 12000, yearBuilt: 1972, center: [46.225, -119.185] },
  { id: 'g4', parcelNumber: '1-0234-004', address: '400 Elm St', neighborhood: 'West Hills', zoning: 'R-2', propertyClass: 'Multi-Family', sqft: 3600, yearBuilt: 1995, center: [46.248, -119.225] },
  { id: 'g5', parcelNumber: '1-0234-005', address: '500 Country Rd', neighborhood: 'Southridge', zoning: 'AG', propertyClass: 'Agricultural', sqft: 2200, yearBuilt: 1960, center: [46.215, -119.22] },
  { id: 'g6', parcelNumber: '1-0234-006', address: '600 Pine St', neighborhood: 'Downtown', zoning: 'C-2', propertyClass: 'Commercial', sqft: 8500, yearBuilt: 2010, center: [46.232, -119.198] },
  { id: 'g7', parcelNumber: '1-0234-007', address: '700 Cedar Ln', neighborhood: 'Northview', zoning: 'R-1', propertyClass: 'Residential', sqft: 2100, yearBuilt: 2015, center: [46.258, -119.192] },
  { id: 'g8', parcelNumber: '1-0234-008', address: '800 River Rd', neighborhood: 'Riverside', zoning: 'PUD', propertyClass: 'Residential', sqft: 2800, yearBuilt: 2020, center: [46.242, -119.215] },
];

const ZONING_COLORS: Record<string, string> = {
  'R-1': '#22C55E', 'R-2': '#16A34A', 'R-3': '#15803D',
  'C-1': '#3B82F6', 'C-2': '#2563EB', 'C-3': '#1D4ED8',
  'I-1': '#F59E0B', 'I-2': '#D97706',
  AG: '#A3E635', PUD: '#A855F7',
};

const REGULATION_DATA: Record<string, { maxHeight: string; setback: string; lotCoverage: string; parking: string }> = {
  'R-1': { maxHeight: '35 ft', setback: '20 ft front', lotCoverage: '40%', parking: '2 spaces/unit' },
  'R-2': { maxHeight: '45 ft', setback: '15 ft front', lotCoverage: '50%', parking: '1.5 spaces/unit' },
  'C-1': { maxHeight: '50 ft', setback: '0 ft front', lotCoverage: '80%', parking: '1 space/500 sq ft' },
  'C-2': { maxHeight: '75 ft', setback: '0 ft front', lotCoverage: '90%', parking: '1 space/400 sq ft' },
  'I-1': { maxHeight: '60 ft', setback: '30 ft front', lotCoverage: '60%', parking: '1 space/1000 sq ft' },
  AG: { maxHeight: '35 ft', setback: '50 ft front', lotCoverage: '10%', parking: 'N/A' },
  PUD: { maxHeight: 'Per plan', setback: 'Per plan', lotCoverage: 'Per plan', parking: 'Per plan' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TerraGamaPage() {
  const [filters, setFilters] = useState<GamaFilters>({ zoning: null, neighborhood: null, propertyClass: null });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [showRegulations, setShowRegulations] = useState(false);

  const zonings = useMemo(() => [...new Set(GAMA_PARCELS.map((p) => p.zoning))].sort(), []);
  const neighborhoods = useMemo(() => [...new Set(GAMA_PARCELS.map((p) => p.neighborhood))].sort(), []);
  const propertyClasses = useMemo(() => [...new Set(GAMA_PARCELS.map((p) => p.propertyClass))].sort(), []);

  const filteredParcels = useMemo(() => {
    return GAMA_PARCELS.filter((p) => {
      if (filters.zoning && p.zoning !== filters.zoning) return false;
      if (filters.neighborhood && p.neighborhood !== filters.neighborhood) return false;
      if (filters.propertyClass && p.propertyClass !== filters.propertyClass) return false;
      return true;
    });
  }, [filters]);

  const selectedParcel = useMemo(
    () => filteredParcels.find((p) => p.id === selectedParcelId) ?? null,
    [filteredParcels, selectedParcelId],
  );

  const updateFilter = useCallback((key: keyof GamaFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedParcelId(null);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ zoning: null, neighborhood: null, propertyClass: null });
    setSelectedParcelId(null);
  }, []);

  const hasActiveFilters = filters.zoning || filters.neighborhood || filters.propertyClass;

  return (
    <div data-testid="terra-gama" className="flex flex-col h-full bg-terra-midnight text-white">
      {/* Filter bar */}
      <header className="flex-shrink-0 p-3 border-b border-white/10 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-terra-cyan">TerraGAMA</span>

        <select
          value={filters.zoning ?? ''}
          onChange={(e) => updateFilter('zoning', e.target.value || null)}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80"
          aria-label="Filter by zoning"
        >
          <option value="">All Zoning</option>
          {zonings.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        <select
          value={filters.neighborhood ?? ''}
          onChange={(e) => updateFilter('neighborhood', e.target.value || null)}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80"
          aria-label="Filter by neighborhood"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select
          value={filters.propertyClass ?? ''}
          onChange={(e) => updateFilter('propertyClass', e.target.value || null)}
          className="bg-terra-slate/40 border border-white/10 rounded px-2 py-1 text-xs text-white/80"
          aria-label="Filter by property class"
        >
          <option value="">All Classes</option>
          {propertyClasses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={showRegulations}
            onChange={(e) => setShowRegulations(e.target.checked)}
            className="accent-terra-cyan"
          />
          Regulations
        </label>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-terra-cyan hover:text-white transition-colors ml-auto">
            Clear All
          </button>
        )}

        <span className="text-[10px] text-white/30 ml-auto">
          {filteredParcels.length} parcels
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="gama-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gama-grid)" />
            </svg>
          </div>

          {filteredParcels.map((parcel) => {
            const xPct = ((parcel.center[1] + 119.23) / 0.06) * 100;
            const yPct = ((46.27 - parcel.center[0]) / 0.06) * 100;
            const color = ZONING_COLORS[parcel.zoning] ?? '#6B7280';
            const isSelected = selectedParcelId === parcel.id;

            return (
              <button
                key={parcel.id}
                onClick={() => setSelectedParcelId(isSelected ? null : parcel.id)}
                className="absolute transition-all duration-200"
                style={{
                  left: `${Math.max(5, Math.min(90, xPct))}%`,
                  top: `${Math.max(5, Math.min(90, yPct))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`Parcel ${parcel.parcelNumber} - ${parcel.zoning}`}
              >
                <div
                  className="rounded border-2 flex items-center justify-center text-[9px] font-medium transition-all"
                  style={{
                    width: 60,
                    height: 40,
                    backgroundColor: `${color}22`,
                    borderColor: isSelected ? '#FFFFFF' : `${color}88`,
                    boxShadow: isSelected ? `0 0 12px ${color}` : 'none',
                    color: isSelected ? '#FFFFFF' : `${color}CC`,
                  }}
                >
                  {parcel.zoning}
                </div>
              </button>
            );
          })}

          {/* Zoning legend */}
          <div data-material="bento" className="absolute bottom-4 left-4 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Zoning</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(ZONING_COLORS).map(([code, color]) => (
                <span key={code} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-white/60">{code}</span>
                </span>
              ))}
            </div>
          </div>
        </main>

        {/* Detail panel */}
        {selectedParcel && (
          <aside className="w-72 flex-shrink-0 border-l border-white/10 p-4 overflow-y-auto space-y-4">
            <Card variant="glass" data-material="bento">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-terra-cyan">Parcel Detail</CardTitle>
                  <button
                    onClick={() => setSelectedParcelId(null)}
                    className="text-white/40 hover:text-white text-lg"
                    aria-label="Close detail"
                  >
                    x
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-white/50">Parcel #</dt><dd className="text-white">{selectedParcel.parcelNumber}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Address</dt><dd className="text-white">{selectedParcel.address}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Neighborhood</dt><dd className="text-white">{selectedParcel.neighborhood}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Zoning</dt><dd className="text-white font-medium" style={{ color: ZONING_COLORS[selectedParcel.zoning] }}>{selectedParcel.zoning}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Class</dt><dd className="text-white">{selectedParcel.propertyClass}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Sq Ft</dt><dd className="text-white">{selectedParcel.sqft.toLocaleString()}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Year Built</dt><dd className="text-white">{selectedParcel.yearBuilt}</dd></div>
                </dl>
              </CardContent>
            </Card>

            {showRegulations && REGULATION_DATA[selectedParcel.zoning] && (
              <Card variant="glass" data-material="bento">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">
                    {selectedParcel.zoning} Regulations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(REGULATION_DATA[selectedParcel.zoning]).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-white/50 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                        <dd className="text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
