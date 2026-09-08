/**
 * Read-only projection of the tracked Washington assessor reference package.
 *
 * County selection from this feed is navigation context only. It does not
 * replace authenticated county authority for protected reads or writes.
 */

import {
  resolveWashingtonAssessorReferenceRoute,
  WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
  type WashingtonReferencePackageSource,
  WASHINGTON_REFERENCE_ROUTES,
} from '@/lib/washingtonAssessorReferencePackage';
import {
  computeWashingtonLaunchCanonicalJsonSha256,
  verifyWashingtonSalesReviewHostedShard,
  type WashingtonSalesReviewHostedShardVerification,
  type WashingtonSalesReviewShardVerificationState,
} from '@/pages/forge/sales/washingtonSalesReviewCapability';
import {
  evictWashingtonLaunchCountyShard,
  WASHINGTON_COUNTIES,
} from '@/pages/forge/sales/washingtonLaunchApi';
import { getViteEnv } from '@/env/getViteEnv';

export const WASHINGTON_COUNTY_STATUS_PATH = WASHINGTON_REFERENCE_ROUTES.status;

/** Runtime metadata only. Source links and seed labels cannot establish public use. */
export interface WashingtonParcelBaseline {
  contractId: 'wal.county-parcel-baseline.v1';
  countyId: string;
  countyKey: string;
  countyName: string;
  countyCode: string;
  fipsCode: string;
  observedParcelCount: number;
  linkedParcelCount: number;
  latestParcelUpdatedAtUtc: string | null;
  publicProvenance: 'unverified';
  sourceUse: 'unverified';
  publicReady: false;
  status: 'no-parcels' | 'unverified';
  gapReasons: string[];
}

export async function fetchWashingtonParcelBaseline(
  countyCode: string,
  request: (path: string, init?: RequestInit) => Promise<Response>,
  signal?: AbortSignal
): Promise<WashingtonParcelBaseline> {
  const county = WASHINGTON_COUNTIES.find((entry) => entry.code === countyCode);
  if (!county) throw new Error('Unsupported Washington county.');
  return runBoundedWashingtonPublicDataRequest(async (boundedSignal) => {
    const response = await request(`/counties/${county.code}/parcel-baseline`, {
      method: 'GET',
      cache: 'no-store',
      signal: boundedSignal,
    });
    if (!response.ok) throw new Error(`Parcel baseline unavailable (HTTP ${response.status}).`);
    const value: unknown = await response.json();
    if (boundedSignal.aborted) throw abortErrorForSignal(boundedSignal);
    const fields = [
      'contractId',
      'countyId',
      'countyKey',
      'countyName',
      'countyCode',
      'fipsCode',
      'observedParcelCount',
      'linkedParcelCount',
      'latestParcelUpdatedAtUtc',
      'publicProvenance',
      'sourceUse',
      'publicReady',
      'status',
      'gapReasons',
    ];
    const invalid = () =>
      new Error('Parcel baseline response could not be verified for this county.');
    if (
      !isRecord(value) ||
      Array.isArray(value) ||
      Object.keys(value).length !== fields.length ||
      !fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
    )
      throw invalid();
    const count = value.observedParcelCount;
    const linked = value.linkedParcelCount;
    const timestamp = value.latestParcelUpdatedAtUtc;
    const gaps = value.gapReasons;
    const expectedGaps =
      count === 0
        ? ['no-runtime-parcels', 'public-provenance-unverified', 'source-use-unverified']
        : ['public-provenance-unverified', 'source-use-unverified'];
    if (
      value.contractId !== 'wal.county-parcel-baseline.v1' ||
      value.countyCode !== county.code ||
      value.countyName !== county.name ||
      value.countyKey !== `wa-${county.name.toLowerCase().replace(/ /g, '-')}` ||
      value.fipsCode !== `53${county.code}` ||
      typeof value.countyId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.countyId) ||
      value.countyId === '00000000-0000-0000-0000-000000000000' ||
      typeof count !== 'number' ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      typeof linked !== 'number' ||
      !Number.isSafeInteger(linked) ||
      linked < 0 ||
      linked > count ||
      (timestamp !== null &&
        (typeof timestamp !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z$/.test(timestamp) ||
          !Number.isFinite(Date.parse(timestamp)) ||
          new Date(timestamp).toISOString().slice(0, 19) !== timestamp.slice(0, 19))) ||
      (count === 0 && timestamp !== null) ||
      value.publicProvenance !== 'unverified' ||
      value.sourceUse !== 'unverified' ||
      value.publicReady !== false ||
      value.status !== (count === 0 ? 'no-parcels' : 'unverified') ||
      !Array.isArray(gaps) ||
      gaps.length !== expectedGaps.length ||
      !expectedGaps.every((gap) => gaps.includes(gap))
    )
      throw invalid();
    return value as unknown as WashingtonParcelBaseline;
  }, signal);
}
export const WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS = 10_000;
const WASHINGTON_COUNTY_STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const WASHINGTON_COUNTY_DETAIL_PATH_PREFIX = '/launch-data/washington/counties';
const WASHINGTON_SALES_SHARD_PATH_PREFIX = '/launch-data/washington/sales/by-county';
export const WASHINGTON_CONFERENCE_LOCAL_PACKAGE_ENV = 'VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE';
const WASHINGTON_COUNTY_DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';

