/**
 * PropertyAtlas.tsx
 *
 * Phase 5.3 + Atlas GIS wiring: Property Atlas Tab - GIS/Mapping MWUX Slice
 *
 * Architecture:
 *   1. On mount, fetches boundary + layer data from live GIS endpoints:
 *        GET /api/atlas/gis/parcels/{parcelId}/boundary
 *        GET /api/atlas/gis/parcels/{parcelId}/layers
 *   2. When source="pacs", renders real PACS data in boundary info & layer panels.
 *   3. Falls back to SVG deterministic preview when API data is unavailable.
 *   4. Existing query_parcel_layers tool invocation preserved for interactive queries.
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    WorkbenchSourceBadge,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';
import {
  useParcelBoundary,
  useParcelLayers,
  type AtlasGisSource,
} from '../../../hooks/useAtlasGis';

/** Available map layers */
const MAP_LAYERS = [
  { id: 'boundary', label: 'Parcel Boundary', icon: '📐', description: 'Property boundaries' },
  { id: 'zoning', label: 'Zoning', icon: '🏘️', description: 'Zoning classifications' },
  { id: 'flood', label: 'Flood Zone', icon: '🌊', description: 'FEMA flood zones' },
  { id: 'aerial', label: 'Aerial Imagery', icon: '🛰️', description: 'Satellite/aerial photos' },
] as const;

type LayerId = (typeof MAP_LAYERS)[number]['id'];

interface LayerData {
  boundary?: {
    type: string;
    area: string;
    perimeter: string;
  };
  zoning?: {
    code: string;
    description: string;
  };
  flood?: {
    zone: string;
    risk: string;
  };
  aerial?: {
    date: string;
    resolution: string;
  };
}

interface AvailableLayer {
  id: string;
  name: string;
  available: boolean;
}

interface QueryResult {
  parcelId: string;
  layers: LayerData | AvailableLayer[];
  centroid?: { lat: number; lng: number };
  geometryAvailable?: boolean;
}

interface QueryState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: QueryResult;
  correlationId?: string;
  error?: ErrorInfo;
}

function isLayerAvailabilityList(layers: QueryResult['layers']): layers is AvailableLayer[] {
  return Array.isArray(layers);
}

function hasLiveLayer(result: QueryResult, layerId: LayerId): boolean {
  if (isLayerAvailabilityList(result.layers)) {
    return result.layers.some((layer) => layer.id === layerId && layer.available);
  }

  return Boolean(result.layers[layerId]);
}

function getLayerCards(result: QueryResult): AvailableLayer[] {
  if (isLayerAvailabilityList(result.layers)) {
    return result.layers;
  }

  return MAP_LAYERS.map((layer) => ({
    id: layer.id,
    name: layer.label,
    available: Boolean(result.layers[layer.id]),
  })).filter((layer) => layer.available);
}

/* ------------------------------------------------------------------ */
/*  Parcel Map Visualization (SVG-based — no external map lib needed)   */
/* ------------------------------------------------------------------ */

