/**
 * PropertyAtlas.tsx
 *
 * Phase 5.3: Property Atlas Tab - GIS/Mapping MWUX Slice
 * Real MWUX with layer selection, live layer availability, and query_parcel_layers tool invocation.
 *
 * Map visualization is a deterministic preview driven by the live layer-availability payload.
 * Full GIS geometry is not yet available on this route.
 *
 * Architecture: UI → select layers → query_parcel_layers tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

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
        Live layer availability preview — full GIS geometry is not yet available on this route
      </p>

      {/* Map info bar */}
      <div className='flex items-center justify-between px-4 py-2 text-xs' style={{ background: 'hsl(var(--tf-text-primary-hs) 0% / 0.4)' }}>
        <span className='text-white/70'>
          {result.parcelId}
        </span>
        {result.centroid && (
          <span className='text-white/50 font-mono'>
            {result.centroid.lat.toFixed(4)}°N, {Math.abs(result.centroid.lng).toFixed(4)}°W
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

export const PropertyAtlas: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);

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

  return (
    <div className='tf-suite-atlas space-y-6' data-testid='property-atlas-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🗺️'
        title='TerraAtlas'
        parcelId={parcelId}
        subtitle={`Geospatial analysis for ${parcelId}`}
      />

      {/* Parcel Context from Store */}
      {activeParcel && (
        <BentoGrid columns={4} gap={0.75} padding={0}>
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
      )}

      {/* Main Content Grid */}
      <BentoGrid columns={3} gap={1.5} padding={0}>
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
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Query Results */}
      {queryState.status === 'success' && queryState.result && (
        <div className='tf-status-success rounded-xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='font-semibold flex items-center gap-2' style={{ color: 'hsl(var(--tf-success))' }}>
              <span>✅</span> Query Results
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
              Live Atlas layer truth is available, but parcel geometry, centroid, and zoning detail remain deferred until the fuller GIS surface ships.
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
