import { create } from 'zustand';

import { getToken } from '@/auth/authStorage';
import { getSession } from '@/auth/session';
import { apiFetchJson } from '@/lib/apiBase';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

export interface TerraGamaCountyStats {
  taxYear: number;
  totalParcels: number;
  averageAssessedValue: number;
  assessedThisYear: number;
  pendingAssessments: number;
  assessmentCompletionPercent: number;
}

export interface TerraGamaNeighborhoodSnapshot {
  neighborhood_code: string;
  parcel_count: number;
  median_ratio: number;
  cod: number;
  prd: number;
  sale_count: number;
}

export interface TerraGamaSpatialAutocorrelation {
  taxYear?: number;
  sampleSize: number;
  sampleWithCoords?: number;
  kNeighbors?: number;
  moransI?: number;
  expectedI?: number;
  variance?: number;
  zScore?: number;
  pValue?: number;
  significantClustering?: boolean;
  interpretation?: string;
  error?: string;
}

export interface TerraGamaVarianceNeighborhood {
  neighborhood: string;
  count: number;
  medianRatio: number;
  meanRatio: number;
  stdDev: number;
  deviationFromGrandMean: number;
}

export interface TerraGamaVarianceDecomposition {
  taxYear?: number;
  totalSampleSize?: number;
  neighborhoodCount?: number;
  icc?: number;
  ssBetween?: number;
  ssWithin?: number;
  ssTotal?: number;
  interpretation?: string;
  neighborhoods?: TerraGamaVarianceNeighborhood[];
  sampleSize?: number;
  error?: string;
}

export interface TerraGamaCountyScope {
  countyId: string | null;
  isolated: boolean;
  message: string | null;
}

export interface TerraGamaStats {
  parcels: number;
  neighborhoods: number;
  geocodedSales: number;
  moransI: number | null;
  icc: number | null;
}

interface TerraGamaState {
  taxYear: number;
  loading: boolean;
  error: string | null;
  countyScope: TerraGamaCountyScope;
  countyStats: TerraGamaCountyStats | null;
  neighborhoods: TerraGamaNeighborhoodSnapshot[];
  spatial: TerraGamaSpatialAutocorrelation | null;
  variance: TerraGamaVarianceDecomposition | null;
  stats: TerraGamaStats;
  source: string | null;
  lastLoadedAt: string | null;
  fetchRuntimeData: (taxYear?: number) => Promise<void>;
}

const DEFAULT_TAX_YEAR = 2026;
const SOURCE = 'Benton County TerraForge spatial ratio-study endpoints';
const REQUEST_TIMEOUT_MS = 15_000;

const emptyStats: TerraGamaStats = {
  parcels: 0,
  neighborhoods: 0,
  geocodedSales: 0,
  moransI: null,
  icc: null,
};

function messageForCountyScope(countyId: string | null): string {
  return countyId
    ? `TerraGAMA requires an active isolated county session. Active county ${countyId} is not isolated.`
    : 'TerraGAMA requires an active isolated county session before live spatial analytics can load.';
}

function getTerraGamaCountyScope(): TerraGamaCountyScope {
  const session = getSession();
  const { isolated } = buildCountyScopedSessionHeaders(session);
  const countyId = session?.countyId?.trim() || null;
  return {
    countyId,
    isolated,
    message: isolated ? null : messageForCountyScope(countyId),
  };
}

function queryFor(taxYear: number, countyId: string | null): string {
  const params = new URLSearchParams({ taxYear: String(taxYear) });
  if (countyId) {
    params.set('countyId', countyId);
  }
  return params.toString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function timeoutSignal(): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }
  return undefined;
}

function requestInit(headers: Record<string, string>): RequestInit {
  return {
    headers,
    signal: timeoutSignal(),
  };
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function rejectedReason<T>(label: string, result: PromiseSettledResult<T>): string | null {
  return result.status === 'rejected' ? `${label}: ${errorMessage(result.reason)}` : null;
}

export const useTerraGamaStore = create<TerraGamaState>((set) => ({
  taxYear: DEFAULT_TAX_YEAR,
  loading: false,
  error: null,
  countyScope: getTerraGamaCountyScope(),
  countyStats: null,
  neighborhoods: [],
  spatial: null,
  variance: null,
  stats: emptyStats,
  source: null,
  lastLoadedAt: null,

  async fetchRuntimeData(taxYear = DEFAULT_TAX_YEAR) {
    const session = getSession();
    const { headers, isolated } = buildCountyScopedSessionHeaders(session);
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const countyId = session?.countyId?.trim() || null;
    const countyScope: TerraGamaCountyScope = {
      countyId,
      isolated,
      message: isolated ? null : messageForCountyScope(countyId),
    };

    if (!isolated) {
      set({
        taxYear,
        loading: false,
        error: countyScope.message,
        countyScope,
        countyStats: null,
        neighborhoods: [],
        spatial: null,
        variance: null,
        stats: emptyStats,
        source: null,
        lastLoadedAt: null,
      });
      return;
    }

    const query = queryFor(taxYear, countyId);
    set({ taxYear, loading: true, error: null, countyScope });

    try {
      const [countyStatsResult, neighborhoodsResult, spatialResult, varianceResult] = await Promise.allSettled([
        apiFetchJson<TerraGamaCountyStats>(`/terraforge/county-stats?${query}`, requestInit(headers)),
        apiFetchJson<TerraGamaNeighborhoodSnapshot[]>(`/terraforge/comparison-snapshots?${query}`, requestInit(headers)),
        apiFetchJson<TerraGamaSpatialAutocorrelation>(
          `/terraforge/ratio-study/spatial-autocorrelation?${query}`,
          requestInit(headers),
        ),
        apiFetchJson<TerraGamaVarianceDecomposition>(
          `/terraforge/ratio-study/variance-decomposition?${query}`,
          requestInit(headers),
        ),
      ]);

      const spatial = settledValue<TerraGamaSpatialAutocorrelation>(spatialResult, { sampleSize: 0 });
      const variance = settledValue<TerraGamaVarianceDecomposition>(varianceResult, {});
      const countyStats = settledValue<TerraGamaCountyStats | null>(countyStatsResult, null);
      const neighborhoods = settledValue<TerraGamaNeighborhoodSnapshot[]>(neighborhoodsResult, []);
      const failures = [
        rejectedReason('County stats', countyStatsResult),
        rejectedReason('Neighborhood snapshots', neighborhoodsResult),
        rejectedReason('Spatial autocorrelation', spatialResult),
        rejectedReason('Variance decomposition', varianceResult),
      ].filter((item): item is string => Boolean(item));

      if (spatialResult.status === 'rejected' && varianceResult.status === 'rejected') {
        throw new Error(failures.join('; ') || 'TerraGAMA live spatial analytics failed to load.');
      }

      set({
        loading: false,
        error: failures.length > 0 ? `Partial live data loaded. ${failures.join('; ')}` : null,
        countyScope,
        countyStats,
        neighborhoods,
        spatial,
        variance,
        stats: {
          parcels: countyStats?.totalParcels ?? 0,
          neighborhoods: neighborhoods.length,
          geocodedSales: spatial.sampleWithCoords ?? 0,
          moransI: typeof spatial.moransI === 'number' ? spatial.moransI : null,
          icc: typeof variance.icc === 'number' ? variance.icc : null,
        },
        source: SOURCE,
        lastLoadedAt: new Date().toISOString(),
      });
    } catch (error) {
      set({
        loading: false,
        error: errorMessage(error),
        countyScope,
        stats: emptyStats,
        source: null,
        lastLoadedAt: null,
      });
    }
  },
}));
