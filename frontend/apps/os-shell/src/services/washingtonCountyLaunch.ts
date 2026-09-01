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
  computeWashingtonLaunchCanonicalJsonSha256,
  verifyWashingtonSalesReviewHostedShard,
  type WashingtonSalesReviewHostedShardVerification,
  type WashingtonSalesReviewShardVerificationState,
} from '@/pages/forge/sales/washingtonSalesReviewCapability';
import { evictWashingtonLaunchCountyShard } from '@/pages/forge/sales/washingtonLaunchApi';

export const WASHINGTON_COUNTY_STATUS_PATH = WASHINGTON_REFERENCE_ROUTES.status;
export const WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS = 10_000;
const WASHINGTON_COUNTY_STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const WASHINGTON_COUNTY_DETAIL_PATH_PREFIX = '/launch-data/washington/counties';
const WASHINGTON_SALES_SHARD_PATH_PREFIX = '/launch-data/washington/sales/by-county';

interface WashingtonCountyShardVerificationAttempt {
  active: boolean;
  ownershipChanged: Promise<void>;
  previous: WashingtonCountyShardVerificationAttempt | null;
  signalOwnershipChanged: () => void;
}

const washingtonCountyShardVerificationAttempts =
  new Map<string, WashingtonCountyShardVerificationAttempt>();

function nearestActiveWashingtonCountyShardVerificationAttempt(
  attempt: WashingtonCountyShardVerificationAttempt | null,
): WashingtonCountyShardVerificationAttempt | null {
  let candidate = attempt;
  while (candidate && !candidate.active) {
    candidate = candidate.previous;
  }
  return candidate;
}

function signalAllActiveWashingtonCountyShardVerificationPredecessors(
  attempt: WashingtonCountyShardVerificationAttempt | null,
): void {
  let candidate = attempt;
  while (candidate) {
    if (candidate.active) {
      candidate.signalOwnershipChanged();
    }
    candidate = candidate.previous;
  }
}

function createWashingtonCountyShardVerificationAttempt(
  previous: WashingtonCountyShardVerificationAttempt | null,
): WashingtonCountyShardVerificationAttempt {
  let signalOwnershipChanged = (): void => {};
  const ownershipChanged = new Promise<void>((resolve) => {
    signalOwnershipChanged = resolve;
  });
  return {
    active: true,
    ownershipChanged,
    previous,
    signalOwnershipChanged,
  };
}

async function waitForWashingtonCountyShardVerificationOwnershipChange(
  attempt: WashingtonCountyShardVerificationAttempt,
  callerSignal?: AbortSignal,
): Promise<void> {
  if (callerSignal?.aborted) throw abortErrorForSignal(callerSignal);
  if (!callerSignal) {
    await attempt.ownershipChanged;
    return;
  }

  let rejectForAbort: (() => void) | null = null;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectForAbort = () => reject(abortErrorForSignal(callerSignal));
    callerSignal.addEventListener('abort', rejectForAbort, { once: true });
  });
  try {
    await Promise.race([attempt.ownershipChanged, aborted]);
  } finally {
    if (rejectForAbort) {
      callerSignal.removeEventListener('abort', rejectForAbort);
    }
  }
}

function createWashingtonRequestAbortError(): Error {
  const error = new Error('The Washington public-data request was cancelled.');
  error.name = 'AbortError';
  return error;
}

function abortErrorForSignal(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : createWashingtonRequestAbortError();
}

/**
 * Bound one hosted public-data attempt without weakening caller cancellation.
 * The abort race also settles when a fetch implementation does not reject its
 * promise after receiving the abort signal.
 */
async function runBoundedWashingtonPublicDataRequest<T>(
  request: (signal: AbortSignal) => Promise<T>,
  callerSignal?: AbortSignal,
): Promise<T> {
  if (callerSignal?.aborted) {
    throw abortErrorForSignal(callerSignal);
  }

  const controller = new AbortController();
  const abortFromCaller = (): void => {
    controller.abort(callerSignal?.reason ?? createWashingtonRequestAbortError());
  };
  callerSignal?.addEventListener('abort', abortFromCaller, { once: true });

  let rejectForAbort: (() => void) | null = null;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectForAbort = () => reject(abortErrorForSignal(controller.signal));
    controller.signal.addEventListener('abort', rejectForAbort, { once: true });
  });
  const timeout = globalThis.setTimeout(() => {
    const error = new Error(
      `Washington public-data request timed out after ${WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS} ms.`,
    );
    error.name = 'TimeoutError';
    controller.abort(error);
  }, WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);

  try {
    return await Promise.race([request(controller.signal), aborted]);
  } finally {
    globalThis.clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', abortFromCaller);
    if (rejectForAbort) {
      controller.signal.removeEventListener('abort', rejectForAbort);
    }
  }
}

