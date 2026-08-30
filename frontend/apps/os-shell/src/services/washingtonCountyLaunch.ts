/**
 * Read-only projection of the tracked Washington assessor reference package.
 *
 * County selection from this feed is navigation context only. It does not
 * replace authenticated county authority for protected reads or writes.
 */

import {
  resolveWashingtonAssessorReferenceRoute,
  type WashingtonReferencePackageSource,
  WASHINGTON_REFERENCE_ROUTES,
} from '@/lib/washingtonAssessorReferencePackage';
import {
  verifyWashingtonSalesReviewHostedShard,
  type WashingtonSalesReviewShardVerificationState,
} from '@/pages/forge/sales/washingtonSalesReviewCapability';

export const WASHINGTON_COUNTY_STATUS_PATH = WASHINGTON_REFERENCE_ROUTES.status;
const WASHINGTON_COUNTY_STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const WASHINGTON_COUNTY_DETAIL_PATH_PREFIX = '/launch-data/washington/counties';
const WASHINGTON_SALES_SHARD_PATH_PREFIX = '/launch-data/washington/sales/by-county';

export interface WashingtonCountyStatusEntry {
  county: string;
  countyCode: string;
  packageIdentity: {
    statusSchemaVersion: string;
    generatedAt: string;
    sourcePosture: string;
  };
  priority: string;
  prometheusStatus: string;
  primarySourceMode: string;
  latestSaleDate: string | null;
  candidateSales: number;
  stagedSales: number;
  needsReview: number;
  salesShardVerification: WashingtonSalesReviewShardVerificationState;
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

type WashingtonCountyStatusPayloadEntry = Omit<
  WashingtonCountyStatusEntry,
  'packageIdentity' | 'salesShardVerification'
>;

export interface WashingtonCountyStatusResolution {
  counties: WashingtonCountyStatusEntry[];
  packageSource: WashingtonReferencePackageSource;
  usedRepositoryFallback: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCanonicalCountyRoute(
  route: string,
  countyCode: string,
  kind: 'detail' | 'sales-shard',
): boolean {
  if (!route) return true;
  const prefix = kind === 'detail'
    ? WASHINGTON_COUNTY_DETAIL_PATH_PREFIX
    : WASHINGTON_SALES_SHARD_PATH_PREFIX;
  return route === `${prefix}/${countyCode}.json`;
}

function isWashingtonCountyStatusPayloadEntry(
  value: unknown,
): value is WashingtonCountyStatusPayloadEntry {
  if (!isRecord(value) || !isRecord(value.confidence) || !isRecord(value.staticRoutes)) {
    return false;
  }

  return typeof value.county === 'string'
    && value.county.trim().length > 0
    && typeof value.countyCode === 'string'
    && /^\d{3}$/.test(value.countyCode)
    && typeof value.priority === 'string'
    && typeof value.prometheusStatus === 'string'
    && typeof value.primarySourceMode === 'string'
    && (value.latestSaleDate === null || typeof value.latestSaleDate === 'string')
    && isFiniteNumber(value.candidateSales)
    && isFiniteNumber(value.stagedSales)
    && isFiniteNumber(value.needsReview)
    && isFiniteNumber(value.confidence.averageQualityScore)
    && typeof value.confidence.parserStatus === 'string'
    && typeof value.confidence.rawStatus === 'string'
    && typeof value.confidence.rawDriftDetected === 'boolean'
    && typeof value.staticRoutes.detail === 'string'
    && typeof value.staticRoutes.salesShard === 'string'
    && isCanonicalCountyRoute(value.staticRoutes.detail, value.countyCode, 'detail')
    && isCanonicalCountyRoute(value.staticRoutes.salesShard, value.countyCode, 'sales-shard');
}

export async function fetchWashingtonCountyStatus(
  signal?: AbortSignal,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<WashingtonCountyStatusEntry[]> {
  if (signal?.aborted) return [];
  let payload: unknown;
  if (packageSource === 'repository-reference') {
    payload = resolveWashingtonAssessorReferenceRoute(WASHINGTON_COUNTY_STATUS_PATH);
  } else {
    const response = await fetch(WASHINGTON_COUNTY_STATUS_PATH, {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) {
      throw new Error(
        `Washington county status is unavailable (HTTP ${response.status}).`,
      );
    }
    payload = await response.json() as unknown;
  }
  if (
    !isRecord(payload)
    || payload.schemaVersion !== WASHINGTON_COUNTY_STATUS_SCHEMA
    || typeof payload.generatedAt !== 'string'
    || payload.generatedAt.trim().length === 0
    || typeof payload.sourcePosture !== 'string'
    || payload.sourcePosture.trim().length === 0
    || !Array.isArray(payload.counties)
    || !payload.counties.every(isWashingtonCountyStatusPayloadEntry)
  ) {
    throw new Error('Washington county status returned an invalid county registry.');
  }

  const countyCodes = new Set(payload.counties.map((county) => county.countyCode));
  if (countyCodes.size !== payload.counties.length) {
    throw new Error('Washington county status returned duplicate county contexts.');
  }

  return payload.counties.map((county) => ({
    ...county,
    packageIdentity: {
      statusSchemaVersion: payload.schemaVersion,
      generatedAt: payload.generatedAt,
      sourcePosture: payload.sourcePosture,
    },
    salesShardVerification: packageSource === 'hosted' ? 'unverified' : 'not-required',
    confidence: { ...county.confidence },
    staticRoutes: { ...county.staticRoutes },
  }));
}

export async function verifyWashingtonCountySalesShard(
  county: WashingtonCountyStatusEntry,
  signal?: AbortSignal,
): Promise<WashingtonCountyStatusEntry> {
  const verification = await verifyWashingtonSalesReviewHostedShard(county, signal);
  if (verification.state === 'verified') {
    return {
      ...county,
      stagedSales: verification.stagedSales,
      needsReview: verification.needsReview,
      latestSaleDate: verification.latestSaleDate,
      salesShardVerification: 'verified',
    };
  }

  return {
    ...county,
    salesShardVerification: verification.state,
  };
}

/**
 * Resolve the Washington status package from what the running OS actually
 * serves. A hostname allowlist cannot prove that a deployment contains the
 * package, while a configured host outside that list may still serve it.
 *
 * The hosted payload remains fail-closed through fetchWashingtonCountyStatus's
 * schema validation. Hosted shard bodies remain unverified until their county
 * is selected, so opening Counties HUB never downloads the statewide package.
 * The selected county then requires a matching manifest attestation, canonical
 * shard digest, official-source binding, and county schema before caching the
 * shard or advertising a workflow. If that trust chain is absent or invalid,
 * the tracked repository reference keeps the 39-county navigation journey
 * available without granting workflow access to its synthetic fixture records.
 */
export async function resolveWashingtonCountyStatus(
  signal?: AbortSignal,
): Promise<WashingtonCountyStatusResolution> {
  try {
    const hostedCounties = await fetchWashingtonCountyStatus(signal, 'hosted');
    return {
      counties: hostedCounties,
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return {
      counties: await fetchWashingtonCountyStatus(signal, 'repository-reference'),
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    };
  }
}
