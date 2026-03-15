/**
 * TFR-057: GeoEquity Dashboard
 * Spatial VISUALIZATION of assessment equity data.
 * Choropleth map by neighborhood/area showing equity distribution.
 * Atlas renders the map -- Forge computed the ratios.
 */
import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EquityArea {
  id: string;
  name: string;
  equityRatio: number; // e.g. 0.95 = 95% COD
  cod: number; // coefficient of dispersion
  prd: number; // price-related differential
  parcelCount: number;
  propertyType: string;
  center: [number, number];
}

type PropertyTypeFilter = 'All' | 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural';

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const EQUITY_AREAS: EquityArea[] = [
  { id: 'ea1', name: 'Downtown', equityRatio: 0.96, cod: 12.5, prd: 1.02, parcelCount: 1245, propertyType: 'Commercial', center: [46.23, -119.2] },
  { id: 'ea2', name: 'Riverside', equityRatio: 0.98, cod: 8.2, prd: 1.01, parcelCount: 3420, propertyType: 'Residential', center: [46.24, -119.21] },
  { id: 'ea3', name: 'West Hills', equityRatio: 1.03, cod: 10.1, prd: 1.03, parcelCount: 2180, propertyType: 'Residential', center: [46.25, -119.23] },
  { id: 'ea4', name: 'Eastgate', equityRatio: 0.89, cod: 18.4, prd: 1.08, parcelCount: 890, propertyType: 'Industrial', center: [46.22, -119.18] },
  { id: 'ea5', name: 'Southridge', equityRatio: 1.01, cod: 7.5, prd: 1.0, parcelCount: 4100, propertyType: 'Residential', center: [46.21, -119.22] },
  { id: 'ea6', name: 'Northview', equityRatio: 0.93, cod: 14.2, prd: 1.05, parcelCount: 1560, propertyType: 'Residential', center: [46.26, -119.19] },
  { id: 'ea7', name: 'Farm District', equityRatio: 0.87, cod: 22.0, prd: 1.12, parcelCount: 420, propertyType: 'Agricultural', center: [46.215, -119.25] },
];

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

  const filteredAreas = useMemo(
    () =>
      propertyTypeFilter === 'All'
        ? EQUITY_AREAS
        : EQUITY_AREAS.filter((a) => a.propertyType === propertyTypeFilter),
    [propertyTypeFilter],
  );

  const selectedArea = useMemo(
    () => filteredAreas.find((a) => a.id === selectedId) ?? null,
    [filteredAreas, selectedId],
  );

  const propertyTypes: PropertyTypeFilter[] = ['All', 'Residential', 'Commercial', 'Industrial', 'Agricultural'];

  return (
    <div className="flex h-full bg-terra-midnight text-white">
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
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Area Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredAreas.map((area) => {
              const color = equityColor(area.equityRatio);
              return (
                <button
                  key={area.id}
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
          <Card variant="glass">
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
  );
}