interface WashingtonCountyShardVerificationAttempt {
  active: boolean;
  ownershipRevision: number;
  ownershipWaiters: Set<() => void>;
  permanentlySuperseded: boolean;
  previous: WashingtonCountyShardVerificationAttempt | null;
}

const washingtonCountyShardVerificationAttempts = new Map<
  string,
  WashingtonCountyShardVerificationAttempt
>();

function nearestActiveWashingtonCountyShardVerificationAttempt(
  attempt: WashingtonCountyShardVerificationAttempt | null
): WashingtonCountyShardVerificationAttempt | null {
  let candidate = attempt;
  while (candidate && !candidate.active) {
    candidate = candidate.previous;
  }
  return candidate;
}

function signalAllActiveWashingtonCountyShardVerificationPredecessors(
  attempt: WashingtonCountyShardVerificationAttempt | null
): void {
  let candidate = attempt;
  while (candidate) {
    if (candidate.active) {
      signalWashingtonCountyShardVerificationOwnershipChanged(candidate, true);
    }
    candidate = candidate.previous;
  }
}

function signalWashingtonCountyShardVerificationOwnershipChanged(
  attempt: WashingtonCountyShardVerificationAttempt,
  permanentlySuperseded = false
): void {
  if (permanentlySuperseded) {
    attempt.permanentlySuperseded = true;
  }
  attempt.ownershipRevision += 1;
  const waiters = [...attempt.ownershipWaiters];
  attempt.ownershipWaiters.clear();
  for (const waiter of waiters) {
    waiter();
  }
}

function createWashingtonCountyShardVerificationAttempt(
  previous: WashingtonCountyShardVerificationAttempt | null
): WashingtonCountyShardVerificationAttempt {
  return {
    active: true,
    ownershipRevision: 0,
    ownershipWaiters: new Set(),
    permanentlySuperseded: false,
    previous,
  };
}

async function waitForWashingtonCountyShardVerificationOwnershipChange(
  attempt: WashingtonCountyShardVerificationAttempt,
  observedRevision: number,
  callerSignal?: AbortSignal
): Promise<void> {
  if (callerSignal?.aborted) throw abortErrorForSignal(callerSignal);
  if (attempt.permanentlySuperseded || attempt.ownershipRevision !== observedRevision) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = (): void => {
      attempt.ownershipWaiters.delete(ownershipChanged);
      callerSignal?.removeEventListener('abort', aborted);
    };
    const ownershipChanged = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const aborted = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(abortErrorForSignal(callerSignal as AbortSignal));
    };

    attempt.ownershipWaiters.add(ownershipChanged);
    callerSignal?.addEventListener('abort', aborted, { once: true });

    if (attempt.permanentlySuperseded || attempt.ownershipRevision !== observedRevision) {
      ownershipChanged();
    } else if (callerSignal?.aborted) {
      aborted();
    }
  });
}

