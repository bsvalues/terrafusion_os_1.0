/**
 * TFR-057: GeoEquity Dashboard
 * Spatial VISUALIZATION of assessment equity data.
 * Choropleth map by neighborhood/area showing equity distribution.
 * Atlas renders the map -- Forge computed the ratios.
 *
 * DATA POSTURE:
 * - Equity areas come from `useAtlasSpatialStore` (API-backed via `fetchSpatialData`).
 * - When the store returns no data (API unavailable or empty), `FALLBACK_EQUITY_AREAS`
 *   fixtures are displayed. DemoDataBanner is shown until backend confirms live data.
 * - `isFixture` starts `true` (conservative default) and is cleared only when
 *   the store holds a non-empty live result after `fetchSpatialData` resolves.
 */
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { useAtlasSpatialStore } from '@/stores/atlasSpatialStore';
import { EQUITY_AREAS as FALLBACK_EQUITY_AREAS } from '@/data/atlasSpatialFixtures';
import type { EquityArea } from '@/data/atlasSpatialFixtures';

export type { EquityArea };

type PropertyTypeFilter = 'All' | 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function equityColor(ratio: number): string {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= 0.03) return '#22C55E'; // green: 0.97-1.03
  if (deviation <= 0.07) return '#F59E0B'; // yellow: 0.93-1.07
  return '#EF4444'; // red: outside 0.93-1.07
}

function equityLabel(ratio: number): string {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= 0.03) return 'Equitable';
  if (deviation <= 0.07) return 'Moderate';
  return 'Inequitable';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GeoEquityDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('All');
  const [isFixture, setIsFixture] = useState(true);

  // Consume from store if available, fall back to fixtures
  const storeAreas = useAtlasSpatialStore((s) => s.equityAreas);
  const fetchSpatialData = useAtlasSpatialStore((s) => s.fetchSpatialData);
  const EQUITY_AREAS = storeAreas.length > 0 ? storeAreas : FALLBACK_EQUITY_AREAS;

  useEffect(() => {
    fetchSpatialData().then(() => {
      const areas = useAtlasSpatialStore.getState().equityAreas;
      // Banner clears only when backend returns non-empty live data.
      // Length-only check avoids fragile reference-equality against the import.
      setIsFixture(areas.length === 0);
    });
  }, [fetchSpatialData]);

  const filteredAreas = useMemo(
    () =>
      propertyTypeFilter === 'All'
        ? EQUITY_AREAS
        : EQUITY_AREAS.filter((a) => a.propertyType === propertyTypeFilter),
    [propertyTypeFilter, EQUITY_AREAS],
  );

  const selectedArea = useMemo(
    () => filteredAreas.find((a) => a.id === selectedId) ?? null,
    [filteredAreas, selectedId],
  );

  const propertyTypes: PropertyTypeFilter[] = ['All', 'Residential', 'Commercial', 'Industrial', 'Agricultural'];

  return (
    <div data-testid="geo-equity-dashboard" className="flex flex-col h-full bg-terra-midnight text-white">
      {isFixture && <DemoDataBanner module="GeoEquity" />}
      <div className="flex flex-1 overflow-hidden">
      {/* Map */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="eq-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#eq-grid)" />
          </svg>
        </div>

        {/* Choropleth areas */}
        {filteredAreas.map((area) => {
          const xPct = ((area.center[1] + 119.26) / 0.1) * 100;
          const yPct = ((46.27 - area.center[0]) / 0.08) * 100;
          const color = equityColor(area.equityRatio);
          const isSelected = selectedId === area.id;
          const size = 50 + area.parcelCount / 40;

          return (
            <button
              key={area.id}
              onClick={() => setSelectedId(isSelected ? null : area.id)}
              className="absolute transition-all duration-300"
              style={{
                left: `${Math.max(8, Math.min(88, xPct))}%`,
                top: `${Math.max(8, Math.min(88, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${area.name}: equity ratio ${area.equityRatio.toFixed(2)}`}
            >
              <div
                className="rounded-lg flex flex-col items-center justify-center transition-all"
                style={{
                  width: size,
                  height: size * 0.75,
                  backgroundColor: `${color}${isSelected ? '44' : '22'}`,
                  border: `2px solid ${color}${isSelected ? 'DD' : '66'}`,
                  boxShadow: isSelected ? `0 0 20px ${color}44` : 'none',
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>
                  {(area.equityRatio * 100).toFixed(0)}%
                </span>
                <span className="text-[8px] text-white/60 truncate max-w-full px-1">
                  {area.name}
                </span>
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Equity Ratio</p>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> 97-103%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> 93-107%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Outside
            </span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button className="w-8 h-8 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:text-white text-lg" aria-label="Zoom in">+</button>
          <button className="w-8 h-8 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:text-white text-lg" aria-label="Zoom out">-</button>
        </div>
      </main>

      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-l border-white/10 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-semibold text-terra-cyan">GeoEquity Dashboard</h1>
        <p className="text-xs text-white/40">Spatial visualization of assessment equity by area</p>

        {/* Property type filter */}
        <div className="flex flex-wrap gap-1">
          {propertyTypes.map((pt) => (
            <button
              key={pt}
              onClick={() => setPropertyTypeFilter(pt)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                propertyTypeFilter === pt
                  ? 'bg-terra-cyan/20 text-terra-cyan border border-terra-cyan/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              {pt}
            </button>
          ))}
        </div>

        {/* Summary */}
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Area Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredAreas.map((area) => {
              const color = equityColor(area.equityRatio);
              return (
                <button
                  key={area.id}
                  role="link"
                  onClick={() => setSelectedId(area.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                    selectedId === area.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-white/70">{area.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{equityLabel(area.equityRatio)}</span>
                    <span className="font-bold text-xs" style={{ color }}>
                      {(area.equityRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected detail */}
        {selectedArea && (
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-terra-cyan">{selectedArea.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/50">Equity Ratio</dt>
                  <dd className="font-bold" style={{ color: equityColor(selectedArea.equityRatio) }}>
                    {(selectedArea.equityRatio * 100).toFixed(1)}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">COD</dt>
                  <dd className="text-white">{selectedArea.cod.toFixed(1)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">PRD</dt>
                  <dd className="text-white">{selectedArea.prd.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Parcels</dt>
                  <dd className="text-white">{selectedArea.parcelCount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Property Type</dt>
                  <dd className="text-white">{selectedArea.propertyType}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </aside>
      </div>
    </div>
  );
}
