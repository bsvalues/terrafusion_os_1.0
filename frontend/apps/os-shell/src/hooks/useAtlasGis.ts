/**
 * useAtlasGis.ts
 *
 * React hooks for the Atlas GIS parcel boundary and layer endpoints:
 *   GET /api/atlas/gis/parcels/{parcelId}/boundary
 *   GET /api/atlas/gis/parcels/{parcelId}/layers
 *
 * Each hook returns { data, loading, error, source } where source reflects
 * whether the response came from PACS ("pacs"), fallback, or is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../lib/apiBase';

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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Atlas GIS ${res.status}: ${res.statusText}`);
  }
  const data: T = await res.json();
  // The backend sets a "source" field on every response.
  // If the source field contains "pacs" or other live-system indicators, it is live data.
  const raw = data as Record<string, unknown>;
  const src = typeof raw.source === 'string' && raw.source.toLowerCase().includes('pacs')
    ? 'live'
    : typeof raw.source === 'string' && raw.source !== ''
      ? 'fallback'
      : 'unavailable';
  return { data, source: src as AtlasGisSource };
}

// ── Hooks ───────────────────────────────────────────────────────────

/**
 * Fetch parcel boundary data (centroid, dimensions, area, situs) from
 * GET /api/atlas/gis/parcels/{parcelId}/boundary
 */
export function useParcelBoundary(parcelId: string | undefined): AtlasGisResult<ParcelBoundaryData> {
  const [data, setData] = useState<ParcelBoundaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<AtlasGisSource>('unavailable');

  const fetch_ = useCallback(async () => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await atlasGisFetch<ParcelBoundaryData>(
        `/parcels/${encodeURIComponent(parcelId)}/boundary`,
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

  return { data, loading, error, source, refetch: fetch_ };
}

/**
 * Fetch parcel layer overlays (zoning, flood, tax area, land classification) from
 * GET /api/atlas/gis/parcels/{parcelId}/layers
 */
export function useParcelLayers(parcelId: string | undefined): AtlasGisResult<ParcelLayersData> {
  const [data, setData] = useState<ParcelLayersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<AtlasGisSource>('unavailable');

  const fetch_ = useCallback(async () => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await atlasGisFetch<ParcelLayersData>(
        `/parcels/${encodeURIComponent(parcelId)}/layers`,
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

  return { data, loading, error, source, refetch: fetch_ };
}