export interface WashingtonCountyStatusEntry {
  county: string;
  countyCode: string;
  packageIdentity: {
    statusSchemaVersion: string;
    statusCanonicalJsonSha256: string | null;
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

  const statusCanonicalJsonSha256 =
    await computeWashingtonLaunchCanonicalJsonSha256(payload);

  return payload.counties.map((county) => ({
    ...county,
    packageIdentity: {
      statusSchemaVersion: payload.schemaVersion,
      statusCanonicalJsonSha256,
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
  const attempt = createWashingtonCountyShardVerificationAttempt(
    washingtonCountyShardVerificationAttempts.get(county.countyCode) ?? null,
  );
  washingtonCountyShardVerificationAttempts.set(county.countyCode, attempt);
  const isCurrentAttempt = (): boolean =>
    washingtonCountyShardVerificationAttempts.get(county.countyCode) === attempt;
  const restoreNearestActivePreviousAttempt = (): void => {
    if (!isCurrentAttempt()) return;
    const previousAttempt = nearestActiveWashingtonCountyShardVerificationAttempt(
      attempt.previous,
    );
    if (previousAttempt) {
      washingtonCountyShardVerificationAttempts.set(county.countyCode, previousAttempt);
      previousAttempt.signalOwnershipChanged();
    } else {
      washingtonCountyShardVerificationAttempts.delete(county.countyCode);
    }
  };
  try {
    let verification: WashingtonSalesReviewHostedShardVerification;
    try {
      verification = await runBoundedWashingtonPublicDataRequest(
        (boundedSignal) => verifyWashingtonSalesReviewHostedShard(
          county,
          boundedSignal,
          isCurrentAttempt,
        ),
        signal,
      );
    } catch (error) {
      if (signal?.aborted) {
        restoreNearestActivePreviousAttempt();
        throw error;
      }
      if (isCurrentAttempt()) {
        evictWashingtonLaunchCountyShard(county.countyCode, 'hosted');
        restoreNearestActivePreviousAttempt();
      }
      return {
        ...county,
        salesShardVerification: 'unavailable',
      };
    }
    if (verification.state === 'verified') {
      if (!isCurrentAttempt()) {
        await waitForWashingtonCountyShardVerificationOwnershipChange(attempt, signal);
      }
      if (!isCurrentAttempt()) {
        return {
          ...county,
          salesShardVerification: 'unavailable',
        };
      }
      verification.commit();
      return {
        ...county,
        stagedSales: verification.stagedSales,
        needsReview: verification.needsReview,
        latestSaleDate: verification.latestSaleDate,
        salesShardVerification: 'verified',
      };
    }

    if (verification.state === 'unavailable') {
      restoreNearestActivePreviousAttempt();
    }

    return {
      ...county,
      salesShardVerification: verification.state,
    };
  } finally {
    attempt.active = false;
    if (isCurrentAttempt()) {
      washingtonCountyShardVerificationAttempts.delete(county.countyCode);
      signalAllActiveWashingtonCountyShardVerificationPredecessors(
        attempt.previous,
      );
    }
  }
}

/**
 * Resolve the Washington status package from what the running OS actually
 * serves. A hostname allowlist cannot prove that a deployment contains the
 * package, while a configured host outside that list may still serve it.
 *
 * The hosted payload remains fail-closed through fetchWashingtonCountyStatus's
 * schema validation. The hosted attempt is bounded so a stalled response
 * cannot hide the repository-backed 39-county navigation directory. Hosted
 * shard bodies remain unverified until their county
 * is selected, so opening Counties HUB never downloads the statewide package.
 * The selected county then requires a complete-status digest in the build-pinned
 * manifest, a canonical shard digest, official-source binding, and county
 * schema before caching the shard or advertising a workflow. If that trust
 * chain is absent or invalid,
 * the tracked repository reference keeps the 39-county navigation journey
 * available without granting workflow access to its synthetic fixture records.
 */
export async function resolveWashingtonCountyStatus(
  signal?: AbortSignal,
): Promise<WashingtonCountyStatusResolution> {
  try {
    const hostedCounties = await runBoundedWashingtonPublicDataRequest(
      (boundedSignal) => fetchWashingtonCountyStatus(boundedSignal, 'hosted'),
      signal,
    );
    return {
      counties: hostedCounties,
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    const fallbackCounties = await fetchWashingtonCountyStatus(
      signal,
      'repository-reference',
    );
    if (signal?.aborted) throw abortErrorForSignal(signal);
    return {
      counties: fallbackCounties,
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    };
  }
}