/** Generate a realistic-looking parcel polygon from a parcelId hash */
function getParcelPolygon(parcelId: string | undefined): string {
  if (!parcelId) return '150,100 250,100 270,180 200,220 130,180';
  // Deterministic but varied polygon from parcelId characters
  let seed = 0;
  for (let i = 0; i < parcelId.length; i++) {
    seed = (seed * 31 + parcelId.charCodeAt(i)) & 0xffff;
  }
  const r = (v: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * v;
  };

  // Generate 5-7 point convex-ish polygon centered in viewbox
  const cx = 200, cy = 150;
  const points = 5 + Math.floor(r(3));
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const radius = 60 + r(50);
    coords.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function ParcelMapVisualization({
  result,
  selectedLayers,
}: {
  result: QueryResult;
  selectedLayers: Set<LayerId>;
}) {
  const polygon = getParcelPolygon(result.parcelId);
  const hasZoning = selectedLayers.has('zoning') && hasLiveLayer(result, 'zoning');
  const hasFlood = selectedLayers.has('flood') && hasLiveLayer(result, 'flood');
  const hasBoundary = selectedLayers.has('boundary') && hasLiveLayer(result, 'boundary');
  const hasAerial = selectedLayers.has('aerial') && hasLiveLayer(result, 'aerial');

  return (
    <div className='absolute inset-0 flex flex-col'>
      {/* SVG Map */}
      <svg viewBox='0 0 400 300' className='flex-1 w-full' preserveAspectRatio='xMidYMid meet'>
        {/* Grid lines for cartographic feel */}
        <defs>
          <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
            <path d='M 20 0 L 0 0 0 20' fill='none' stroke='hsl(var(--tf-text-primary-hs) 100% / 0.05)' strokeWidth='0.5' />
          </pattern>
        </defs>
        <rect width='400' height='300' fill='url(#grid)' />

        {/* Aerial imagery simulation (green terrain) */}
        {hasAerial && (
          <g opacity='0.3'>
            <rect x='40' y='20' width='320' height='260' rx='4' fill='hsl(var(--tf-success-hs) 18%)' />
            <circle cx='120' cy='80' r='30' fill='hsl(var(--tf-success-hs) 22%)' />
            <circle cx='300' cy='200' r='45' fill='hsl(var(--tf-success-hs) 22%)' />
            <circle cx='220' cy='120' r='20' fill='hsl(var(--tf-success-hs) 25%)' />
          </g>
        )}

        {/* Flood zone overlay */}
        {hasFlood && result.layers.flood && (
          <rect
            x='30' y='180' width='340' height='100' rx='6'
            fill='hsl(var(--tf-network-blue-hs) 55% / 0.15)'
            stroke='hsl(var(--tf-network-blue-hs) 55% / 0.4)'
            strokeWidth='1'
            strokeDasharray='6 3'
          />
        )}

        {/* Zoning overlay */}
        {hasZoning && (
          <rect
            x='60' y='40' width='280' height='220' rx='4'
            fill='hsl(var(--tf-info-hs) 60% / 0.1)'
            stroke='hsl(var(--tf-info-hs) 60% / 0.3)'
            strokeWidth='1'
            strokeDasharray='4 2'
          />
        )}

        {/* Parcel boundary polygon */}
        {hasBoundary && (
          <polygon
            points={polygon}
            fill='hsl(var(--tf-transcend-cyan-hs) 55% / 0.15)'
            stroke='hsl(var(--tf-transcend-cyan-hs) 55% / 0.8)'
            strokeWidth='2'
          />
        )}

        {/* Centroid marker */}
        <circle cx='200' cy='150' r='4' fill='hsl(var(--tf-warning-hs) 50%)' />
        <circle cx='200' cy='150' r='8' fill='none' stroke='hsl(var(--tf-warning-hs) 50%)' strokeWidth='1' opacity='0.6' />
      </svg>

      {/* Preview disclaimer */}
      <p className="tf-text-dim text-xs mt-1 text-center italic">
        Atlas layer availability is confirmed here, but the boundary and centroid shown are preview sketches until full GIS geometry ships on this route
      </p>

      {/* Map info bar */}
      <div className='flex items-center justify-between px-4 py-2 text-xs' style={{ background: 'hsl(var(--tf-text-primary-hs) 0% / 0.4)' }}>
        <span className='text-white/70'>
          {result.parcelId}
        </span>
        {result.centroid && (
          <span className='text-white/50 font-mono'>
            {result.centroid.lat.toFixed(4)}°N, {Math.abs(result.centroid.lng).toFixed(4)}°W
            <span
              data-testid="atlas-centroid-disclosure"
              className="ml-1 text-white/30"
              style={{ fontSize: 9 }}
            >
              (preview centroid)
            </span>
          </span>
        )}
        <span className='text-white/50'>
          {selectedLayers.size} layer{selectedLayers.size !== 1 ? 's' : ''} active
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: map AtlasGisSource → WorkbenchSourceBadge DisclosureSource */
/* ------------------------------------------------------------------ */

function gisSourceToDisclosure(
  boundarySource: AtlasGisSource,
  layersSource: AtlasGisSource,
  querySuccess: boolean,
): 'live' | 'partial' | 'fallback' | 'unavailable' {
  // If the interactive query succeeded, that path was already 'live'
  if (querySuccess) {
    // Overlay with GIS endpoint info
    if (boundarySource === 'live' || layersSource === 'live') return 'live';
    return 'live';
  }
  if (boundarySource === 'live' && layersSource === 'live') return 'live';
  if (boundarySource === 'live' || layersSource === 'live') return 'partial';
  if (boundarySource === 'fallback' || layersSource === 'fallback') return 'fallback';
  return 'unavailable';
}

/* ------------------------------------------------------------------ */

export const PropertyAtlas: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  // Live GIS hooks
  const boundary = useParcelBoundary(parcelId);
  const layers = useParcelLayers(parcelId);

  const [selectedLayers, setSelectedLayers] = useState<Set<LayerId>>(new Set());
  const [queryState, setQueryState] = useState<QueryState>({ status: 'idle' });
  const [queryHistory, setQueryHistory] = useState<InvocationRecord[]>([]);

  const toggleLayer = useCallback((layerId: LayerId) => {
    setSelectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleQueryLayers = useCallback(async () => {
    if (selectedLayers.size === 0) return;

    setQueryState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'query_parcel_layers',
        params: {
          parcelId,
          layers: Array.from(selectedLayers),
          format: 'summary',
        },
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: QueryResult;
        try {
          parsed =
            typeof response.result.output === 'string'
              ? JSON.parse(response.result.output)
              : response.result.output;
        } catch {
          parsed = { parcelId, layers: {} };
        }
        // Ensure parcelId and layers always present (mocks may omit them)
        if (!parsed.parcelId) parsed.parcelId = parcelId;
        if (!parsed.layers) parsed.layers = {};

        setQueryState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });

        // Add to history
        setQueryHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'query_parcel_layers',
            status: 'success',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            meta: { layers: selectedLayers.size },
          },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      } else {
        const errorInfo: ErrorInfo = {
          code: response.error?.code || 'QUERY_FAILED',
          message: response.error?.message || 'Failed to query parcel layers',
          severity: 'error' as const,
          correlationId: response.correlationId,
        };

        setQueryState({
          status: 'error',
          correlationId: response.correlationId,
          error: errorInfo,
        });

        // Add to history
        setQueryHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'query_parcel_layers',
            status: 'error',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            errorCode: response.error?.code || 'QUERY_FAILED',
            meta: { layers: selectedLayers.size },
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      // Network error - generate client-side correlationId
      const clientCorrelationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred',
        severity: 'error' as const,
        correlationId: clientCorrelationId,
      };

      setQueryState({
        status: 'error',
        correlationId: clientCorrelationId,
        error: networkError,
      });

      // Add to history
      setQueryHistory((prev) => [
        {
          id: crypto.randomUUID(),
          toolId: 'query_parcel_layers',
          status: 'error',
          correlationId: clientCorrelationId,
          timestamp: new Date(),
          errorCode: 'NETWORK_ERROR',
          meta: { layers: selectedLayers.size },
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [selectedLayers, parcelId]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const isDev = getEnv('MODE') === 'development';
  const liveLayerCards =
    queryState.status === 'success' && queryState.result
      ? getLayerCards(queryState.result)
      : [];

  // Compute overall data source for the badge
  const badgeSource = gisSourceToDisclosure(
    boundary.source,
    layers.source,
    queryState.status === 'success',
  );

  return (
    <div className='tf-suite-atlas space-y-4' data-testid='property-atlas-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🗺️'
        title='TerraAtlas'
        parcelId={parcelId}
        subtitle={`Geospatial analysis for ${parcelId}`}
      />

      {/* Parcel Context from Store */}
      {activeParcel && (
        <div>
          <p
            data-testid="atlas-parcel-context-source"
            className="text-xs mb-1"
            style={{ color: 'hsl(215 16% 47%)' }}
          >
            Parcel context returned from property store (PACS mirror)
          </p>
          <BentoGrid columns="auto" gap={0.75} padding={0}>
          <BentoCard variant="stat" title="Address">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.address || '—'}
            </p>
            {activeParcel.city && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                {activeParcel.city}{activeParcel.zip ? `, ${activeParcel.zip}` : ''}
              </p>
            )}
          </BentoCard>
          <BentoCard variant="stat" title="Land Acreage">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.landAcreage ? activeParcel.landAcreage.toFixed(2) : '—'}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Tax District">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.taxDistrictName || activeParcel.taxDistrictCode || '—'}
            </p>
          </BentoCard>
          <BentoCard variant="stat" title="Zoning">
            <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {activeParcel.landUseDescription || activeParcel.propertyType || '—'}
            </p>
          </BentoCard>
          </BentoGrid>
        </div>
      )}

      {/* ── Live GIS Boundary Data ──────────────────────────── */}
      {boundary.source === 'live' && boundary.data && (
        <div data-testid="atlas-gis-boundary">
          <p className="text-xs mb-1" style={{ color: 'hsl(142 76% 36%)' }}>
            Boundary data from county records (source: {boundary.data.source})
          </p>
          <BentoGrid columns="auto" gap={0.75} padding={0}>
            <BentoCard variant="stat" title="Situs">
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {boundary.data.situsDisplay || '—'}
              </p>
            </BentoCard>
            <BentoCard variant="stat" title="Area">
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {boundary.data.areaAcres != null
                  ? `${boundary.data.areaAcres.toFixed(2)} ac`
                  : boundary.data.areaSqFt != null
                    ? `${boundary.data.areaSqFt.toLocaleString()} sq ft`
                    : '—'}
              </p>
            </BentoCard>
            <BentoCard variant="stat" title="Lot Dimensions">
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {boundary.data.dimensions?.effectiveFront && boundary.data.dimensions?.effectiveDepth
                  ? `${boundary.data.dimensions.effectiveFront}' x ${boundary.data.dimensions.effectiveDepth}'`
                  : boundary.data.dimensions?.frontFeet && boundary.data.dimensions?.depthFeet
                    ? `${boundary.data.dimensions.frontFeet}' x ${boundary.data.dimensions.depthFeet}'`
                    : '—'}
              </p>
            </BentoCard>
            {boundary.data.centroid && (
              <BentoCard variant="stat" title="Centroid">
                <p className="text-sm font-mono" style={{ color: 'hsl(var(--tf-text))' }}>
                  {boundary.data.centroid.lat.toFixed(6)}, {boundary.data.centroid.lng.toFixed(6)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  derived from: {boundary.data.centroid.derivedFrom}
                </p>
              </BentoCard>
            )}
          </BentoGrid>
        </div>
      )}

      {/* ── Boundary unavailable state ────────────────────── */}
      {!boundary.loading && !boundary.error && boundary.source === 'unavailable' && (
        <div className="text-xs tf-text-muted p-2 tf-panel" data-testid="atlas-boundary-unavailable">
          Boundary data not available in PACS mirror for this parcel.
        </div>
      )}

      {/* ── Live GIS Layer Data ─────────────────────────────── */}
      {layers.source === 'live' && layers.data && (
        <div data-testid="atlas-gis-layers">
          <p className="text-xs mb-1" style={{ color: 'hsl(142 76% 36%)' }}>
            Layer overlays from county records (source: {layers.data.source})
          </p>
          <BentoGrid columns="auto" gap={0.75} padding={0}>
            {layers.data.zoning && (
              <BentoCard variant="stat" title="Zoning" data-testid="gis-layer-zoning">
                <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                  {layers.data.zoning.zoneCode || layers.data.zoning.characteristicZoning1 || '—'}
                </p>
                {layers.data.zoning.description && (
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                    {layers.data.zoning.description}
                  </p>
                )}
              </BentoCard>
            )}
            {layers.data.flood && (
              <BentoCard variant="stat" title="Flood Zone" data-testid="gis-layer-flood">
                <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                  {layers.data.flood.zone}
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Risk: {layers.data.flood.risk}
                  {layers.data.flood.source === 'stub'
                    ? ' — Stub (no FEMA data in PACS)'
                    : ` (source: ${layers.data.flood.source})`}
                </p>
              </BentoCard>
            )}
            {layers.data.taxArea && (
              <BentoCard variant="stat" title="Tax Area" data-testid="gis-layer-taxarea">
                <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                  {layers.data.taxArea.taxAreaNumber || '—'}
                </p>
                {layers.data.taxArea.taxAreaDescription && (
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                    {layers.data.taxArea.taxAreaDescription}
                  </p>
                )}
              </BentoCard>
            )}
            {layers.data.landClass && (
              <BentoCard variant="stat" title="Land Classification" data-testid="gis-layer-landclass">
                <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                  {layers.data.landClass.landClassCode || layers.data.landClass.landTypeCode || '—'}
                </p>
                {layers.data.landClass.primaryUseCd && (
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                    Use: {layers.data.landClass.primaryUseCd}
                    {layers.data.landClass.subUseCd ? ` / ${layers.data.landClass.subUseCd}` : ''}
                  </p>
                )}
              </BentoCard>
            )}
          </BentoGrid>
        </div>
      )}

      {/* ── Layers unavailable state ─────────────────────── */}
      {!layers.loading && !layers.error && layers.source === 'unavailable' && (
        <div className="text-xs tf-text-muted p-2 tf-panel" data-testid="atlas-layers-unavailable">
          Layer data not available in PACS mirror for this parcel.
        </div>
      )}

      {/* Main Content Grid */}
      <BentoGrid columns="auto" gap={1.5} padding={0}>
        {/* Layer Controls */}
        <BentoCard variant="form" title="Map Layers" actions={<span>📚</span>}>

          <div className='space-y-2'>
            {MAP_LAYERS.map((layer) => (
              <button
                key={layer.id}
                data-testid={`layer-toggle-${layer.id}`}
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={selectedLayers.has(layer.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedLayers.has(layer.id)
                    ? 'tf-suite-active'
                    : 'tf-panel tf-text-secondary tf-hover-surface'
                }`}
              >
                <span className='text-xl'>{layer.icon}</span>
                <div className='text-left'>
                  <div className='font-medium'>{layer.label}</div>
                  <div className='text-xs tf-text-muted'>{layer.description}</div>
                </div>
                {selectedLayers.has(layer.id) && <span className='ml-auto tf-suite-accent-text'>✓</span>}
              </button>
            ))}
          </div>

          <button
            onClick={handleQueryLayers}
            disabled={selectedLayers.size === 0 || queryState.status === 'loading'}
            className='mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-atlas-cta'
          >
            {queryState.status === 'loading' ? 'Querying...' : 'Query Layers'}
          </button>
        </BentoCard>

        {/* Map Container */}
        <BentoCard span="2x1" variant="map">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs tf-text-muted">Layer data</span>
            <WorkbenchSourceBadge
              source={badgeSource}
            />
          </div>
          <p
            data-testid="atlas-geometry-disclosure"
            style={{ fontSize: 11, color: 'hsl(215 16% 47%)', marginBottom: 6 }}
          >
            {boundary.source === 'live'
              ? 'Boundary info from county records — SVG preview, not full GIS geometry'
              : 'Layer preview — full GIS geometry not yet available on this route'}
          </p>
          <div
            data-testid='map-container'
            className='aspect-video relative overflow-hidden'
            style={{ background: 'linear-gradient(to bottom right, hsl(var(--tf-network-blue-hs) 20% / 0.3), hsl(var(--tf-transcend-cyan-hs) 20% / 0.3))' }}
          >
            {queryState.status === 'loading' ? (
              <div role='status' className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
                <div className='tf-spinner h-10 w-10' />
                <span className='tf-text-tertiary'>Loading layer data...</span>
              </div>
            ) : queryState.status === 'success' && queryState.result ? (
              <ParcelMapVisualization
                result={queryState.result}
                selectedLayers={selectedLayers}
              />
            ) : (
              <div className='absolute inset-0 flex flex-col items-center justify-center text-center p-4'>
                <div className='text-4xl mb-2'>🌍</div>
                <p className='tf-text-tertiary'>Select layers and query to view map data</p>
              </div>
            )}

            {/* GIS data loading overlay — appears while boundary/layers fetch on mount */}
            {(boundary.loading || layers.loading) && (
              <div
                role="status"
                aria-label="Loading map data"
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'hsl(var(--tf-bg) / 0.6)', backdropFilter: 'blur(4px)', zIndex: 10 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="tf-spinner h-8 w-8" />
                  <span style={{ color: 'hsl(var(--tf-text) / 0.5)' }} className="text-xs">
                    Loading parcel geometry…
                  </span>
                </div>
              </div>
            )}
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Query Results */}
      {queryState.status === 'success' && queryState.result && (
        <div className='tf-status-success rounded-xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='font-semibold flex items-center gap-2' style={{ color: 'hsl(var(--tf-success))' }}>
              <span>✅</span> Query Results
              <span
                data-testid="atlas-results-source"
                className="font-normal text-xs"
                style={{ color: 'hsl(215 16% 47%)' }}
              >
                — returned from query_parcel_layers
              </span>
            </h4>
            {queryState.correlationId && (
              <div className='flex items-center gap-2 text-xs'>
                <span className='tf-text-muted'>ID:</span>
                <code className='font-mono' style={{ color: 'hsl(var(--tf-success))' }}>
                  {queryState.correlationId.slice(0, 16)}...
                </code>
                <button
                  onClick={() => copyToClipboard(queryState.correlationId!)}
                  className='tf-text-tertiary tf-hover-surface'
                  aria-label='Copy correlation ID'
                >
                  📋
                </button>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {liveLayerCards.map((layer) => (
              <div key={layer.id} className='tf-panel p-3'>
                <h5 className='tf-text font-medium mb-2' style={{ opacity: 0.8 }}>{layer.name}</h5>
                <div className='text-sm tf-text-tertiary space-y-1'>
                  <p>
                    Status:{' '}
                    <span className='tf-text'>{layer.available ? 'Available' : 'Unavailable'}</span>
                  </p>
                  <p>
                    Layer ID:{' '}
                    <span className='tf-text font-mono'>{layer.id}</span>
                  </p>
                  {layer.id === 'boundary' && queryState.result?.geometryAvailable === false && (
                    <p>
                      Geometry:{' '}
                      <span className='tf-text'>Not exposed on this route yet</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {queryState.result.geometryAvailable === false && (
            <div className='mt-4 tf-panel p-3 text-sm tf-text-tertiary'>
              Atlas layer availability is confirmed for this parcel, but the boundary and centroid shown on this route are preview sketches. Full GIS geometry and route-level spatial detail remain deferred until the fuller Atlas surface ships.
            </div>
          )}

          {isDev && queryState.correlationId && (
            <div className='mt-3 text-xs tf-text-dim border-t tf-border pt-3'>
              <details>
                <summary className='cursor-pointer tf-hover-surface'>Developer Info</summary>
                <pre className='mt-2 tf-overlay rounded p-2 overflow-x-auto'>
                  pnpm run trace:query --correlation {queryState.correlationId}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {queryState.status === 'error' && queryState.error && (
        <ErrorDisplay
          error={{
            message: queryState.error.message,
            errorCode: queryState.error.code,
            correlationId: queryState.correlationId,
          }}
        />
      )}

      {/* GIS endpoint errors (non-blocking) */}
      {boundary.error && (
        <div className="text-xs tf-text-muted p-2" data-testid="atlas-boundary-error">
          Boundary endpoint: {boundary.error}
        </div>
      )}
      {layers.error && (
        <div className="text-xs tf-text-muted p-2" data-testid="atlas-layers-error">
          Layers endpoint: {layers.error}
        </div>
      )}

      {/* Query History */}
      <InvocationHistory
        records={queryHistory}
        title='Query History'
        emptyMessage='No layer queries yet.'
      />
    </div>
  );
};

export default PropertyAtlas;
