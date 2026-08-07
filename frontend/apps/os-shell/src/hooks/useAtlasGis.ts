/**
 * useAtlasGis.ts
 *
 * Single hook: useParcelGis(parcelId)
 *   GET /api/atlas/gis/parcels/{parcelId}  — combined boundary + layers, 1 query
 *
 * useParcelBoundary / useParcelLayers are thin wrappers kept for backward compat.
 */

import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../lib/apiBase';
import { getToken } from '../auth/authStorage';

// ── Response types matching backend DTOs ────────────────────────────

export interface ParcelCentroid {
  lat: number;
  lng: number;
  derivedFrom: string;
}

export interface ParcelDimensions {
  frontFeet: number | null;
  depthFeet: number | null;
  widthFront: number | null;
  widthBack: number | null;
  depthLeft: number | null;
  depthRight: number | null;
  effectiveFront: number | null;
  effectiveDepth: number | null;
}

export interface ParcelBoundaryData {
  parcelId: string;
  source: string;
  centroid: ParcelCentroid | null;
  dimensions: ParcelDimensions | null;
  areaAcres: number | null;
  areaSqFt: number | null;
  situsDisplay: string | null;
  /** JSON array of [lng, lat] pairs — outer ring of parcel polygon. Null until ArcGIS sync seeds this parcel. */
  ringJson: string | null;
  ownerName: string | null;
  imageUrl: string | null;
  sketchUrl: string | null;
}

export interface ParcelZoningLayer {
  zoneCode: string | null;
  description: string | null;
  characteristicZoning1: string | null;
  characteristicZoning2: string | null;
  source: string;
}

export interface ParcelFloodLayer {
  zone: string;
  risk: string;
  source: string;
}

export interface ParcelTaxAreaLayer {
  taxAreaNumber: string | null;
  taxAreaDescription: string | null;
  taxYear: number | null;
  source: string;
}

export interface ParcelLandClassLayer {
  landTypeCode: string | null;
  landClassCode: string | null;
  primaryUseCd: string | null;
  subUseCd: string | null;
  source: string;
}

export interface ParcelLayersData {
  parcelId: string;
  source: string;
  zoning: ParcelZoningLayer | null;
  flood: ParcelFloodLayer | null;
  taxArea: ParcelTaxAreaLayer | null;
  landClass: ParcelLandClassLayer | null;
}

// ── Hook result type ────────────────────────────────────────────────

export type AtlasGisSource = 'live' | 'fallback' | 'unavailable';

export interface AtlasGisResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  source: AtlasGisSource;
  refetch: () => void;
}

export interface AtlasProjectionFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    countyId: string;
    parcelId: string;
    evidenceState: 'canonical';
  };
}

export type AtlasProjectionState =
  | { status: 'loading'; feature: null; error: null }
  | { status: 'polygon'; feature: AtlasProjectionFeature; error: null }
  | { status: 'unavailable'; feature: null; error: null }
  | { status: 'error'; feature: null; error: string; correlationId: string };

export type AtlasProjectionResult = AtlasProjectionState & {
  refetch: () => void;
};

export type ParcelBoundaryResult = AtlasGisResult<ParcelBoundaryData> & {
  atlasProjection?: AtlasProjectionResult;
};

// ── Internal fetch helper ───────────────────────────────────────────

