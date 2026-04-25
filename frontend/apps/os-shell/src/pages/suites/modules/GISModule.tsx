/**
 * GIS Module -- TerraGIS live Benton parcel map
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Map, Layers, Search, Eye, EyeOff, ExternalLink } from 'lucide-react';
import {
  atlasService,
  type MapLayer,
  type MassAppraisalFeature,
  type MassAppraisalFeatureCollection,
  type SpatialStats,
} from '@/services/atlasService';

type OverlayMode = 'propertyType' | 'neighborhood' | 'zoning';
type AuditMetric = 'residuals' | 'uniformity' | 'boundary';

interface SpatialAuditSummary {
  narrative: string;
  hotspotCount: number;
  recommendedAction: string;
}

interface Bounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

const MAP_WIDTH = 1080;
const MAP_HEIGHT = 720;
const MAP_PADDING = 24;

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  Residential: '#22c55e',
  Commercial: '#38bdf8',
  Industrial: '#f59e0b',
  'Resource Production and Extraction & Agriculture': '#84cc16',
  'Undeveloped Land and Water': '#94a3b8',
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

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'Unavailable';
  return value.toFixed(2);
}

function getRings(feature: MassAppraisalFeature): [number, number][][] {
  if (!feature.geometry) return [];
  if (feature.geometry.type === 'Polygon') return feature.geometry.coordinates.map((ring) => ring as [number, number][]);
  return feature.geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ring as [number, number][]));
}

function getBounds(features: MassAppraisalFeature[]): Bounds | null {
  const coords = features.flatMap((feature) => getRings(feature).flatMap((ring) => ring));
  if (coords.length === 0) return null;
  const [firstLng, firstLat] = coords[0];
  return coords.reduce<Bounds>(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    { minLng: firstLng, maxLng: firstLng, minLat: firstLat, maxLat: firstLat },
  );
}

function project([lng, lat]: [number, number], bounds: Bounds): [number, number] {
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
  const x = MAP_PADDING + ((lng - bounds.minLng) / lngSpan) * (MAP_WIDTH - MAP_PADDING * 2);
  const y = MAP_HEIGHT - MAP_PADDING - ((lat - bounds.minLat) / latSpan) * (MAP_HEIGHT - MAP_PADDING * 2);
  return [x, y];
}

function featurePath(feature: MassAppraisalFeature, bounds: Bounds): string {
  return getRings(feature)
    .filter((ring) => ring.length >= 3)
    .map((ring) =>
      ring
        .map((point, index) => {
          const [x, y] = project(point, bounds);
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ') + ' Z',
    )
    .join(' ');
}

function summarize(feature: MassAppraisalFeature) {
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

function overlayColor(mode: OverlayMode, feature: MassAppraisalFeature): string {
  const properties = feature.properties ?? {};
  if (mode === 'propertyType') return PROPERTY_TYPE_COLORS[properties.Property_Type ?? 'default'] ?? PROPERTY_TYPE_COLORS.default;
  if (mode === 'zoning') return ZONING_COLORS[properties.zoning ?? 'default'] ?? ZONING_COLORS.default;
  const digits = (properties.neighborhood ?? 'default').replace(/\D/g, '');
  const hue = digits ? parseInt(digits.slice(-3), 10) % 360 : 190;
  return `hsl(${hue} 75% 58%)`;
}

export default function GISModule() {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [stats, setStats] = useState<SpatialStats | null>(null);
  const [featureCollection, setFeatureCollection] = useState<MassAppraisalFeatureCollection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('propertyType');
  const [auditMetric, setAuditMetric] = useState<AuditMetric>('residuals');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spatialAudit, setSpatialAudit] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: SpatialAuditSummary; correlationId?: string; error?: string }>({ status: 'idle' });

  const features = featureCollection?.features ?? [];
  const bounds = useMemo(() => getBounds(features), [features]);
  const enabledCount = layers.filter((layer) => layer.enabled).length;
  const parcelsLayerEnabled = layers.find((layer) => layer.id === 'parcels')?.enabled ?? true;
  const selectedFeature = useMemo(
    () => features.find((feature) => feature.properties?.Parcel_ID === selectedParcelId) ?? null,
    [features, selectedParcelId],
  );
  const selectedParcel = selectedFeature ? summarize(selectedFeature) : null;
  const visibleMarketValue = useMemo(
    () => features.reduce((sum, feature) => sum + (feature.properties?.TotalMarketValue ?? feature.properties?.ASSESSED_VAL ?? 0), 0),
    [features],
  );
  const propertyTypeOptions = useMemo(() => {
    const fromStats = stats?.typeBreakdown?.map((entry) => entry.type).filter(Boolean) ?? [];
    const fromFeatures = features.map((feature) => feature.properties?.Property_Type).filter((value): value is string => Boolean(value));
    return ['all', ...Array.from(new Set([...fromStats, ...fromFeatures]))];
  }, [features, stats]);

  const loadSlice = useCallback(async (options?: { query?: string; propertyType?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const [layerData, statsData, parcelData] = await Promise.all([
        atlasService.getLayers(),
        atlasService.getMassAppraisalStats(),
        atlasService.searchMassAppraisalParcels({
          query: options?.query,
          propertyType: options?.propertyType,
          limit: 24,
        }),
      ]);

      setLayers(layerData);
      setStats(statsData);
      setFeatureCollection(parcelData);
      const firstParcel = parcelData.features[0]?.properties?.Parcel_ID ?? null;
      setSelectedParcelId((current) =>
        current && parcelData.features.some((feature) => feature.properties?.Parcel_ID === current) ? current : firstParcel,
      );
    } catch (loadError) {
      setFeatureCollection(null);
      setStats(null);
      setError(loadError instanceof Error ? loadError.message : 'TerraGIS could not load live Benton data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlice();
  }, [loadSlice]);

  const toggleLayer = useCallback((id: string) => {
    setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer)));
  }, []);

  const handleSearch = useCallback(async () => {
    await loadSlice({
      query: searchTerm.trim() || undefined,
      propertyType: propertyTypeFilter === 'all' ? undefined : propertyTypeFilter,
    });
  }, [loadSlice, propertyTypeFilter, searchTerm]);

  const runSpatialAudit = useCallback(async () => {
    setSpatialAudit({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'explain_spatial_anomaly',
        params: { county: 'benton', geographyType: 'county', anomalyMetric: auditMetric },
      });

      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output) as SpatialAuditSummary
          : response.result.output as SpatialAuditSummary;
        setSpatialAudit({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setSpatialAudit({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to explain spatial anomaly.',
        });
      }
    } catch (auditError) {
      setSpatialAudit({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: auditError instanceof Error ? auditError.message : 'Failed to explain spatial anomaly.',
      });
    }
  }, [auditMetric]);

  if (loading && !featureCollection) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading live TerraGIS county geometry...</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Map style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraGIS
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton County parcel geometry and ArcGIS layer services. Atlas identifies the GIS issue, Workbench fixes parcels, and Forge stays out until GIS review is complete.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.9fr)] gap-6'>
        <div className='space-y-4'>
          <Card data-testid='gis-governed-brief' style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-3'>
              <CardTitle style={{ color: 'hsl(var(--tf-fg))' }} className='text-base'>Governed Spatial Audit</CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                The audit narrative is governed. The map and layer catalog below are live Benton ArcGIS data, not a placeholder surface.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap items-end gap-3'>
                <label className='space-y-1 text-sm'>
                  <span className='block text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>Audit Metric</span>
                  <select
                    value={auditMetric}
                    onChange={(event) => setAuditMetric(event.target.value as AuditMetric)}
                    className='rounded-md border border-border bg-background px-3 py-2 text-sm'
                  >
                    <option value='residuals'>Residual Clustering</option>
                    <option value='uniformity'>Uniformity Drift</option>
                    <option value='boundary'>Boundary Mismatch</option>
                  </select>
                </label>
                <Button type='button' onClick={runSpatialAudit}>
                  {spatialAudit.status === 'loading' ? 'Running Audit…' : 'Explain Spatial Anomaly'}
                </Button>
              </div>

              {spatialAudit.status === 'success' && spatialAudit.result && (
                <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>{spatialAudit.result.narrative}</p>
                  <p className='mt-2' style={{ color: 'hsl(var(--tf-muted))' }}>Hotspots: {spatialAudit.result.hotspotCount}</p>
                  <p className='mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{spatialAudit.result.recommendedAction}</p>
                  {spatialAudit.correlationId && <p className='mt-2 font-mono text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Correlation: {spatialAudit.correlationId}</p>}
                </div>
              )}

              {spatialAudit.status === 'error' && (
                <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)', color: 'hsl(var(--tf-suite-dossier))' }}>
                  {spatialAudit.error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='p-0'>
              <div className='flex flex-wrap items-end justify-between gap-3 p-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <div className='flex flex-wrap items-end gap-2'>
                  <div>
                    <label className='block text-xs font-medium uppercase tracking-wider mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel search</label>
                    <Input
                      placeholder='Parcel ID or situs'
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
                      className='w-64'
                      style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-medium uppercase tracking-wider mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Property type</label>
                    <select value={propertyTypeFilter} onChange={(event) => setPropertyTypeFilter(event.target.value)} className='h-10 rounded-md border border-border bg-background px-3 py-2 text-sm'>
                      {propertyTypeOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All property types' : option}</option>)}
                    </select>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => void handleSearch()} style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <Search size={16} className='mr-2' />
                    Refresh live slice
                  </Button>
                </div>
                <div>
                  <label className='block text-xs font-medium uppercase tracking-wider mb-1' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel coloring</label>
                  <select value={overlayMode} onChange={(event) => setOverlayMode(event.target.value as OverlayMode)} className='h-10 rounded-md border border-border bg-background px-3 py-2 text-sm'>
                    <option value='propertyType'>Property type</option>
                    <option value='neighborhood'>Neighborhood</option>
                    <option value='zoning'>Zoning</option>
                  </select>
                </div>
              </div>
              <div className='min-h-[30rem] overflow-hidden rounded-b-xl border-t border-white/5 bg-[#041118]'>
                {error ? (
                  <div className='flex h-full items-center justify-center p-8 text-center'>
                    <div>
                      <p className='text-lg font-semibold text-white'>TerraGIS could not load live Benton geometry</p>
                      <p className='mt-2 text-sm text-white/60'>{error}</p>
                      <Button type='button' className='mt-4' onClick={() => void handleSearch()}>Retry live query</Button>
                    </div>
                  </div>
                ) : !parcelsLayerEnabled ? (
                  <div className='flex h-full items-center justify-center p-8 text-center'>
                    <div>
                      <p className='text-lg font-semibold text-white'>Parcel layer is disabled</p>
                      <p className='mt-2 text-sm text-white/60'>TerraGIS is wired to the live Benton parcel polygon service. Re-enable the parcels layer to render the county slice.</p>
                    </div>
                  </div>
                ) : !bounds || features.length === 0 ? (
                  <div className='flex h-full items-center justify-center p-8 text-center'>
                    <p className='text-sm text-white/60'>No live parcel geometry is available for the current TerraGIS slice.</p>
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className='h-full w-full' aria-label='TerraGIS live parcel map'>
                    <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill='#05161d' />
                    {features.map((feature) => {
                      const parcel = summarize(feature);
                      const pathData = featurePath(feature, bounds);
                      if (!pathData) return null;
                      const isSelected = parcel.parcelId === selectedParcelId;
                      return (
                        <path
                          key={parcel.parcelId}
                          d={pathData}
                          fill={overlayColor(overlayMode, feature)}
                          fillOpacity={isSelected ? 0.5 : 0.28}
                          stroke={isSelected ? '#ffffff' : '#7dd3fc'}
                          strokeOpacity={isSelected ? 0.95 : 0.45}
                          strokeWidth={isSelected ? 2.1 : 0.8}
                          onClick={() => setSelectedParcelId(parcel.parcelId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <title>{`${parcel.parcelId} | ${parcel.address} | ${parcel.propertyType}`}</title>
                        </path>
                      );
                    })}
                  </svg>
                )}
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-4'>
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className='pb-2'>
                <CardTitle style={{ color: 'hsl(var(--tf-fg))' }} className='text-base'>Live parcel results</CardTitle>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>{features.length} live parcels in the current TerraGIS slice.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2 max-h-[20rem] overflow-y-auto'>
                {features.length === 0 ? (
                  <div className='rounded border border-white/10 bg-white/5 p-4 text-sm text-white/60'>No live parcels matched the current TerraGIS filter.</div>
                ) : (
                  features.map((feature) => {
                    const parcel = summarize(feature);
                    const isSelected = parcel.parcelId === selectedParcelId;
                    return (
                      <button
                        key={parcel.parcelId}
                        type='button'
                        onClick={() => setSelectedParcelId(parcel.parcelId)}
                        className='w-full rounded-lg border px-3 py-3 text-left transition-colors'
                        style={{
                          borderColor: isSelected ? 'rgba(32,212,200,0.55)' : 'rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(32,212,200,0.12)' : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <div>
                            <p className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{parcel.address}</p>
                            <p className='mt-1 text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>{parcel.parcelId}</p>
                          </div>
                          <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>{parcel.propertyType}</Badge>
                        </div>
                        <div className='mt-2 flex flex-wrap gap-3 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          <span>Neighborhood: {parcel.neighborhood}</span>
                          <span>Zoning: {parcel.zoning}</span>
                          <span>Ratio: {formatRatio(parcel.currentRatio)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className='pb-2'>
                <CardTitle style={{ color: 'hsl(var(--tf-fg))' }} className='text-base'>Selected parcel</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedParcel ? (
                  <dl className='space-y-3 text-sm'>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</dt><dd className='font-mono text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.parcelId}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Address</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.address}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Property type</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.propertyType}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Neighborhood</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.neighborhood}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Zoning</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.zoning}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Market value</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(selectedParcel.marketValue)}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Current ratio</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{formatRatio(selectedParcel.currentRatio)}</dd></div>
                    <div className='flex items-start justify-between gap-4'><dt style={{ color: 'hsl(var(--tf-muted))' }}>Shape area</dt><dd className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>{selectedParcel.areaSqFt ? `${Math.round(selectedParcel.areaSqFt).toLocaleString()} sq ft` : 'Unavailable'}</dd></div>
                  </dl>
                ) : (
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Select a live Benton parcel polygon or result card to inspect the current record.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Layers style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={18} />
                Live layer catalog
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>{enabledCount} of {layers.length} Benton ArcGIS services enabled in the current TerraGIS workspace.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {(['base', 'overlay', 'analysis'] as const).map((category) => (
                <div key={category}>
                  <p className='text-xs font-medium uppercase tracking-wider mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>{category === 'base' ? 'Base geometry' : category === 'overlay' ? 'Overlay services' : 'Analysis services'}</p>
                  <div className='space-y-2'>
                    {layers.filter((layer) => layer.category === category).map((layer) => (
                      <div key={layer.id} className='rounded p-3' style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              {layer.enabled ? <Eye size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} className='shrink-0' /> : <EyeOff size={14} style={{ color: 'hsl(var(--tf-muted) / 0.5)' }} className='shrink-0' />}
                              <p className='text-sm truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{layer.name}</p>
                            </div>
                            <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{layer.source}{layer.type ? ` · ${layer.type}` : ''}</p>
                            {layer.url && (
                              <a href={layer.url} target='_blank' rel='noreferrer' className='mt-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline' style={{ color: 'hsl(var(--tf-suite-atlas))' }}>
                                Open live ArcGIS service
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          <Switch checked={layer.enabled} onCheckedChange={() => toggleLayer(layer.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {category !== 'analysis' && <Separator className='mt-3' style={{ background: 'hsl(var(--tf-border))' }} />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'><CardTitle style={{ color: 'hsl(var(--tf-fg))' }} className='text-base'>County posture</CardTitle></CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2'><span style={{ color: 'hsl(var(--tf-muted))' }}>Visible parcels</span><span className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{features.length}</span></div>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2'><span style={{ color: 'hsl(var(--tf-muted))' }}>Visible market value</span><span className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(visibleMarketValue)}</span></div>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2'><span style={{ color: 'hsl(var(--tf-muted))' }}>County parcel count</span><span className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{stats ? stats.totalParcels.toLocaleString() : 'Unavailable'}</span></div>
              <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2'><span style={{ color: 'hsl(var(--tf-muted))' }}>County avg market value</span><span className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>{stats ? formatCurrency(stats.averageMarketValue ?? stats.averageAssessedValue) : 'Unavailable'}</span></div>
              <div className='rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                Live county parcel geometry is rendered from Benton ArcGIS AssessorPropVal polygons. The layer catalog is also live Benton ArcGIS service metadata.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
