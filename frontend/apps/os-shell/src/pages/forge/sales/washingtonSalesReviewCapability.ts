/**
 * Forge-owned launch contract for the Washington public sales-review package.
 *
 * The OS shell may present this result and navigate to SalesForge, but it does
 * not interpret staged-sales or shard-route fields as suite capability rules.
 */

import {
  WASHINGTON_REFERENCE_ROUTES,
  type WashingtonReferencePackageSource,
} from '@/lib/washingtonAssessorReferencePackage';
import { getWashingtonPublicSourceInventory } from '@/lib/washingtonPublicSourceInventory';
import { getViteEnv } from '@/env/getViteEnv';
import {
  evictWashingtonLaunchCountyShard,
  isWashingtonLaunchDataEnabled,
  validateAndCacheAttestedWashingtonLaunchCountyShard,
  WASHINGTON_LAUNCH_MANIFEST_SCHEMA,
  WASHINGTON_COUNTIES,
  type WashingtonLaunchSalesShardAttestation,
} from './washingtonLaunchApi';

export type WashingtonSalesReviewShardVerificationState =
  | 'not-required'
  | 'unverified'
  | 'verified'
  | 'unavailable';

export interface WashingtonSalesReviewCapabilityInput {
  county: string;
  countyCode: string;
  packageIdentity: {
    statusSchemaVersion: string;
    statusCanonicalJsonSha256: string | null;
    generatedAt: string;
    sourcePosture: string;
  };
  primarySourceMode: string;
  prometheusStatus: string;
  latestSaleDate: string | null;
  stagedSales: number;
  needsReview: number;
  salesShardVerification: WashingtonSalesReviewShardVerificationState;
  confidence: {
    rawStatus: string;
    rawDriftDetected: boolean;
  };
  staticRoutes: {
    salesShard: string;
  };
}

export type WashingtonSalesReviewCapabilityStatus =
  | 'available'
  | 'county-context-invalid'
  | 'reference-demo-only'
  | 'source-posture-unavailable'
  | 'no-staged-sales'
  | 'sales-shard-verification-required'
  | 'sales-shard-unavailable';

export interface WashingtonSalesReviewCapability {
  eligible: boolean;
  status: WashingtonSalesReviewCapabilityStatus;
  statusLabel: string;
  unavailableMessage: string | null;
  referenceData: WashingtonSalesReviewReferenceData;
}

export interface WashingtonSalesReviewObservedReference {
  recordCount: number;
  latestSaleDate: string | null;
  needsReview: number;
  runtimePosture: string;
  sourceStatus: string;
  sourceDriftDetected: boolean;
}

export interface WashingtonSalesReviewReferenceData {
  posture: string;
  isSyntheticReference: boolean;
  observed: WashingtonSalesReviewObservedReference | null;
}

export type WashingtonSalesReviewHostedShardVerification =
  | { state: 'not-required' }
  | {
      state: 'verified';
      stagedSales: number;
      latestSaleDate: string | null;
      needsReview: number;
    }
  | { state: 'unavailable' };

export type WashingtonSalesReviewAvailability = 'available' | 'unavailable';

export interface WashingtonCountiesHubHandoff {
  countyCode: string;
  countyName: string;
  resetValuationScope: true;
  launchContext: 'washington-counties-hub';
  dataTrustTier: 'public-reference-not-county-certified';
  referencePackageSource: WashingtonReferencePackageSource;
  referenceDataPosture: string;
  referenceRecordCount: number | null;
  latestReferenceSaleDate: string | null;
  salesReviewAvailability: WashingtonSalesReviewAvailability;
  salesReviewUnavailableMessage: string | null;
}

const REPOSITORY_REFERENCE_DEMO_POSTURE = 'repository_reference_demo';
const SYNTHETIC_REFERENCE_RECORD_TYPE = 'synthetic_reference';

function normalizeReferenceDataPosture(value: string): string {
  return value.trim().toLowerCase();
}

function isRepositoryReferenceDemoPosture(value: string): boolean {
  return normalizeReferenceDataPosture(value) === REPOSITORY_REFERENCE_DEMO_POSTURE;
}

