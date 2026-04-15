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
  //   "canonical" — real PACS mirror data (treat as live)
  //   "arcgis"    — real ArcGIS county geometry (treat as live)
  //   "stub"      — parcel not found or layer not available (treat as unavailable)
  //   contains "pacs" — future PACS-direct sources (treat as live)
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
      const result = await atlasGisFetch<ParcelGisData>(
        `/parcels/${encodeURIComponent(parcelId)}`,
      );
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
    data?.boundary?.source === 'live' ? 'live'
    : data?.boundary?.source === 'unavailable' ? 'unavailable'
    : loading ? 'unavailable'
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
export function useParcelBoundary(parcelId: string | undefined): AtlasGisResult<ParcelBoundaryData> {
  const { boundary } = useParcelGis(parcelId);
  return boundary;
}

/**
 * @deprecated Use useParcelGis(parcelId).layers
 */
export function useParcelLayers(parcelId: string | undefined): AtlasGisResult<ParcelLayersData> {
  const { layers } = useParcelGis(parcelId);
  return layers;
}
