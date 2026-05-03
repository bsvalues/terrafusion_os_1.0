/**
 * MassAppraisalGIS
 * Live Benton County parcel map for county-scale Atlas review.
 *
 * Data posture:
 * - Live ArcGIS parcel polygons via POST /api/atlas/mass-appraisal/parcels
 * - Live county valuation stats via GET /api/atlas/stats
 * - No demo parcel fallback
 * - Explicit empty/error states when live data is unavailable
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  atlasService,
  type MassAppraisalFeature,
  type MassAppraisalFeatureCollection,
  type SpatialStats,
} from '@/services/atlasService';

type OverlayMode = 'propertyType' | 'neighborhood' | 'ratio' | 'zoning';
type AuditMetric = 'residuals' | 'uniformity' | 'zoning';
type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface ViewBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

interface AuditSummary {
  title: string;
  narrative: string;
  hotspotCount: number;
  recommendedAction: string;
}

interface ParcelSummary {
  parcelId: string;
  address: string;
  propertyType: string;
  neighborhood: string;
  zoning: string;
  marketValue: number | null;
  currentRatio: number | null;
  areaSqFt: number | null;
}

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  'Resource Production and Extraction & Agriculture': '#84cc16',
  'Undeveloped Land and Water': '#94a3b8',
  Residential: '#22c55e',
  Commercial: '#38bdf8',
  Industrial: '#f59e0b',
  'Multi-Family': '#8b5cf6',
  default: '#20d4c8',
};

const ZONING_COLORS: Record<string, string> = {
  'RL-40': '#0ea5e9',
  'R-1': '#22c55e',
  'R-2': '#16a34a',
  'C-1': '#38bdf8',
  'C-2': '#0284c7',
  AG: '#84cc16',
  default: '#f59e0b',
};

const MAP_WIDTH = 1080;
const MAP_HEIGHT = 720;
const MAP_PADDING = 24;

function getFeatureRings(
  feature: MassAppraisalFeature,
): [number, number][][] {
  const { geometry } = feature;
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ring as [number, number][]);
  }

  return geometry.coordinates.flatMap((polygon) =>
    polygon.map((ring) => ring as [number, number][]),
  );
}

function getViewBounds(features: MassAppraisalFeature[]): ViewBounds | null {
  const coordinates = features.flatMap((feature) =>
    getFeatureRings(feature).flatMap((ring) => ring),
  );

  if (coordinates.length === 0) return null;

  const [firstLng, firstLat] = coordinates[0];
  return coordinates.reduce<ViewBounds>(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    { minLng: firstLng, maxLng: firstLng, minLat: firstLat, maxLat: firstLat },
  );
}

function projectPoint([lng, lat]: [number, number], bounds: ViewBounds): [number, number] {
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
  const x = MAP_PADDING + ((lng - bounds.minLng) / lngSpan) * (MAP_WIDTH - MAP_PADDING * 2);
  const y = MAP_HEIGHT - MAP_PADDING - ((lat - bounds.minLat) / latSpan) * (MAP_HEIGHT - MAP_PADDING * 2);
  return [x, y];
}

function ringToPath(ring: [number, number][], bounds: ViewBounds): string {
  return ring
    .map((point, index) => {
      const [x, y] = projectPoint(point, bounds);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

function featureToPath(feature: MassAppraisalFeature, bounds: ViewBounds): string {
  return getFeatureRings(feature)
    .filter((ring) => ring.length >= 3)
    .map((ring) => ringToPath(ring, bounds))
    .join(' ');
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'Unavailable';
  return value.toFixed(2);
}

function summarizeParcel(feature: MassAppraisalFeature): ParcelSummary {
  const properties = feature.properties ?? {};
  return {
    parcelId: properties.Parcel_ID ?? feature.id?.toString() ?? 'Unknown',
    address: properties.situs_display?.replace(/\s+/g, ' ').trim() || 'Unknown address',
    propertyType: properties.Property_Type ?? 'Unknown type',
    neighborhood: properties.neighborhood ?? 'Unknown neighborhood',
    zoning: properties.zoning ?? 'Unzoned/blank',
    marketValue: properties.TotalMarketValue ?? properties.ASSESSED_VAL ?? null,
    currentRatio: properties.Current_Ratio ?? null,
    areaSqFt: properties.Shape__Area ?? null,
  };
}

function getOverlayColor(mode: OverlayMode, feature: MassAppraisalFeature): string {
  const properties = feature.properties ?? {};
  if (mode === 'propertyType') {
    return PROPERTY_TYPE_COLORS[properties.Property_Type ?? 'default'] ?? PROPERTY_TYPE_COLORS.default;
  }
  if (mode === 'zoning') {
    return ZONING_COLORS[properties.zoning ?? 'default'] ?? ZONING_COLORS.default;
  }
  if (mode === 'neighborhood') {
    const neighborhood = properties.neighborhood ?? 'default';
    const digits = neighborhood.replace(/\D/g, '');
    const hue = digits ? parseInt(digits.slice(-3), 10) % 360 : 190;
    return `hsl(${hue} 75% 58%)`;
  }

  const ratio = properties.Current_Ratio;
  if (ratio == null) return '#94a3b8';
  if (ratio < 0.9) return '#ef4444';
  if (ratio > 1.1) return '#f59e0b';
  return '#22c55e';
}

function buildAuditSummary(features: MassAppraisalFeature[], metric: AuditMetric): AuditSummary {
  const parcels = features.map(summarizeParcel);
  const ratioOutliers = parcels.filter((parcel) => parcel.currentRatio != null && (parcel.currentRatio < 0.9 || parcel.currentRatio > 1.1));
  const missingZoning = parcels.filter((parcel) => parcel.zoning === 'Unzoned/blank');

  const neighborhoodCounts = parcels.reduce<Record<string, number>>((acc, parcel) => {
    acc[parcel.neighborhood] = (acc[parcel.neighborhood] ?? 0) + 1;
    return acc;
  }, {});

  const dominantNeighborhood =
    Object.entries(neighborhoodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'countywide';

  if (metric === 'zoning') {
    return {
      title: 'Live zoning audit',
      narrative: `${missingZoning.length} of ${parcels.length} live parcels in the current slice are missing zoning labels. The heaviest concentration is around ${dominantNeighborhood}.`,
      hotspotCount: missingZoning.length,
      recommendedAction: missingZoning.length > 0
        ? 'Review zoning overlays in Atlas before routing parcel corrections to Workbench.'
        : 'Zoning labels are present for this live slice. Continue parcel review by neighborhood.',
    };
  }

  if (metric === 'uniformity') {
    const neighborhoodsWithSpread = Object.values(
      parcels.reduce<Record<string, number[]>>((acc, parcel) => {
        if (parcel.currentRatio == null) return acc;
        if (!acc[parcel.neighborhood]) acc[parcel.neighborhood] = [];
        acc[parcel.neighborhood].push(parcel.currentRatio);
        return acc;
      }, {}),
    ).filter((ratios) => ratios.length >= 2 && Math.max(...ratios) - Math.min(...ratios) > 0.18);

    return {
      title: 'Live uniformity review',
      narrative: `${neighborhoodsWithSpread.length} neighborhood clusters show ratio spread above 0.18 in the current live slice. ${dominantNeighborhood} is the current dominant geography.`,
      hotspotCount: neighborhoodsWithSpread.length,
      recommendedAction: neighborhoodsWithSpread.length > 0
        ? 'Drill into the widest ratio-spread cluster, then send parcel defects to Workbench before any county calibration discussion.'
        : 'Current live slice is within the expected ratio spread threshold. Expand the parcel slice or change the filter to continue county review.',
    };
  }

  return {
    title: 'Live residual review',
    narrative: `${ratioOutliers.length} parcels in the current live slice are outside the 0.90-1.10 ratio band. ${dominantNeighborhood} contains the densest parcel concentration in view.`,
    hotspotCount: ratioOutliers.length,
    recommendedAction: ratioOutliers.length > 0
      ? 'Audit the outlier parcels first, then route confirmed parcel defects to ParcelLens or Workbench before discussing TerraForge adjustments.'
      : 'No ratio outliers in the current slice. Expand the search or shift to uniformity review.',
  };
}

function MapPanel({
  features,
  bounds,
  overlayMode,
  selectedParcelId,
  onSelectParcel,
}: {
  features: MassAppraisalFeature[];
  bounds: ViewBounds | null;
  overlayMode: OverlayMode;
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
}) {
  if (!bounds || features.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-terra-slate/40">
        <p className="text-sm text-white/60">No live parcel geometry is available for the current Atlas slice.</p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="h-full w-full"
      aria-label="Mass appraisal parcel map"
    >
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#05161d" />
      {features.map((feature) => {
        const parcel = summarizeParcel(feature);
        const pathData = featureToPath(feature, bounds);
        const fill = getOverlayColor(overlayMode, feature);
        const isSelected = selectedParcelId === parcel.parcelId;

        if (!pathData) return null;

        return (
          <path
            key={parcel.parcelId}
            d={pathData}
            fill={fill}
            fillOpacity={isSelected ? 0.48 : 0.28}
            stroke={isSelected ? '#ffffff' : '#7dd3fc'}
            strokeOpacity={isSelected ? 0.95 : 0.45}
            strokeWidth={isSelected ? 2.2 : 0.8}
            onClick={() => onSelectParcel(parcel.parcelId)}
            style={{ cursor: 'pointer' }}
          >
            <title>{`${parcel.parcelId} | ${parcel.address} | ${parcel.propertyType}`}</title>
          </path>
        );
      })}
    </svg>
  );
}

export default function MassAppraisalGIS() {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('propertyType');
  const [auditMetric, setAuditMetric] = useState<AuditMetric>('residuals');
  const [query, setQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<SpatialStats | null>(null);
  const [featureCollection, setFeatureCollection] = useState<MassAppraisalFeatureCollection | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const loadParcelSlice = useCallback(
    async (options?: { query?: string; propertyType?: string }) => {
      setLoadState('loading');
      setErrorMessage(null);

      try {
        const data = await atlasService.searchMassAppraisalParcels({
          query: options?.query,
          propertyType: options?.propertyType,
          limit: 25,
        });
        setFeatureCollection(data);

        const firstParcel = data.features[0]?.properties?.Parcel_ID ?? null;
        setSelectedParcelId((current) =>
          current && data.features.some((feature) => feature.properties?.Parcel_ID === current)
            ? current
            : firstParcel,
        );
        setLoadState('success');
      } catch (error) {
        setFeatureCollection(null);
        setSelectedParcelId(null);
        setLoadState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Atlas could not load live parcel geometry.');
      }
    },
    [],
  );

  useEffect(() => {
    atlasService.getMassAppraisalStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    void loadParcelSlice();
  }, [loadParcelSlice]);

  const features = featureCollection?.features ?? [];
  const bounds = useMemo(() => getViewBounds(features), [features]);
  const selectedFeature = useMemo(
    () =>
      features.find((feature) => feature.properties?.Parcel_ID === selectedParcelId) ?? null,
    [features, selectedParcelId],
  );
  const selectedParcel = selectedFeature ? summarizeParcel(selectedFeature) : null;
  const auditSummary = useMemo(() => buildAuditSummary(features, auditMetric), [features, auditMetric]);
  const visibleMarketValue = useMemo(
    () =>
      features.reduce(
        (sum, feature) =>
          sum + (feature.properties?.TotalMarketValue ?? feature.properties?.ASSESSED_VAL ?? 0),
        0,
      ),
    [features],
  );

  const propertyTypeOptions = useMemo(() => {
    const fromStats = stats?.typeBreakdown?.map((entry) => entry.type).filter(Boolean) ?? [];
    const fromFeatures = features
      .map((feature) => feature.properties?.Property_Type)
      .filter((value): value is string => Boolean(value));
    return ['all', ...Array.from(new Set([...fromStats, ...fromFeatures]))];
  }, [features, stats]);

  const handleSearchSubmit = useCallback(() => {
    void loadParcelSlice({
      query: query.trim() || undefined,
      propertyType: propertyTypeFilter === 'all' ? undefined : propertyTypeFilter,
    });
  }, [loadParcelSlice, propertyTypeFilter, query]);

  return (
    <div data-testid="mass-appraisal-gis" className="flex h-full bg-terra-midnight text-white">
      <aside className="flex w-[22rem] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 p-4">
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-terra-cyan">Live parcel slice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div data-testid="mass-appraisal-live-state" className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Data posture</p>
              <p className="mt-1 text-sm text-white/80">
                {loadState === 'loading' && 'Loading live Benton parcel geometry.'}
                {loadState === 'success' &&
                  `Live Benton County ArcGIS geometry and ${
                    stats?.layers?.includes('benton-arcgis-mass-appraisal-fy2025')
                      ? 'county market stats from Benton ArcGIS.'
                      : 'Atlas county stats.'
                  }`}
                {loadState === 'error' && 'Live Atlas query failed. No demo fallback is shown.'}
                {loadState === 'idle' && 'Preparing live Atlas query.'}
              </p>
            </div>

            <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
              Parcel search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Parcel ID or situs"
                className="mt-2 w-full rounded border border-white/10 bg-terra-slate/70 px-3 py-2 text-sm text-white outline-none"
              />
            </label>

            <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
              Property type
              <select
                value={propertyTypeFilter}
                onChange={(event) => setPropertyTypeFilter(event.target.value)}
                className="mt-2 w-full rounded border border-white/10 bg-terra-slate/70 px-3 py-2 text-sm text-white"
              >
                {propertyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All property types' : option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={loadState === 'loading'}
              className="w-full rounded border border-terra-cyan/40 bg-terra-cyan/10 px-3 py-2 text-sm font-medium text-terra-cyan transition-colors hover:bg-terra-cyan/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadState === 'loading' ? 'Loading live parcels...' : 'Refresh live slice'}
            </button>
          </CardContent>
        </Card>

        <Card variant="glass" data-material="bento" data-testid="mass-appraisal-governed-brief">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-terra-cyan">Live county audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-xs uppercase tracking-[0.2em] text-white/40">
              Audit focus
              <select
                value={auditMetric}
                onChange={(event) => setAuditMetric(event.target.value as AuditMetric)}
                className="mt-2 w-full rounded border border-white/10 bg-terra-slate/70 px-3 py-2 text-sm text-white"
              >
                <option value="residuals">Residual review</option>
                <option value="uniformity">Uniformity review</option>
                <option value="zoning">Zoning review</option>
              </select>
            </label>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">{auditSummary.title}</p>
              <p className="mt-2 text-sm text-white/80">{auditSummary.narrative}</p>
              <p className="mt-2 text-xs text-white/60">Hotspots: {auditSummary.hotspotCount}</p>
              <p className="mt-2 text-xs text-white/70">{auditSummary.recommendedAction}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-terra-cyan">County posture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/60">Visible parcels</span>
              <span className="font-semibold text-white">{features.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/60">Visible market value</span>
              <span className="font-semibold text-white">{formatCurrency(visibleMarketValue)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/60">County parcel count</span>
              <span className="font-semibold text-white">
                {stats ? stats.totalParcels.toLocaleString() : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-white/60">County avg market value</span>
              <span className="font-semibold text-white">
                {stats ? formatCurrency(stats.averageMarketValue ?? stats.averageAssessedValue) : 'Loading...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Mass Appraisal GIS</h2>
            <p className="mt-1 text-sm text-white/50">
              Live Benton parcel geometry from the AssessorPropVal polygon layer. No demo parcel cloud.
            </p>
          </div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/40">
            Overlay
            <select
              value={overlayMode}
              onChange={(event) => setOverlayMode(event.target.value as OverlayMode)}
              className="ml-3 rounded border border-white/10 bg-terra-slate/70 px-3 py-2 text-sm text-white"
            >
              <option value="propertyType">Property type</option>
              <option value="neighborhood">Neighborhood</option>
              <option value="ratio">Current ratio</option>
              <option value="zoning">Zoning</option>
            </select>
          </label>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="min-h-[26rem] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#041118]">
            {loadState === 'error' ? (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">Live Atlas parcel query failed</p>
                  <p className="mt-2 text-sm text-white/60">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-4 rounded border border-terra-cyan/40 bg-terra-cyan/10 px-4 py-2 text-sm font-medium text-terra-cyan"
                  >
                    Retry live query
                  </button>
                </div>
              </div>
            ) : (
              <MapPanel
                features={features}
                bounds={bounds}
                overlayMode={overlayMode}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card variant="glass" data-material="bento">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-terra-cyan">Live parcel results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {featureCollection?.properties?.exceededTransferLimit && (
                  <div className="rounded border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-100">
                    ArcGIS returned a transfer limit notice. Refine the slice if you need a narrower geography.
                  </div>
                )}

                {features.length === 0 && loadState === 'success' ? (
                  <div className="rounded border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    No live parcels matched the current Atlas filter.
                  </div>
                ) : (
                  <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                    {features.map((feature) => {
                      const parcel = summarizeParcel(feature);
                      const isSelected = parcel.parcelId === selectedParcelId;

                      return (
                        <button
                          key={parcel.parcelId}
                          type="button"
                          onClick={() => setSelectedParcelId(parcel.parcelId)}
                          className="w-full rounded-lg border px-3 py-3 text-left transition-colors"
                          style={{
                            borderColor: isSelected ? 'rgba(32,212,200,0.55)' : 'rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(32,212,200,0.12)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{parcel.address}</p>
                              <p className="mt-1 text-xs text-white/50">{parcel.parcelId}</p>
                            </div>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/70">
                              {parcel.propertyType}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                            <span>Neighborhood: {parcel.neighborhood}</span>
                            <span>Ratio: {formatRatio(parcel.currentRatio)}</span>
                            <span>Market: {formatCurrency(parcel.marketValue)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="glass" data-material="bento">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-terra-cyan">Selected parcel</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedParcel ? (
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Parcel ID</dt>
                      <dd className="font-mono text-right text-white">{selectedParcel.parcelId}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Address</dt>
                      <dd className="text-right text-white">{selectedParcel.address}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Property type</dt>
                      <dd className="text-right text-white">{selectedParcel.propertyType}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Neighborhood</dt>
                      <dd className="text-right text-white">{selectedParcel.neighborhood}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Zoning</dt>
                      <dd className="text-right text-white">{selectedParcel.zoning}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Market value</dt>
                      <dd className="text-right text-white">{formatCurrency(selectedParcel.marketValue)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Current ratio</dt>
                      <dd className="text-right text-white">{formatRatio(selectedParcel.currentRatio)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-white/50">Shape area</dt>
                      <dd className="text-right text-white">
                        {selectedParcel.areaSqFt ? `${Math.round(selectedParcel.areaSqFt).toLocaleString()} sq ft` : 'Unavailable'}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-white/60">
                    Select a live parcel polygon or result row to inspect the county record.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