function isUnavailableReferenceDataPosture(value: string): boolean {
  const normalizedPosture = normalizeReferenceDataPosture(value);
  return normalizedPosture.length === 0 || normalizedPosture === 'unavailable';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSyntheticReferenceMarker(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalizedValue = normalizeReferenceDataPosture(value);
  return normalizedValue === REPOSITORY_REFERENCE_DEMO_POSTURE
    || normalizedValue === SYNTHETIC_REFERENCE_RECORD_TYPE;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSha256Digest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{64}$/.test(value);
}

function readSha256DigestArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const digests: string[] = [];
  for (const digest of value) {
    if (!isSha256Digest(digest)) return null;
    digests.push(digest);
  }
  return digests;
}

function readPinnedHostedManifestSha256(): string | null {
  const value = String(
    getViteEnv().VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256 ?? '',
  ).trim().toLowerCase();
  return isSha256Digest(value) ? value : null;
}

function parseTrustedHttpsUrl(value: unknown): URL | null {
  if (!isNonEmptyString(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname.length > 0
      && url.username.length === 0
      && url.password.length === 0
      && (url.port === '' || url.port === '443')
      ? url
      : null;
  } catch {
    return null;
  }
}

function isOfficialCountySourceUrl(value: unknown, officialSourceBaseUrl: string): boolean {
  const sourceUrl = parseTrustedHttpsUrl(value);
  const officialUrl = parseTrustedHttpsUrl(officialSourceBaseUrl);
  if (!sourceUrl || !officialUrl) return false;

  const officialHostname = officialUrl.hostname.toLowerCase().replace(/^www\./, '');
  const sourceHostname = sourceUrl.hostname.toLowerCase().replace(/^www\./, '');
  return sourceHostname === officialHostname
    || sourceHostname.endsWith(`.${officialHostname}`);
}

function hasAffirmativePublicSourceProvenance(
  record: Record<string, unknown>,
  officialSourceBaseUrl: string,
): boolean {
  if (!isRecord(record.provenance)) return false;
  const provenance = record.provenance;
  const sourceUrlIsOfficial = isOfficialCountySourceUrl(
    provenance.sourceUrl,
    officialSourceBaseUrl,
  );
  const sourceFinalUrlIsOfficial = isOfficialCountySourceUrl(
    provenance.sourceFinalUrl,
    officialSourceBaseUrl,
  );

  return isNonEmptyString(record.candidateSource)
    && (sourceUrlIsOfficial || sourceFinalUrlIsOfficial)
    && (provenance.sourceUrl === null || sourceUrlIsOfficial)
    && (provenance.sourceFinalUrl === null || sourceFinalUrlIsOfficial)
    && isNonEmptyString(provenance.sourcePayloadPath)
    && isSha256Digest(provenance.sourcePayloadSha256)
    && isNonEmptyString(provenance.candidateIndexSource)
    && isNonEmptyString(provenance.candidateRecordType);
}

function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Washington launch integrity input is not JSON-compatible.');
}

/**
 * Compute the canonical package digest used by the hosted manifest. There is
 * deliberately no non-cryptographic fallback: without Web Crypto, hosted
 * public records remain unavailable rather than being weakly attested.
 */