function createWashingtonRequestAbortError(): Error {
  const error = new Error('The Washington public-data request was cancelled.');
  error.name = 'AbortError';
  return error;
}

function abortErrorForSignal(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : createWashingtonRequestAbortError();
}

/**
 * Bound one hosted public-data attempt without weakening caller cancellation.
 * The abort race also settles when a fetch implementation does not reject its
 * promise after receiving the abort signal.
 */
async function runBoundedWashingtonPublicDataRequest<T>(
  request: (signal: AbortSignal) => Promise<T>,
  callerSignal?: AbortSignal
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
      `Washington public-data request timed out after ${WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS} ms.`
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
  packageSource?: WashingtonReferencePackageSource;
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

export interface WashingtonCountyDetail {
  schemaVersion: string;
  generatedAt: string;
  county: string;
  countyCode: string;
  operationalState: {
    primarySourceMode: string;
    prometheusStatus: string;
  };
  summary: {
    records: number;
    latestSaleDate: string | null;
  };
  salesRoute: string;
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
  kind: 'detail' | 'sales-shard'
): boolean {
  if (!route) return true;
  const prefix =
    kind === 'detail' ? WASHINGTON_COUNTY_DETAIL_PATH_PREFIX : WASHINGTON_SALES_SHARD_PATH_PREFIX;
  return route === `${prefix}/${countyCode}.json`;
}

function isSyntheticWashingtonReferenceMarker(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'repository_reference_demo' || normalized === 'synthetic_reference';
}

function conferenceLocalPayloadIsTruthful(value: WashingtonCountyStatusPayloadEntry): boolean {
  return (
    value.primarySourceMode === WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE &&
    !isSyntheticWashingtonReferenceMarker(value.primarySourceMode) &&
    !isSyntheticWashingtonReferenceMarker(value.confidence.rawStatus) &&
    !isSyntheticWashingtonReferenceMarker(value.prometheusStatus)
  );
}

export function isConferenceLocalPackageEnabled(): boolean {
  return (
    String(getViteEnv().VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE ?? '').toLowerCase() === 'true'
  );
}

function defaultWashingtonCountyPackageSource(): WashingtonReferencePackageSource {
  return isConferenceLocalPackageEnabled() ? 'conference-local' : 'hosted';
}

async function fetchWashingtonPackageRoute(
  route: string,
  signal: AbortSignal | undefined,
  packageSource: WashingtonReferencePackageSource
): Promise<unknown> {
  if (packageSource === 'repository-reference') {
    return resolveWashingtonAssessorReferenceRoute(route);
  }

  // Both hosted and conference-local are same-origin relative routes. The
  // source flag changes trust semantics only; it never changes the URL origin.
  const response = await fetch(route, { cache: 'no-store', signal });
  if (!response.ok) {
    throw new Error(`Washington package route is unavailable (HTTP ${response.status}): ${route}`);
  }
  return response.json() as Promise<unknown>;
}

function isWashingtonCountyStatusPayloadEntry(
  value: unknown
): value is WashingtonCountyStatusPayloadEntry {
  if (!isRecord(value) || !isRecord(value.confidence) || !isRecord(value.staticRoutes)) {
    return false;
  }

  return (
    typeof value.county === 'string' &&
    value.county.trim().length > 0 &&
    typeof value.countyCode === 'string' &&
    /^\d{3}$/.test(value.countyCode) &&
    typeof value.priority === 'string' &&
    typeof value.prometheusStatus === 'string' &&
    typeof value.primarySourceMode === 'string' &&
    (value.latestSaleDate === null || typeof value.latestSaleDate === 'string') &&
    isFiniteNumber(value.candidateSales) &&
    isFiniteNumber(value.stagedSales) &&
    isFiniteNumber(value.needsReview) &&
    isFiniteNumber(value.confidence.averageQualityScore) &&
    typeof value.confidence.parserStatus === 'string' &&
    typeof value.confidence.rawStatus === 'string' &&
    typeof value.confidence.rawDriftDetected === 'boolean' &&
    typeof value.staticRoutes.detail === 'string' &&
    typeof value.staticRoutes.salesShard === 'string' &&
    isCanonicalCountyRoute(value.staticRoutes.detail, value.countyCode, 'detail') &&
    isCanonicalCountyRoute(value.staticRoutes.salesShard, value.countyCode, 'sales-shard')
  );
}

export async function fetchWashingtonCountyStatus(
  signal?: AbortSignal,
  packageSource: WashingtonReferencePackageSource = 'hosted'
): Promise<WashingtonCountyStatusEntry[]> {
  if (signal?.aborted) return [];
  const payload = await fetchWashingtonPackageRoute(
    WASHINGTON_COUNTY_STATUS_PATH,
    signal,
    packageSource
  );
  if (
    !isRecord(payload) ||
    payload.schemaVersion !== WASHINGTON_COUNTY_STATUS_SCHEMA ||
    typeof payload.generatedAt !== 'string' ||
    payload.generatedAt.trim().length === 0 ||
    typeof payload.sourcePosture !== 'string' ||
    payload.sourcePosture.trim().length === 0 ||
    !Array.isArray(payload.counties) ||
    !payload.counties.every(isWashingtonCountyStatusPayloadEntry) ||
    (packageSource === 'conference-local' &&
      payload.sourcePosture !== WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE) ||
    (packageSource === 'conference-local' &&
      !payload.counties.every(conferenceLocalPayloadIsTruthful))
  ) {
    throw new Error(
      packageSource === 'conference-local'
        ? 'Washington conference-local status must be a county-bounded, non-certified read-only package.'
        : 'Washington county status returned an invalid county registry.'
    );
  }

  const countyCodes = new Set(payload.counties.map((county) => county.countyCode));
  if (countyCodes.size !== payload.counties.length) {
    throw new Error('Washington county status returned duplicate county contexts.');
  }

  const statusCanonicalJsonSha256 = await computeWashingtonLaunchCanonicalJsonSha256(payload);

  return payload.counties.map((county) => ({
    ...county,
    packageSource,
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

export async function fetchWashingtonCountyDetail(
  county: WashingtonCountyStatusEntry,
  signal?: AbortSignal,
  packageSource: WashingtonReferencePackageSource = 'hosted'
): Promise<WashingtonCountyDetail> {
  const payload = await fetchWashingtonPackageRoute(
    county.staticRoutes.detail,
    signal,
    packageSource
  );
  if (
    !isRecord(payload) ||
    payload.schemaVersion !== WASHINGTON_COUNTY_DETAIL_SCHEMA ||
    typeof payload.generatedAt !== 'string' ||
    typeof payload.county !== 'string' ||
    typeof payload.countyCode !== 'string' ||
    !isRecord(payload.operationalState) ||
    typeof payload.operationalState.primarySourceMode !== 'string' ||
    typeof payload.operationalState.prometheusStatus !== 'string' ||
    !isRecord(payload.summary) ||
    !isFiniteNumber(payload.summary.records) ||
    (payload.summary.latestSaleDate !== null &&
      typeof payload.summary.latestSaleDate !== 'string') ||
    typeof payload.salesRoute !== 'string' ||
    payload.countyCode !== county.countyCode ||
    payload.county.trim().toLowerCase() !== county.county.trim().toLowerCase() ||
    !isCanonicalCountyRoute(payload.salesRoute, county.countyCode, 'sales-shard') ||
    (packageSource === 'conference-local' &&
      payload.operationalState.primarySourceMode !== WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE) ||
    (packageSource === 'conference-local' &&
      (isSyntheticWashingtonReferenceMarker(payload.operationalState.primarySourceMode) ||
        isSyntheticWashingtonReferenceMarker(payload.operationalState.prometheusStatus)))
  ) {
    throw new Error(`Washington county detail does not match county ${county.countyCode}.`);
  }

  return payload as unknown as WashingtonCountyDetail;
}

export async function verifyWashingtonCountySalesShard(
  county: WashingtonCountyStatusEntry,
  signal?: AbortSignal
): Promise<WashingtonCountyStatusEntry> {
  if (county.packageSource === 'conference-local') {
    return { ...county, salesShardVerification: 'not-required' };
  }
  const attempt = createWashingtonCountyShardVerificationAttempt(
    washingtonCountyShardVerificationAttempts.get(county.countyCode) ?? null
  );
  washingtonCountyShardVerificationAttempts.set(county.countyCode, attempt);
  const isCurrentAttempt = (): boolean =>
    washingtonCountyShardVerificationAttempts.get(county.countyCode) === attempt;
  const restoreNearestActivePreviousAttempt = (): void => {
    if (!isCurrentAttempt()) return;
    const previousAttempt = nearestActiveWashingtonCountyShardVerificationAttempt(attempt.previous);
    if (previousAttempt) {
      washingtonCountyShardVerificationAttempts.set(county.countyCode, previousAttempt);
      signalWashingtonCountyShardVerificationOwnershipChanged(previousAttempt);
    } else {
      washingtonCountyShardVerificationAttempts.delete(county.countyCode);
    }
  };
  try {
    let verification: WashingtonSalesReviewHostedShardVerification;
    try {
      verification = await runBoundedWashingtonPublicDataRequest(
        (boundedSignal) =>
          verifyWashingtonSalesReviewHostedShard(county, boundedSignal, isCurrentAttempt),
        signal
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
      let observedRevision = attempt.ownershipRevision;
      while (!isCurrentAttempt() && !attempt.permanentlySuperseded) {
        await waitForWashingtonCountyShardVerificationOwnershipChange(
          attempt,
          observedRevision,
          signal
        );
        observedRevision = attempt.ownershipRevision;
      }
      if (!isCurrentAttempt()) {
        return {
          ...county,
          salesShardVerification: 'unavailable',
        };
      }
      if (signal?.aborted) {
        restoreNearestActivePreviousAttempt();
        throw abortErrorForSignal(signal);
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
      signalAllActiveWashingtonCountyShardVerificationPredecessors(attempt.previous);
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
  requestedPackageSource?: WashingtonReferencePackageSource
): Promise<WashingtonCountyStatusResolution> {
  const packageSource = requestedPackageSource ?? defaultWashingtonCountyPackageSource();
  if (packageSource === 'conference-local') {
    try {
      const localCounties = await runBoundedWashingtonPublicDataRequest(
        (boundedSignal) => fetchWashingtonCountyStatus(boundedSignal, 'conference-local'),
        signal
      );
      return {
        counties: localCounties,
        packageSource: 'conference-local',
        usedRepositoryFallback: false,
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      const fallbackCounties = await fetchWashingtonCountyStatus(signal, 'repository-reference');
      return {
        counties: fallbackCounties,
        packageSource: 'repository-reference',
        usedRepositoryFallback: true,
      };
    }
  }

  try {
    const hostedCounties = await runBoundedWashingtonPublicDataRequest(
      (boundedSignal) => fetchWashingtonCountyStatus(boundedSignal, packageSource),
      signal
    );
    return {
      counties: hostedCounties,
      packageSource,
      usedRepositoryFallback: false,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    const fallbackCounties = await fetchWashingtonCountyStatus(signal, 'repository-reference');
    if (signal?.aborted) throw abortErrorForSignal(signal);
    return {
      counties: fallbackCounties,
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    };
  }
}
