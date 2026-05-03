import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { atlasService, type GeoEquityArea } from '@/services/atlasService';
import { useAtlasSpatialStore } from '@/stores/atlasSpatialStore';

type PropertyTypeFilter = 'All' | string;
type GeoEquityReadState = 'loading' | 'live' | 'unavailable';

function equityColor(ratio: number): string {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= 0.03) return '#22C55E';
  if (deviation <= 0.07) return '#F59E0B';
  return '#EF4444';
}

function equityLabel(ratio: number): string {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= 0.03) return 'Equitable';
  if (deviation <= 0.07) return 'Moderate';
  return 'Needs review';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GeoEquityDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('All');
  const [areas, setAreas] = useState<GeoEquityArea[]>([]);
  const [source, setSource] = useState<string>('Loading live Benton County equity groups...');
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readState, setReadState] = useState<GeoEquityReadState>('loading');
  const fetchSpatialData = useAtlasSpatialStore((s) => s.fetchSpatialData);

  useEffect(() => {
    // Prime the spatial store so other Atlas surfaces share the same evidence.
    void fetchSpatialData();
  }, [fetchSpatialData]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setReadState('loading');
      try {
        const response = await atlasService.getGeoEquityAreas(25);
        if (cancelled) return;

        setAreas(response.areas);
        setSource(response.source);
        setAsOf(response.asOf);
        setReadState('live');
      } catch (loadError) {
        if (cancelled) return;
        setAreas([]);
        setSource('Live Benton County neighborhood equity groups unavailable.');
        setError(loadError instanceof Error ? loadError.message : 'GeoEquity could not load live Benton data.');
        setReadState('unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchSpatialData]);

  const propertyTypes = useMemo<PropertyTypeFilter[]>(
    () => ['All', ...Array.from(new Set(areas.map((area) => area.propertyTypeCategory))).sort()],
    [areas],
  );

  const filteredAreas = useMemo(
    () =>
      propertyTypeFilter === 'All'
        ? areas
        : areas.filter((area) => area.propertyTypeCategory === propertyTypeFilter),
    [areas, propertyTypeFilter],
  );

  const selectedArea = useMemo(
    () => filteredAreas.find((area) => area.id === selectedId) ?? null,
    [filteredAreas, selectedId],
  );

  const summary = useMemo(() => {
    if (filteredAreas.length === 0) {
      return {
        averageRatio: 0,
        equitableCount: 0,
        reviewCount: 0,
        parcelCount: 0,
      };
    }

    const totalParcels = filteredAreas.reduce((sum, area) => sum + area.parcelCount, 0);
    const weightedRatio = filteredAreas.reduce((sum, area) => sum + area.equityRatio * area.parcelCount, 0);

    return {
      averageRatio: totalParcels > 0 ? weightedRatio / totalParcels : 0,
      equitableCount: filteredAreas.filter((area) => Math.abs(area.equityRatio - 1) <= 0.03).length,
      reviewCount: filteredAreas.filter((area) => Math.abs(area.equityRatio - 1) > 0.07).length,
      parcelCount: totalParcels,
    };
  }, [filteredAreas]);

  return (
    <div data-testid="geo-equity-dashboard" className="flex h-full flex-col bg-terra-midnight text-white">
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1 overflow-hidden">
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

          <div className="absolute left-4 top-4 max-w-xl rounded border border-white/10 bg-terra-midnight/80 p-4 backdrop-blur-sm">
            <h1 className="text-lg font-semibold text-terra-cyan">GeoEquity Dashboard</h1>
            <p className="mt-1 text-sm text-white/70">
              Live Benton County neighborhood equity groups derived from the Assessor Prop Val layer.
            </p>
            <p className="mt-2 text-xs text-white/40">
              {loading
                ? 'Loading Benton County grouped ratios...'
                : error
                  ? error
                  : `${filteredAreas.length} live areas | ${source}${asOf ? ` | as of ${new Date(asOf).toLocaleString()}` : ''}`}
            </p>
            {readState === 'unavailable' && (
              <div
                data-testid="geo-equity-unavailable"
                className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
              >
                Live GeoEquity unavailable. Benton neighborhood equity groups are not being replaced with Atlas fixtures on this surface.
              </div>
            )}
          </div>

          {filteredAreas.map((area) => {
            const xPct = ((area.center[1] + 119.9) / 0.9) * 100;
            const yPct = ((46.45 - area.center[0]) / 0.4) * 100;
            const color = equityColor(area.equityRatio);
            const isSelected = selectedId === area.id;
            const size = 38 + Math.min(36, area.parcelCount / 45);

            return (
              <button
                key={area.id}
                onClick={() => setSelectedId(isSelected ? null : area.id)}
                className="absolute transition-all duration-300"
                style={{
                  left: `${Math.max(8, Math.min(92, xPct))}%`,
                  top: `${Math.max(8, Math.min(90, yPct))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`${area.name} ${area.propertyTypeCategory}: equity ratio ${area.equityRatio.toFixed(2)}`}
              >
                <div
                  className="flex flex-col items-center justify-center rounded-lg transition-all"
                  style={{
                    width: size,
                    height: size * 0.82,
                    backgroundColor: `${color}${isSelected ? '44' : '1F'}`,
                    border: `2px solid ${color}${isSelected ? 'DD' : '66'}`,
                    boxShadow: isSelected ? `0 0 20px ${color}44` : 'none',
                  }}
                >
                  <span className="text-xs font-bold" style={{ color }}>
                    {(area.equityRatio * 100).toFixed(0)}%
                  </span>
                  <span className="max-w-full truncate px-1 text-[9px] text-white/70">
                    {area.neighborhoodCode}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 rounded border border-white/10 bg-terra-midnight/80 p-3 backdrop-blur-sm">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Average Ratio Band</p>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> 97-103%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> 93-107%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Outside
              </span>
            </div>
          </div>
        </main>

        <aside className="w-80 flex-shrink-0 space-y-4 overflow-y-auto border-l border-white/10 p-4">
          <div className="flex flex-wrap gap-1">
            {propertyTypes.map((propertyType) => (
              <button
                key={propertyType}
                onClick={() => setPropertyTypeFilter(propertyType)}
                className={`rounded border px-2 py-1 text-xs transition-colors ${
                  propertyTypeFilter === propertyType
                    ? 'border-terra-cyan/40 bg-terra-cyan/20 text-terra-cyan'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'
                }`}
              >
                {propertyType}
              </button>
            ))}
          </div>

          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">County Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Weighted ratio</span>
                {readState === 'live' ? (
                  <span style={{ color: equityColor(summary.averageRatio) }}>
                    {(summary.averageRatio * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-white/50">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Parcels in view</span>
                <span>{readState === 'live' ? summary.parcelCount.toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Equitable groups</span>
                <span>{readState === 'live' ? summary.equitableCount : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Needs review</span>
                <span>{readState === 'live' ? summary.reviewCount : '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Area Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {filteredAreas.map((area) => (
                <button
                  key={area.id}
                  role="link"
                  onClick={() => setSelectedId(area.id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === area.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-white/75">{area.name}</span>
                    <span className="text-xs font-bold" style={{ color: equityColor(area.equityRatio) }}>
                      {(area.equityRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/45">
                    <span>{area.propertyTypeCategory}</span>
                    <span>{area.parcelCount.toLocaleString()} parcels</span>
                  </div>
                </button>
              ))}
              {!loading && filteredAreas.length === 0 && (
                <div className="rounded border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/50">
                  {readState === 'unavailable'
                    ? 'GeoEquity live data is unavailable. No Atlas fixture fallback is rendered on this surface.'
                    : 'No live GeoEquity areas matched this filter.'}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedArea && (
            <Card variant="glass" data-material="bento">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-terra-cyan">{selectedArea.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Neighborhood code</dt>
                    <dd>{selectedArea.neighborhoodCode}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Average ratio</dt>
                    <dd style={{ color: equityColor(selectedArea.equityRatio) }}>
                      {(selectedArea.equityRatio * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Spread</dt>
                    <dd>{selectedArea.ratioStdDev.toFixed(3)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Parcels</dt>
                    <dd>{selectedArea.parcelCount.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Display category</dt>
                    <dd>{selectedArea.propertyTypeCategory}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Source property type</dt>
                    <dd className="max-w-[11rem] text-right text-white/70">{selectedArea.propertyType}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/50">Avg market value</dt>
                    <dd>{formatCurrency(selectedArea.averageMarketValue)}</dd>
                  </div>
                  <div className="rounded border border-white/10 bg-white/5 p-3 text-xs text-white/55">
                    Live Benton County group. GeoEquity is showing grouped ratio evidence only; parcel repair still belongs in Workbench and county calibration still belongs in Forge.
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
