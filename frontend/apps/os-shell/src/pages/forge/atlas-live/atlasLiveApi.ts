import {
  fetchNbhdOutlines as fetchGeoForgeCompatibilityOutlines,
  fetchParcelTiles as fetchGeoForgeCompatibilityParcels,
  type NbhdOutlineCollection,
  type ParcelTileCollection,
} from '../geo/v2/v2Api';

const BENTON_COUNTY_ID = '19190019-1919-1919-1919-191919191919';

export interface WashingtonCountyStatusEntry {
  county: string;
  countyCode: string;
  priority: string;
  prometheusStatus: string;
  primarySourceMode: string;
  latestSaleDate: string | null;
  candidateSales: number;
  stagedSales: number;
  needsReview: number;
  confidence: {
    averageQualityScore: number;
    parserStatus: string;
    rawStatus: string;
    rawDriftDetected: boolean;
  };
  staticRoutes: {
    detail: string;
    salesShard: string;
  };
}

interface WashingtonCountyStatusFile {
  counties: WashingtonCountyStatusEntry[];
}

interface WashingtonCountyDetailFile {
  county: string;
  countyCode: string;
  operationalState?: {
    primarySourceMode?: string;
    prometheusStatus?: string;
  };
  summary?: {
    records?: number;
    latestSaleDate?: string | null;
  };
  salesRoute?: string;
}

export interface AtlasRouteScope {
  studyId: string | null;
  countyId: string | null;
  countyName: string | null;
  countyCode: string | null;
  segmentId: string | null;
  neighborhoodCode: string | null;
  taxYear: number;
}

export type AtlasGeometryAvailability = 'compatibility' | 'unpublished';

export interface AtlasCountyContext {
  countyId: string | null;
  countyName: string;
  countyCode: string;
  segmentId: string | null;
  neighborhoodCode: string | null;
  studyId: string | null;
  taxYear: number;
  primarySourceMode: string | null;
  prometheusStatus: string;
  latestSaleDate: string | null;
  stagedSales: number;
  needsReview: number;
  detailRoute: string;
  salesRoute: string;
  geometryAvailability: AtlasGeometryAvailability;
  geometryMessage: string;
}

export interface AtlasCompatibilityMapData {
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
}

function normalizeCountyName(value: string): string {
  return value
    .replace(/\s+county$/i, '')
    .trim()
    .toLowerCase();
}

function resolveCountyName(countyId: string | null, countyName: string | null): string | null {
  if (countyName && countyName.trim().length > 0) {
    return countyName.trim();
  }
  if (countyId?.toLowerCase() === BENTON_COUNTY_ID.toLowerCase()) {
    return 'Benton';
  }
  return null;
}

async function fetchLaunchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`[AtlasLive] ${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchWashingtonCountyStatus(signal?: AbortSignal): Promise<WashingtonCountyStatusEntry[]> {
  const status = await fetchLaunchJson<WashingtonCountyStatusFile>(
    '/launch-data/washington/counties/status.json',
    signal,
  );
  return status.counties;
}

export async function fetchAtlasCountyContext(
  scope: AtlasRouteScope,
  signal?: AbortSignal,
): Promise<AtlasCountyContext | null> {
  const resolvedCountyName = resolveCountyName(scope.countyId, scope.countyName);
  if (!resolvedCountyName && !scope.countyCode) {
    return null;
  }

  const counties = await fetchWashingtonCountyStatus(signal);
  const match = counties.find((county) => {
    if (scope.countyCode) {
      return county.countyCode === scope.countyCode;
    }
    return normalizeCountyName(county.county) === normalizeCountyName(resolvedCountyName!);
  });

  if (!match) {
    return null;
  }

  const detail = await fetchLaunchJson<WashingtonCountyDetailFile>(match.staticRoutes.detail, signal);
  const geometryAvailability: AtlasGeometryAvailability =
    match.countyCode === '005' ? 'compatibility' : 'unpublished';

  return {
    countyId: scope.countyId,
    countyName: detail.county || match.county,
    countyCode: detail.countyCode || match.countyCode,
    segmentId: scope.segmentId,
    neighborhoodCode: scope.neighborhoodCode,
    studyId: scope.studyId,
    taxYear: scope.taxYear,
    primarySourceMode: detail.operationalState?.primarySourceMode ?? match.primarySourceMode ?? null,
    prometheusStatus: detail.operationalState?.prometheusStatus ?? match.prometheusStatus,
    latestSaleDate: detail.summary?.latestSaleDate ?? match.latestSaleDate ?? null,
    stagedSales: detail.summary?.records ?? match.stagedSales,
    needsReview: match.needsReview,
    detailRoute: match.staticRoutes.detail,
    salesRoute: detail.salesRoute ?? match.staticRoutes.salesShard,
    geometryAvailability,
    geometryMessage:
      geometryAvailability === 'compatibility'
        ? 'Parcel and neighborhood geometry are currently served through the Benton compatibility map feed while Atlas Live transfer completes.'
        : 'County geometry is not yet published in the statewide hosted Atlas lane. County scope is real; parcel map geometry is still unavailable for this county.',
  };
}

export async function fetchAtlasCompatibilityMapData(
  countyCode: string,
  taxYear: number,
  neighborhoodCode: string | null,
  signal?: AbortSignal,
): Promise<AtlasCompatibilityMapData> {
  if (countyCode !== '005') {
    return { outlines: null, parcels: null };
  }

  const [outlines, parcels] = await Promise.all([
    fetchGeoForgeCompatibilityOutlines(taxYear, signal),
    fetchGeoForgeCompatibilityParcels({
      taxYear,
      neighborhoodCode,
      limit: 5000,
      signal,
    }),
  ]);

  return { outlines, parcels };
}