async function atlasGisFetch<T>(path: string): Promise<{ data: T; source: AtlasGisSource }> {
  const url = buildApiUrl(`/atlas/gis${path}`);
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Atlas GIS ${res.status}: ${res.statusText}`);
  }
  const data: T = await res.json();
  // Map backend "source" field to AtlasGisSource.
  // GisDataService returns:
  //   "canonical" — real county assessment mirror data (treat as live)
  //   "arcgis"    — real ArcGIS county geometry (treat as live)
  //   "stub"      — parcel not found or layer not available (treat as unavailable)
  //   anything else non-empty — partial/enriched fallback
  const raw = data as Record<string, unknown>;
  const rawSrc = typeof raw.source === 'string' ? raw.source.toLowerCase() : '';
  const src: AtlasGisSource =
    rawSrc === 'live' || rawSrc === 'arcgis' || rawSrc === 'canonical'
      ? 'live'
      : rawSrc === 'unavailable' || rawSrc === 'stub' || rawSrc === ''
        ? 'unavailable'
        : 'fallback';
  return { data, source: src };
}

// ── Combined hook (preferred) ────────────────────────────────────────

export interface ParcelGisData {
  boundary: ParcelBoundaryData;
  layers: ParcelLayersData;
}

/**
 * Single-round-trip GIS hook.
 * Fetches GET /api/atlas/gis/parcels/{parcelId} — 1 DB query, returns boundary + layers.
 */
export function useParcelGis(parcelId: string | undefined): {
  boundary: AtlasGisResult<ParcelBoundaryData>;
  layers: AtlasGisResult<ParcelLayersData>;
} {
  const [data, setData] = useState<ParcelGisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<AtlasGisSource>('unavailable');

  const fetch_ = useCallback(async () => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await atlasGisFetch<ParcelGisData>(`/parcels/${encodeURIComponent(parcelId)}`);
      setData(result.data);
      setSource(result.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSource('unavailable');
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const boundarySource: AtlasGisSource =
    data?.boundary?.source === 'live'
      ? 'live'
      : data?.boundary?.source === 'unavailable'
        ? 'unavailable'
        : loading
          ? 'unavailable'
          : 'fallback';

  return {
    boundary: {
      data: data?.boundary ?? null,
      loading,
      error,
      source: boundarySource,
      refetch: fetch_,
    },
    layers: {
      data: data?.layers ?? null,
      loading,
      error,
      source,
      refetch: fetch_,
    },
  };
}

// ── Backward-compat wrappers ─────────────────────────────────────────

/**
 * @deprecated Use useParcelGis(parcelId).boundary
 */
export function useParcelBoundary(
  parcelId: string | undefined
): ParcelBoundaryResult {
  const { boundary } = useParcelGis(parcelId);
  const atlasProjection = useAtlasProjection(parcelId);
  return { ...boundary, atlasProjection };
}

/**
 * @deprecated Use useParcelGis(parcelId).layers
 */
export function useParcelLayers(parcelId: string | undefined): AtlasGisResult<ParcelLayersData> {
  const { layers } = useParcelGis(parcelId);
  return layers;
}

function isCanonicalPolygon(value: unknown): value is AtlasProjectionFeature {
  if (!value || typeof value !== 'object') return false;
  const feature = value as Partial<AtlasProjectionFeature>;
  const properties = feature.properties;
  const geometry = feature.geometry;
  return (
    feature.type === 'Feature' &&
    geometry?.type === 'Polygon' &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0 &&
    geometry.coordinates.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        ring.every(
          (position) =>
            Array.isArray(position) &&
            position.length === 2 &&
            position.every(
              (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)
            )
        )
    ) &&
    properties?.evidenceState === 'canonical' &&
    normalizeGuid(properties.countyId) !== null &&
    normalizeGuid(properties.parcelId) !== null
  );
}

function normalizeGuid(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    return null;
  }
  return value.toLowerCase();
}

function createNetworkCorrelationId(): string {
  return `net-${globalThis.crypto.randomUUID()}`;
}

function responseCorrelationId(response: Response): string {
  const value =
    response.headers.get('x-correlation-id')?.trim() ||
    response.headers.get('x-request-id')?.trim();
  if (!value) return createNetworkCorrelationId();
  return value.startsWith('corr-') ? value : `corr-${value}`;
}

/**
 * Authenticated canonical Atlas projection. This does not replace or relabel
 * the legacy GIS compatibility endpoint.
 */
export function useAtlasProjection(parcelId: string | undefined): AtlasProjectionResult {
  const [state, setState] = useState<AtlasProjectionState>({
    status: parcelId ? 'loading' : 'unavailable',
    feature: null,
    error: null,
  });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!parcelId) {
      setState({ status: 'unavailable', feature: null, error: null });
      return;
    }

    const controller = new AbortController();
    const token = getToken();
    if (!token) {
      setState({
        status: 'error',
        feature: null,
        error: 'Authentication is required for canonical Atlas geometry.',
        correlationId: createNetworkCorrelationId(),
      });
      return () => controller.abort();
    }

    let correlationId = createNetworkCorrelationId();
    setState({ status: 'loading', feature: null, error: null });
    void fetch(buildApiUrl(`/parcels/${encodeURIComponent(parcelId)}/atlas-projection`), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        correlationId = responseCorrelationId(response);
        if (response.status === 404 || response.status === 503) {
          return null;
        }
        if (!response.ok) {
          throw new Error(`Canonical Atlas ${response.status}: ${response.statusText}`);
        }
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        if (payload === null) {
          setState({ status: 'unavailable', feature: null, error: null });
          return;
        }
        if (!isCanonicalPolygon(payload)) {
          throw new Error('Canonical Atlas returned an invalid Polygon contract.');
        }
        setState({ status: 'polygon', feature: payload, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          feature: null,
          error: error instanceof Error ? error.message : 'Canonical Atlas request failed.',
          correlationId,
        });
      });

    return () => controller.abort();
  }, [parcelId, requestVersion]);

  return {
    ...state,
    refetch: () => setRequestVersion((version) => version + 1),
  };
}
