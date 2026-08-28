import {
  fetchNbhdOutlines as fetchGeoForgeCompatibilityOutlines,
  fetchParcelTiles as fetchGeoForgeCompatibilityParcels,
  type NbhdOutlineCollection,
  type ParcelTileCollection,
} from '../geo/v2/v2Api';
import {
  fetchWashingtonCountyStatus,
  type WashingtonCountyStatusEntry,
} from '@/services/washingtonCountyLaunch';

export { fetchWashingtonCountyStatus } from '@/services/washingtonCountyLaunch';
export type { WashingtonCountyStatusEntry } from '@/services/washingtonCountyLaunch';

const BENTON_COUNTY_ID = '19190019-1919-1919-1919-191919191919';
export const ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID = 'county_data_trust_launch_context_v1';

export type CountyDataTrustTier =
  | 'production_verified'
  | 'production_provisional'
  | 'sync_derived'
  | 'converted_legacy_sensitive'
  | 'reference_demo'
  | 'unknown';

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
  contractId: typeof ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID;
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
  trustTier: CountyDataTrustTier;
  trustLabel: string;
  dataTrustBadges: string[];
  databasePosture: string;
  launchContextPosture: string;
  productionClaimAllowed: boolean;
  dataTrustMessage: string;
}

export interface AtlasCompatibilityMapData {
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
}

const DEFAULT_COMPATIBILITY_LAYER_TIMEOUT_MS = 12000;

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

function buildCountyTrustContext(countyCode: string) {
  if (countyCode === '005') {
    return {
      trustTier: 'production_provisional' as const,
      trustLabel: 'Production Provisional',
      dataTrustBadges: [
        'Production Provisional',
        'Sync-Derived',
        'Converted Legacy Sensitive',
      ],
      databasePosture: 'TerraFusion.Benton.Operational + TerraFusion.Benton.LegacyBridge',
      launchContextPosture: 'Benton operational/provisional lane with compatibility geometry during Atlas transfer.',
      productionClaimAllowed: false,
      dataTrustMessage: 'Benton is operational/provisional and sync-derived; 2017 conversion-sensitive sales qualification fields still require visible lineage caution.',
    };
  }

  return {
    trustTier: 'reference_demo' as const,
    trustLabel: 'Demo/Reference Only',
    dataTrustBadges: [
      'Demo/Reference Only',
      'Not Certified for Operational Valuation',
    ],
    databasePosture: 'TerraFusion.Reference39.Demo + TerraFusion.Platform.Metadata',
    launchContextPosture: 'Washington 39-county launch/reference corpus; county-specific production source proof not promoted.',
    productionClaimAllowed: false,
    dataTrustMessage: 'This county context is launch/reference posture only and must not be treated as official production valuation truth.',
  };
}

async function fetchLaunchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`[AtlasLive] ${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
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
  const trustContext = buildCountyTrustContext(detail.countyCode || match.countyCode);

  return {
    contractId: ATLAS_COUNTY_LAUNCH_CONTEXT_CONTRACT_ID,
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
    ...trustContext,
  };
}

export async function fetchAtlasCompatibilityMapData(
  countyCode: string,
  taxYear: number,
  neighborhoodCode: string | null,
  signal?: AbortSignal,
  layerTimeoutMs = DEFAULT_COMPATIBILITY_LAYER_TIMEOUT_MS,
): Promise<AtlasCompatibilityMapData> {
  if (countyCode !== '005') {
    return { outlines: null, parcels: null };
  }

  const withLayerTimeout = async <T,>(loader: () => Promise<T>): Promise<T | null> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        loader(),
        new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), layerTimeoutMs);
        }),
      ]);
    } catch {
      return null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const [outlines, parcels] = await Promise.all([
    withLayerTimeout(() => fetchGeoForgeCompatibilityOutlines(taxYear, signal)),
    withLayerTimeout(() => fetchGeoForgeCompatibilityParcels({
      taxYear,
      neighborhoodCode,
      limit: 5000,
      signal,
    })),
  ]);

  return { outlines, parcels };
}
