/**
 * PropertyAtlas.tsx
 *
 * Phase 5.3: Property Atlas Tab - GIS/Mapping MWUX Slice
 * Real MWUX with layer selection, map placeholder, and query_parcel_layers tool invocation.
 *
 * Architecture: UI → select layers → query_parcel_layers tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';

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

interface QueryResult {
  parcelId: string;
  layers: LayerData;
  centroid?: { lat: number; lng: number };
}

interface QueryState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: QueryResult;
  correlationId?: string;
  error?: ErrorInfo;
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
  const hasZoning = selectedLayers.has('zoning') && result.layers.zoning;
  const hasFlood = selectedLayers.has('flood') && result.layers.flood;
  const hasBoundary = selectedLayers.has('boundary');
  const hasAerial = selectedLayers.has('aerial');

  return (
    <div className='absolute inset-0 flex flex-col'>
      {/* SVG Map */}
      <svg viewBox='0 0 400 300' className='flex-1 w-full' preserveAspectRatio='xMidYMid meet'>
        {/* Grid lines for cartographic feel */}
        <defs>
          <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
            <path d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(255,255,255,0.05)' strokeWidth='0.5' />
          </pattern>
        </defs>
        <rect width='400' height='300' fill='url(#grid)' />

        {/* Aerial imagery simulation (green terrain) */}
        {hasAerial && (
          <g opacity='0.3'>
            <rect x='40' y='20' width='320' height='260' rx='4' fill='#1a472a' />
            <circle cx='120' cy='80' r='30' fill='#1f5a2f' />
            <circle cx='300' cy='200' r='45' fill='#1f5a2f' />
            <circle cx='220' cy='120' r='20' fill='#245634' />
          </g>
        )}

        {/* Flood zone overlay */}
        {hasFlood && result.layers.flood && (
          <rect
            x='30' y='180' width='340' height='100' rx='6'
            fill='rgba(59, 130, 246, 0.15)'
            stroke='rgba(59, 130, 246, 0.4)'
            strokeWidth='1'
            strokeDasharray='6 3'
          />
        )}

        {/* Zoning overlay */}
        {hasZoning && (
          <rect
            x='60' y='40' width='280' height='220' rx='4'
            fill='rgba(168, 85, 247, 0.1)'
            stroke='rgba(168, 85, 247, 0.3)'
            strokeWidth='1'
            strokeDasharray='4 2'
          />
        )}

        {/* Parcel boundary polygon */}
        {hasBoundary && (
          <polygon
            points={polygon}
            fill='rgba(34, 211, 238, 0.15)'
            stroke='rgba(34, 211, 238, 0.8)'
            strokeWidth='2'
          />
        )}

        {/* Centroid marker */}
        <circle cx='200' cy='150' r='4' fill='#f59e0b' />
        <circle cx='200' cy='150' r='8' fill='none' stroke='#f59e0b' strokeWidth='1' opacity='0.6' />
      </svg>

      {/* Map info bar */}
      <div className='flex items-center justify-between px-4 py-2 text-xs' style={{ background: 'rgba(0,0,0,0.4)' }}>
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
  const { parcelId } = useOutletContext<{ parcelId: string }>();

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

  return (
    <div className='space-y-6' data-testid='property-atlas-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🗺️'
        title='TerraAtlas'
        parcelId={parcelId}
        subtitle={`Geospatial analysis for ${parcelId}`}
      />

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Layer Controls */}
        <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
          <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
            <span>📚</span> Map Layers
          </h3>

          <div className='space-y-2'>
            {MAP_LAYERS.map((layer) => (
              <button
                key={layer.id}
                data-testid={`layer-toggle-${layer.id}`}
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={selectedLayers.has(layer.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedLayers.has(layer.id)
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className='text-xl'>{layer.icon}</span>
                <div className='text-left'>
                  <div className='font-medium'>{layer.label}</div>
                  <div className='text-xs text-white/50'>{layer.description}</div>
                </div>
                {selectedLayers.has(layer.id) && <span className='ml-auto text-blue-400'>✓</span>}
              </button>
            ))}
          </div>

          <button
            onClick={handleQueryLayers}
            disabled={selectedLayers.size === 0 || queryState.status === 'loading'}
            className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-all ${
              selectedLayers.size === 0 || queryState.status === 'loading'
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {queryState.status === 'loading' ? 'Querying...' : 'Query Layers'}
          </button>
        </div>

        {/* Map Container */}
        <div className='lg:col-span-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden'>
          <div
            data-testid='map-container'
            className='aspect-video bg-gradient-to-br from-blue-900/30 to-cyan-900/30 relative overflow-hidden'
          >
            {queryState.status === 'loading' ? (
              <div role='status' className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
                <div className='animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-blue-500' />
                <span className='text-white/60'>Loading layer data...</span>
              </div>
            ) : queryState.status === 'success' && queryState.result ? (
              <ParcelMapVisualization
                result={queryState.result}
                selectedLayers={selectedLayers}
              />
            ) : (
              <div className='absolute inset-0 flex flex-col items-center justify-center text-center p-4'>
                <div className='text-4xl mb-2'>🌍</div>
                <p className='text-white/60'>Select layers and query to view map data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Query Results */}
      {queryState.status === 'success' && queryState.result && (
        <div className='bg-green-500/10 border border-green-500/30 rounded-xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='text-green-400 font-semibold flex items-center gap-2'>
              <span>✅</span> Query Results
            </h4>
            {queryState.correlationId && (
              <div className='flex items-center gap-2 text-xs'>
                <span className='text-white/50'>ID:</span>
                <code className='text-green-400 font-mono'>
                  {queryState.correlationId.slice(0, 16)}...
                </code>
                <button
                  onClick={() => copyToClipboard(queryState.correlationId!)}
                  className='text-white/60 hover:text-white'
                  aria-label='Copy correlation ID'
                >
                  📋
                </button>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {queryState.result.layers.boundary && (
              <div className='bg-white/5 rounded-lg p-3'>
                <h5 className='text-white/80 font-medium mb-2'>📐 Boundary</h5>
                <div className='text-sm text-white/60 space-y-1'>
                  <p>
                    Area:{' '}
                    <span className='text-white'>{queryState.result.layers.boundary.area}</span>
                  </p>
                  <p>
                    Perimeter:{' '}
                    <span className='text-white'>
                      {queryState.result.layers.boundary.perimeter}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {queryState.result.layers.zoning && (
              <div className='bg-white/5 rounded-lg p-3'>
                <h5 className='text-white/80 font-medium mb-2'>🏘️ Zoning</h5>
                <div className='text-sm text-white/60 space-y-1'>
                  <p>
                    Code: <span className='text-white'>{queryState.result.layers.zoning.code}</span>
                  </p>
                  <p>
                    Description:{' '}
                    <span className='text-white'>
                      {queryState.result.layers.zoning.description}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {queryState.result.layers.flood && (
              <div className='bg-white/5 rounded-lg p-3'>
                <h5 className='text-white/80 font-medium mb-2'>🌊 Flood Zone</h5>
                <div className='text-sm text-white/60 space-y-1'>
                  <p>
                    Zone: <span className='text-white'>{queryState.result.layers.flood.zone}</span>
                  </p>
                  <p>
                    Risk: <span className='text-white'>{queryState.result.layers.flood.risk}</span>
                  </p>
                </div>
              </div>
            )}

            {queryState.result.layers.aerial && (
              <div className='bg-white/5 rounded-lg p-3'>
                <h5 className='text-white/80 font-medium mb-2'>🛰️ Aerial</h5>
                <div className='text-sm text-white/60 space-y-1'>
                  <p>
                    Date: <span className='text-white'>{queryState.result.layers.aerial.date}</span>
                  </p>
                  <p>
                    Resolution:{' '}
                    <span className='text-white'>{queryState.result.layers.aerial.resolution}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {isDev && queryState.correlationId && (
            <div className='mt-3 text-xs text-white/40 border-t border-white/10 pt-3'>
              <details>
                <summary className='cursor-pointer hover:text-white/60'>Developer Info</summary>
                <pre className='mt-2 bg-black/30 rounded p-2 overflow-x-auto'>
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
