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

interface InvocationRecord {
  id: string;
  toolId: string;
  status: 'success' | 'error';
  correlationId: string;
  timestamp: Date;
  layers: LayerId[];
  output?: QueryResult;
  error?: ErrorInfo;
}

interface QueryState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: QueryResult;
  correlationId?: string;
  error?: ErrorInfo;
}

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
            layers: Array.from(selectedLayers),
            output: parsed,
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
            layers: Array.from(selectedLayers),
            error: errorInfo,
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
          layers: Array.from(selectedLayers),
          error: networkError,
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
      <div className='flex items-center gap-3'>
        <span className='text-3xl'>🗺️</span>
        <div>
          <h2 className='text-2xl font-bold text-white'>TerraAtlas</h2>
          <p className='text-white/60 text-sm'>Geospatial analysis for {parcelId}</p>
        </div>
      </div>

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
                {selectedLayers.has(layer.id) && (
                  <span className='ml-auto text-blue-400'>✓</span>
                )}
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
            className='aspect-video bg-gradient-to-br from-blue-900/30 to-cyan-900/30 flex items-center justify-center'
          >
            {queryState.status === 'loading' ? (
              <div role='status' className='flex flex-col items-center gap-3'>
                <div className='animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-blue-500' />
                <span className='text-white/60'>Loading layer data...</span>
              </div>
            ) : queryState.status === 'success' && queryState.result ? (
              <div className='text-center p-4'>
                <div className='text-4xl mb-2'>🗺️</div>
                <p className='text-white/80'>Map visualization placeholder</p>
                <p className='text-white/50 text-sm'>
                  Centroid: {queryState.result.centroid?.lat.toFixed(4)},{' '}
                  {queryState.result.centroid?.lng.toFixed(4)}
                </p>
              </div>
            ) : (
              <div className='text-center p-4'>
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
                    Area: <span className='text-white'>{queryState.result.layers.boundary.area}</span>
                  </p>
                  <p>
                    Perimeter:{' '}
                    <span className='text-white'>{queryState.result.layers.boundary.perimeter}</span>
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
                    <span className='text-white'>{queryState.result.layers.zoning.description}</span>
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
        <ErrorDisplay error={{
          message: queryState.error.message,
          errorCode: queryState.error.code,
          correlationId: queryState.correlationId,
        }} />
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
          <h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
            <span>📜</span> Query History
          </h3>

          <div className='space-y-2'>
            {queryHistory.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  record.status === 'success'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <span className={record.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {record.status === 'success' ? '✅' : '❌'}
                  </span>
                  <div>
                    <div className='text-white/80 text-sm font-mono'>{record.toolId}</div>
                    <div className='text-white/50 text-xs'>
                      Layers: {record.layers.join(', ')} •{' '}
                      {record.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <code className='text-white/40 text-xs font-mono'>
                    {record.correlationId.slice(0, 12)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(record.correlationId)}
                    className='text-white/40 hover:text-white text-sm'
                    aria-label='Copy correlation ID'
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAtlas;
