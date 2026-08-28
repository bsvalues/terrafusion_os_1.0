/**
 * Read-only projection of the governed Washington launch status package.
 *
 * County selection from this feed is navigation context only. It does not
 * replace authenticated county authority for protected reads or writes.
 */

export const WASHINGTON_COUNTY_STATUS_PATH = '/launch-data/washington/counties/status.json';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isWashingtonCountyStatusEntry(
  value: unknown,
): value is WashingtonCountyStatusEntry {
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
    && typeof value.staticRoutes.salesShard === 'string';
}

export async function fetchWashingtonCountyStatus(
  signal?: AbortSignal,
): Promise<WashingtonCountyStatusEntry[]> {
  const response = await fetch(WASHINGTON_COUNTY_STATUS_PATH, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Washington county status is unavailable (HTTP ${response.status}).`,
    );
  }

  const payload = await response.json() as unknown;
  if (
    !isRecord(payload)
    || !Array.isArray(payload.counties)
    || !payload.counties.every(isWashingtonCountyStatusEntry)
  ) {
    throw new Error('Washington county status returned an invalid county registry.');
  }

  const countyCodes = new Set(payload.counties.map((county) => county.countyCode));
  if (countyCodes.size !== payload.counties.length) {
    throw new Error('Washington county status returned duplicate county contexts.');
  }

  return payload.counties;
}