export async function computeWashingtonLaunchCanonicalJsonSha256(
  value: unknown,
): Promise<string | null> {
  if (
    typeof TextEncoder === 'undefined'
    || typeof globalThis.crypto?.subtle?.digest !== 'function'
  ) {
    return null;
  }

  try {
    const encoded = new TextEncoder().encode(canonicalizeJson(value));
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function getHostedSalesShardAttestation(
  manifest: unknown,
  input: WashingtonSalesReviewCapabilityInput,
): WashingtonLaunchSalesShardAttestation | null {
  const officialSource = getWashingtonPublicSourceInventory(input.county);
  if (
    !officialSource
    || !isRecord(manifest)
    || manifest.schemaVersion !== WASHINGTON_LAUNCH_MANIFEST_SCHEMA
    || manifest.statusSchemaVersion !== input.packageIdentity.statusSchemaVersion
    || !isSha256Digest(manifest.statusCanonicalJsonSha256)
    || manifest.statusCanonicalJsonSha256
      !== input.packageIdentity.statusCanonicalJsonSha256
    || manifest.generatedAt !== input.packageIdentity.generatedAt
    || normalizeReferenceDataPosture(String(manifest.sourcePosture ?? ''))
      !== normalizeReferenceDataPosture(input.packageIdentity.sourcePosture)
    || !Array.isArray(manifest.salesShardAttestations)
  ) {
    return null;
  }

  const matchingAttestations = manifest.salesShardAttestations.filter((value) =>
    isRecord(value) && value.countyCode === input.countyCode,
  );
  if (matchingAttestations.length !== 1) return null;
  const attestation = matchingAttestations[0];
  if (!isRecord(attestation)) return null;
  const sourcePayloadSha256 = readSha256DigestArray(attestation.sourcePayloadSha256);

  const officialSourceOrigin = parseTrustedHttpsUrl(
    officialSource.officialAssessorBaseUrl,
  )?.origin;
  const attestedSourceOrigin = parseTrustedHttpsUrl(
    attestation.officialSourceBaseUrl,
  )?.origin;
  const attestedCountyName = typeof attestation.county === 'string'
    ? attestation.county.replace(/\s+county$/i, '').trim().toLowerCase()
    : '';
  const expectedCountyName = input.county.replace(/\s+county$/i, '').trim().toLowerCase();

  if (
    attestation.algorithm !== 'SHA-256'
    || !isSha256Digest(attestation.canonicalJsonSha256)
    || !sourcePayloadSha256
    || attestedCountyName !== expectedCountyName
    || attestation.route !== input.staticRoutes.salesShard
    || normalizeReferenceDataPosture(String(attestation.sourcePosture ?? ''))
      !== normalizeReferenceDataPosture(input.primarySourceMode)
    || !officialSourceOrigin
    || attestedSourceOrigin !== officialSourceOrigin
  ) {
    return null;
  }

  return {
    algorithm: 'SHA-256',
    canonicalJsonSha256: attestation.canonicalJsonSha256,
    county: input.county,
    countyCode: input.countyCode,
    officialSourceBaseUrl: officialSource.officialAssessorBaseUrl,
    route: input.staticRoutes.salesShard,
    sourcePayloadSha256,
    sourcePosture: input.primarySourceMode,
  };
}

/**
 * A hosted status document cannot relabel synthetic records as observed public
 * data. Require every record's source mode to support the county posture,
 * affirmative public-source evidence, and no explicit synthetic marker before
 * the shard enters the SalesForge cache.
 *
 * Shape errors remain the launch API validator's responsibility. Returning
 * true for a non-shard shape lets that validator provide the canonical
 * fail-closed result without duplicating its complete schema here.
 */
function shardRecordProvenanceSupportsPosture(
  value: unknown,
  expectedPosture: string,
  officialSourceBaseUrl: string,
  attestedSourcePayloadDigests: ReadonlySet<string>,
): boolean {
  if (!isRecord(value) || !Array.isArray(value.records)) return true;
  const normalizedExpectedPosture = normalizeReferenceDataPosture(expectedPosture);

  return value.records.every((record) => {
    if (!isRecord(record)) return true;
    const normalizedSourceMode = typeof record.sourceMode === 'string'
      ? normalizeReferenceDataPosture(record.sourceMode)
      : '';
    const candidateRecordType = isRecord(record.provenance)
      ? record.provenance.candidateRecordType
      : null;

    return normalizedSourceMode === normalizedExpectedPosture
      && hasAffirmativePublicSourceProvenance(record, officialSourceBaseUrl)
      && isRecord(record.provenance)
      && typeof record.provenance.sourcePayloadSha256 === 'string'
      && attestedSourcePayloadDigests.has(record.provenance.sourcePayloadSha256)
      && !isSyntheticReferenceMarker(record.sourceMode)
      && !isSyntheticReferenceMarker(record.candidateSource)
      && !isSyntheticReferenceMarker(candidateRecordType);
  });
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null
    || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/**
 * Validate the shell-to-Forge county-context handoff before any suite uses it.
 * This is navigation context only; it never substitutes for authenticated
 * county authority on protected TerraFusion APIs.
 */
export function parseWashingtonCountiesHubHandoff(
  metadata: Record<string, unknown> | undefined,
): WashingtonCountiesHubHandoff | null {
  if (
    !metadata
    || metadata.launchContext !== 'washington-counties-hub'
    || metadata.dataTrustTier !== 'public-reference-not-county-certified'
    || typeof metadata.countyCode !== 'string'
    || typeof metadata.countyName !== 'string'
    || metadata.resetValuationScope !== true
    || (
      metadata.referencePackageSource !== 'hosted'
      && metadata.referencePackageSource !== 'repository-reference'
    )
    || typeof metadata.referenceDataPosture !== 'string'
    || !(
      metadata.referenceRecordCount === undefined
      || isNullableFiniteNumber(metadata.referenceRecordCount)
    )
    || !(
      metadata.latestReferenceSaleDate === undefined
      || isNullableString(metadata.latestReferenceSaleDate)
    )
    || (
      metadata.salesReviewAvailability !== undefined
      && metadata.salesReviewAvailability !== 'available'
      && metadata.salesReviewAvailability !== 'unavailable'
    )
    || !(
      metadata.salesReviewUnavailableMessage === undefined
      || isNullableString(metadata.salesReviewUnavailableMessage)
    )
  ) {
    return null;
  }

  const countyName = metadata.countyName.replace(/\s+county$/i, '').trim();
  const registeredCounty = WASHINGTON_COUNTIES.find(
    (county) => county.code === metadata.countyCode
      && county.name.toLowerCase() === countyName.toLowerCase(),
  );
  if (!registeredCounty) return null;

  const referenceRecordCount = typeof metadata.referenceRecordCount === 'number'
    ? metadata.referenceRecordCount
    : null;
  const latestReferenceSaleDate = typeof metadata.latestReferenceSaleDate === 'string'
    ? metadata.latestReferenceSaleDate
    : null;
  const salesReviewAvailability = metadata.salesReviewAvailability === 'available'
    ? 'available'
    : 'unavailable';
  const salesReviewUnavailableMessage = typeof metadata.salesReviewUnavailableMessage === 'string'
    ? metadata.salesReviewUnavailableMessage
    : null;

  if (
    salesReviewAvailability === 'available'
    && (
      referenceRecordCount === null
      || referenceRecordCount <= 0
      || isUnavailableReferenceDataPosture(metadata.referenceDataPosture)
      || isRepositoryReferenceDemoPosture(metadata.referenceDataPosture)
    )
  ) {
    return null;
  }

  return {
    countyCode: registeredCounty.code,
    countyName: registeredCounty.name,
    resetValuationScope: true,
    launchContext: 'washington-counties-hub',
    dataTrustTier: 'public-reference-not-county-certified',
    referencePackageSource: metadata.referencePackageSource,
    referenceDataPosture: metadata.referenceDataPosture,
    referenceRecordCount,
    latestReferenceSaleDate,
    salesReviewAvailability,
    salesReviewUnavailableMessage,
  };
}

export function getWashingtonSalesReviewCapability(
  input: WashingtonSalesReviewCapabilityInput,
): WashingtonSalesReviewCapability {
  const observedName = input.county.replace(/\s+county$/i, '').trim().toLowerCase();
  const registeredCounty = WASHINGTON_COUNTIES.some(
    (county) => county.code === input.countyCode && county.name.toLowerCase() === observedName,
  );
  const normalizedPosture = normalizeReferenceDataPosture(input.primarySourceMode);
  const isSyntheticReference = isRepositoryReferenceDemoPosture(input.primarySourceMode);
  const isSourcePostureUnavailable = isUnavailableReferenceDataPosture(input.primarySourceMode);
  // Only a parsed county shard can support observed public-sales claims.
  // `not-required` is reserved for postures where sales are already
  // inapplicable (for example, the synthetic repository reference package).
  const salesClaimsHaveShardEvidence = input.salesShardVerification === 'verified';
  const referenceData: WashingtonSalesReviewReferenceData = {
    posture: normalizedPosture || 'unavailable',
    isSyntheticReference,
    observed: registeredCounty
      && !isSyntheticReference
      && !isSourcePostureUnavailable
      && salesClaimsHaveShardEvidence
      && Boolean(input.staticRoutes.salesShard.trim())
      ? {
          recordCount: input.stagedSales,
          latestSaleDate: input.latestSaleDate,
          needsReview: input.needsReview,
          runtimePosture: input.prometheusStatus,
          sourceStatus: input.confidence.rawStatus,
          sourceDriftDetected: input.confidence.rawDriftDetected,
        }
      : null,
  };

  if (!registeredCounty) {
    return {
      eligible: false,
      status: 'county-context-invalid',
      statusLabel: 'Registry mismatch',
      unavailableMessage:
        'The observed county name and code do not match the Washington registry. '
        + 'Sales review remains unavailable instead of guessing a county context.',
      referenceData,
    };
  }

  if (isSyntheticReference) {
    return {
      eligible: false,
      status: 'reference-demo-only',
      statusLabel: 'Reference demo only',
      unavailableMessage:
        'Only invented repository reference records are available for this county. '
        + 'They remain visible as test evidence but cannot enable an assessor sales workflow.',
      referenceData,
    };
  }

  if (isSourcePostureUnavailable) {
    return {
      eligible: false,
      status: 'source-posture-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed source posture is unavailable for this county. '
        + 'Sales review remains unavailable instead of inferring public-data trust.',
      referenceData,
    };
  }

  if (
    !input.staticRoutes.salesShard.trim()
    || input.salesShardVerification === 'unavailable'
  ) {
    return {
      eligible: false,
      status: 'sales-shard-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed TerraForge sales package is unavailable for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
      referenceData,
    };
  }

  if (input.salesShardVerification !== 'verified') {
    return {
      eligible: false,
      status: 'sales-shard-verification-required',
      statusLabel: 'Verification required',
      unavailableMessage:
        'The linked public sales package must be validated for this county. '
        + 'Select the county and Counties HUB will verify it without loading other counties.',
      referenceData,
    };
  }

  if (input.stagedSales <= 0) {
    return {
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
      unavailableMessage:
        'No governed staged sales are available for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
      referenceData,
    };
  }

  return {
    eligible: true,
    status: 'available',
    statusLabel: 'Sales review available',
    unavailableMessage: null,
    referenceData,
  };
}

/**
 * Verify the selected hosted shard before exposing any observed sales claim.
 * The build-pinned same-origin manifest must bind the complete status document,
 * canonical shard digest, source-payload digests, and repository-packaged
 * official county source. A successful HTTP status is insufficient because the
 * OS web server may return its HTML fallback for a missing JSON path; the
 * response body must also pass the same county-isolated schema used when
 * SalesForge loads it.
 */
export async function verifyWashingtonSalesReviewHostedShard(
  input: WashingtonSalesReviewCapabilityInput,
  signal?: AbortSignal,
): Promise<WashingtonSalesReviewHostedShardVerification> {
  const evictHostedShard = (): void => {
    evictWashingtonLaunchCountyShard(input.countyCode, 'hosted');
  };
  const unavailable = (): WashingtonSalesReviewHostedShardVerification => {
    evictHostedShard();
    return { state: 'unavailable' };
  };
  const verificationCandidate = getWashingtonSalesReviewCapability({
    ...input,
    salesShardVerification: 'unverified',
  });
  if (verificationCandidate.status !== 'sales-shard-verification-required') {
    // A removed route or downgraded posture is fresh evidence that a
    // previously verified hosted body must no longer be served.
    evictHostedShard();
    return { state: 'not-required' };
  }

  try {
    const manifestResponse = await fetch(WASHINGTON_REFERENCE_ROUTES.manifest, {
      cache: 'no-store',
      signal,
    });
    if (!manifestResponse.ok) return unavailable();
    const manifest = await manifestResponse.json() as unknown;
    const pinnedManifestDigest = readPinnedHostedManifestSha256();
    const observedManifestDigest = await computeWashingtonLaunchCanonicalJsonSha256(manifest);
    if (
      !pinnedManifestDigest
      || observedManifestDigest !== pinnedManifestDigest
    ) {
      return unavailable();
    }
    const attestation = getHostedSalesShardAttestation(manifest, input);
    if (!attestation) return unavailable();

    const response = await fetch(input.staticRoutes.salesShard, {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) return unavailable();

    const payload = await response.json() as unknown;
    const shardDigest = await computeWashingtonLaunchCanonicalJsonSha256(payload);
    if (
      shardDigest !== attestation.canonicalJsonSha256
      || !shardRecordProvenanceSupportsPosture(
        payload,
        input.primarySourceMode,
        attestation.officialSourceBaseUrl,
        new Set(attestation.sourcePayloadSha256),
      )
    ) {
      return unavailable();
    }
    const summary = validateAndCacheAttestedWashingtonLaunchCountyShard(
      payload,
      input.countyCode,
      'hosted',
    );
    return { state: 'verified', ...summary };
  } catch (error) {
    if (signal?.aborted) throw error;
    return unavailable();
  }
}

export function isWashingtonSalesReviewLaunchEnabled(options?: {
  explicitReferenceHandoff?: boolean;
}): boolean {
  return options?.explicitReferenceHandoff === true || isWashingtonLaunchDataEnabled();
}
