// GeoForge v2 backend surface — typed fetchers.

import { apiFetchJson } from '@/lib/apiBase';

// ── Types ────────────────────────────────────────────────────────────────

export interface NbhdOutlineProps {
  neighborhoodCode: string;
  medianRatio: number;
  saleCount: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N';
  fillHsl: string;    // "16 55% 56% / 0.24"
  strokeHsl: string;
}

export interface NbhdOutlineFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: NbhdOutlineProps;
}

export interface NbhdOutlineCollection {
  type: 'FeatureCollection';
  features: NbhdOutlineFeature[];
}

export interface ParcelTileProps {
  parcelId: string;
  neighborhoodCode: string | null;
  assessedValue: number;
  propertyClass: string | null;
  areaAcres: number | null;
  yearBuilt: number | null;
  situsAddress: string | null;
  primaryUse: string | null;
  saleDate: string | null;
  salePrice: number;
  qualDecision: string | null;
  ratio: number | null;
  nbhdMedianRatio: number | null;
  ratioDeviation: number | null;
  isOutlier: boolean;
}

export interface ParcelTileFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: ParcelTileProps;
}

export interface ParcelTileCollection {
  type: 'FeatureCollection';
  features: ParcelTileFeature[];
}

export interface RootCauseHypothesis {
  cause: string;
  evidence: string;
  action: string;
}

export interface AuditRankedRow {
  neighborhoodCode: string;
  medianRatio: number;
  cod: number;
  saleCount: number;
  deviation: number;
  impact: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N';
  hypotheses: RootCauseHypothesis[];
  primaryCause: string;
  actionLine: string;
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export function fetchNbhdOutlines(taxYear: number, signal?: AbortSignal) {
  return apiFetchJson<NbhdOutlineCollection>(
    `/geoforge/v2/neighborhoods/outline?taxYear=${taxYear}`,
    { signal },
  );
}

export function fetchParcelTiles(params: {
  taxYear: number;
  bbox?: [number, number, number, number];
  neighborhoodCode?: string | null;
  propertyClass?: string | null;
  limit?: number;
  signal?: AbortSignal;
}) {
  const q = new URLSearchParams({ taxYear: String(params.taxYear) });
  if (params.bbox) q.set('bbox', params.bbox.join(','));
  if (params.neighborhoodCode) q.set('neighborhoodCode', params.neighborhoodCode);
  if (params.propertyClass) q.set('propertyClass', params.propertyClass);
  if (params.limit) q.set('limit', String(params.limit));
  return apiFetchJson<ParcelTileCollection>(
    `/geoforge/v2/parcels/tiles?${q}`,
    { signal: params.signal },
  );
}

export function fetchAuditRanked(taxYear: number, limit = 50, signal?: AbortSignal) {
  return apiFetchJson<AuditRankedRow[]>(
    `/geoforge/v2/audit/ranked?taxYear=${taxYear}&limit=${limit}`,
    { signal },
  );
}
