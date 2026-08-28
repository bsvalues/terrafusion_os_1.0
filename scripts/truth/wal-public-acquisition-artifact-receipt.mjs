/**
 * WO-WAL-001B - deterministic in-memory public acquisition artifact receipts.
 *
 * This module hashes only bytes explicitly supplied by its caller. It performs
 * no I/O and does not interpret a receipt as landing, runtime, freshness, or
 * capability evidence.
 */

import { createHash } from 'node:crypto';

export const CONTRACT_ID = 'wal.public-acquisition-artifact-receipt.v1';
export const BASELINE_CONTRACT_ID = 'wal.public-baseline-ledger.v1';
export const ENVIRONMENT_ID = 'local-memory-artifact-fixture-only';
export const MAX_ARTIFACT_BYTES = 16 * 1024 * 1024;

export const EXPECTED_COUNTIES = Object.freeze([
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
]);

const ARTIFACT_KINDS = Object.freeze(['parcels', 'sales']);
const BASELINE_TOP_LEVEL_KEYS = Object.freeze([
  'assertions',
  'contract',
  'evidenceScope',
  'rows',
  'sourceEvidence',
  'summary',
]);
const SOURCE_EVIDENCE_KEYS = Object.freeze([
  'generatedAtUtc',
  'slice',
  'status',
  'supplementalResearchAtUtc',
  'workbook',
  'workbookSha256',
]);
const BASELINE_ASSERTION_KEYS = Object.freeze([
  'deterministicCanonicalOrder',
  'exactCanonicalCountySet',
  'exactlyOneRowPerCounty',
  'noBentonFallbackMaterialized',
  'registryReadinessDoesNotImplyLandedRows',
  'registryReadinessDoesNotImplyRuntimeRegistration',
]);
const BASELINE_SUMMARY_KEYS = Object.freeze([
  'capabilityAssessedCountyCount',
  'countyRowCount',
  'expectedCountyCount',
  'freshnessProvenanceObservedCountyCount',
  'landedRowsObservedCountyCount',
  'registryStatusCounts',
  'runtimeRegistrationObservedCountyCount',
  'sourceInventoryGapCount',
]);
const BASELINE_ROW_KEYS = Object.freeze([
  'acquisitionReadiness',
  'capabilityEvidence',
  'county',
  'countyToken',
  'explicitGaps',
  'fallbackEvidence',
  'freshnessProvenanceEvidence',
  'landedRowsEvidence',
  'runtimeRegistrationEvidence',
  'sourceInventory',
]);
const SOURCE_INVENTORY_KEYS = Object.freeze([
  'alternatePublicSourceDescription',
  'gisMapSurfaceDescription',
  'observationStatus',
  'officialAssessorBaseUrl',
  'primarySalesSourceDescription',
]);
const ACQUISITION_READINESS_KEYS = Object.freeze([
  'acquisitionFamily',
  'adapterExecutionStatus',
  'observationStatus',
  'priority',
  'registryStatus',
  'registryStatusMeaning',
]);
const LANDED_EVIDENCE_KEYS = Object.freeze([
  'observationStatus',
  'parcelRows',
  'quarantinedRows',
  'salesRows',
]);
const RUNTIME_EVIDENCE_KEYS = Object.freeze([
  'observationStatus',
  'parcels',
  'sales',
  'selectedCountyEchoed',
]);
const RUNTIME_DATASET_KEYS = Object.freeze(['endpoint', 'registrationStatus', 'rows']);
const FRESHNESS_EVIDENCE_KEYS = Object.freeze([
  'acquiredAtUtc',
  'contentHash',
  'observationStatus',
  'sourceRevision',
  'transformVersion',
  'trustTier',
]);
const FALLBACK_EVIDENCE_KEYS = Object.freeze([
  'fallbackCounty',
  'observationStatus',
  'silentBentonFallbackDetected',
]);
const CAPABILITY_EVIDENCE_KEYS = Object.freeze([
  'observationStatus',
  'supportedCapabilities',
]);
const EXPLICIT_GAP_KEYS = Object.freeze([
  'acquisition',
  'freshnessProvenance',
  'landedData',
  'runtime',
  'sourceInventory',
]);
const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const TYPED_ARRAY_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  'byteLength'
).get;
const MAX_SNAPSHOT_DEPTH = 12;
const MAX_SNAPSHOT_NODES = 512;
const MAX_STRING_CHARACTERS = 8192;

function countyToken(county) {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function assertPlainRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be an own-property-only plain object.`);
  }
}

function assertExactOwnDataKeys(value, expectedKeys, label) {
  assertPlainRecord(value, label);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some(key => typeof key !== 'string')) {
    throw new TypeError(`${label} must not contain symbol properties.`);
  }

  const actualKeys = ownKeys.sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new TypeError(`${label} must contain exactly: ${sortedExpectedKeys.join(', ')}.`);
  }

  for (const key of actualKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable data property.`);
    }
  }
}

function assertDensePlainArray(value, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array.`);
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label} must contain dense enumerable data elements.`);
    }
  }
  const expectedKeys = new Set(['length']);
  for (let index = 0; index < value.length; index += 1) expectedKeys.add(String(index));
  const unexpectedKeys = Reflect.ownKeys(value).filter(key => !expectedKeys.has(key));
  if (unexpectedKeys.length) {
    throw new TypeError(`${label} must not contain custom properties.`);
  }
}

function assertExactStringArray(value, expected, label) {
  assertDensePlainArray(value, label);
  if (
    value.length !== expected.length ||
    value.some((entry, index) => entry !== expected[index])
  ) {
    throw new Error(`${label} must contain the canonical protected baseline values.`);
  }
}

function assertNullableBoundedString(value, label) {
  if (value === null) return;
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_STRING_CHARACTERS ||
    value !== value.trim()
  ) {
    throw new TypeError(`${label} must be null or a bounded non-empty string.`);
  }
}

function snapshotJsonValue(
  value,
  label,
  ancestors = new WeakSet(),
  budget = { nodes: 0 },
  depth = 0
) {
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_CHARACTERS) {
      throw new TypeError(`${label} exceeds the bounded string limit.`);
    }
    return value;
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (!value || typeof value !== 'object') {
    throw new TypeError(`${label} must contain only finite JSON data.`);
  }
  if (ancestors.has(value)) throw new TypeError(`${label} must not contain cycles.`);
  if (depth >= MAX_SNAPSHOT_DEPTH || ++budget.nodes > MAX_SNAPSHOT_NODES) {
    throw new TypeError(`${label} exceeds the bounded snapshot structure.`);
  }
  ancestors.add(value);

  let snapshot;
  if (Array.isArray(value)) {
    assertDensePlainArray(value, label);
    snapshot = value.map((entry, index) =>
      snapshotJsonValue(entry, `${label}[${index}]`, ancestors, budget, depth + 1)
    );
  } else {
    assertPlainRecord(value, label);
    snapshot = {};
    const keys = Reflect.ownKeys(value);
    if (keys.some(key => typeof key !== 'string')) {
      throw new TypeError(`${label} must not contain symbol properties.`);
    }
    keys.sort();
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
        throw new TypeError(`${label}.${key} must be an enumerable data property.`);
      }
      Object.defineProperty(snapshot, key, {
        value: snapshotJsonValue(
          descriptor.value,
          `${label}.${key}`,
          ancestors,
          budget,
          depth + 1
        ),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
  }

  ancestors.delete(value);
  return snapshot;
}

function containsBentonReference(value) {
  if (typeof value === 'string') {
    const compact = value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    return compact.includes('benton');
  }
  if (Array.isArray(value)) return value.some(containsBentonReference);
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsBentonReference);
  }
  return false;
}

function validateBaselineRow(row, county, index) {
  const label = `baselineLedger.rows[${index}]`;
  assertExactOwnDataKeys(row, BASELINE_ROW_KEYS, label);
  if (row.county !== county || row.countyToken !== countyToken(county)) {
    throw new Error(`${label} must be canonical county ${county}.`);
  }

  assertExactOwnDataKeys(row.sourceInventory, SOURCE_INVENTORY_KEYS, `${label}.sourceInventory`);
  if (row.sourceInventory.observationStatus !== 'observed_from_coverage_proof') {
    throw new Error(`${label}.sourceInventory has a non-canonical observation state.`);
  }
  for (const field of SOURCE_INVENTORY_KEYS.filter(field => field !== 'observationStatus')) {
    assertNullableBoundedString(row.sourceInventory[field], `${label}.sourceInventory.${field}`);
  }

  assertExactOwnDataKeys(
    row.acquisitionReadiness,
    ACQUISITION_READINESS_KEYS,
    `${label}.acquisitionReadiness`
  );
  if (
    row.acquisitionReadiness.observationStatus !== 'observed_from_coverage_proof' ||
    row.acquisitionReadiness.registryStatusMeaning !== 'source_decision_only' ||
    row.acquisitionReadiness.adapterExecutionStatus !== 'not_observed'
  ) {
    throw new Error(`${label}.acquisitionReadiness has non-canonical protected state.`);
  }
  for (const field of ['registryStatus', 'acquisitionFamily', 'priority']) {
    assertNullableBoundedString(row.acquisitionReadiness[field], `${label}.acquisitionReadiness.${field}`);
  }
  if (row.acquisitionReadiness.registryStatus === null) {
    throw new Error(`${label}.acquisitionReadiness.registryStatus must be present.`);
  }

  assertExactOwnDataKeys(row.landedRowsEvidence, LANDED_EVIDENCE_KEYS, `${label}.landedRowsEvidence`);
  if (
    row.landedRowsEvidence.observationStatus !== 'not_observed' ||
    row.landedRowsEvidence.parcelRows !== null ||
    row.landedRowsEvidence.salesRows !== null ||
    row.landedRowsEvidence.quarantinedRows !== null
  ) {
    throw new Error(`${label}.landedRowsEvidence must remain entirely unobserved.`);
  }

  assertExactOwnDataKeys(
    row.runtimeRegistrationEvidence,
    RUNTIME_EVIDENCE_KEYS,
    `${label}.runtimeRegistrationEvidence`
  );
  if (
    row.runtimeRegistrationEvidence.observationStatus !== 'not_observed' ||
    row.runtimeRegistrationEvidence.selectedCountyEchoed !== null
  ) {
    throw new Error(`${label} has non-canonical runtime evidence; it must remain entirely unobserved.`);
  }
  for (const dataset of ['parcels', 'sales']) {
    const value = row.runtimeRegistrationEvidence[dataset];
    assertExactOwnDataKeys(value, RUNTIME_DATASET_KEYS, `${label}.runtimeRegistrationEvidence.${dataset}`);
    if (value.registrationStatus !== 'not_observed' || value.endpoint !== null || value.rows !== null) {
      throw new Error(`${label}.runtimeRegistrationEvidence.${dataset} must remain unobserved.`);
    }
  }

  assertExactOwnDataKeys(
    row.freshnessProvenanceEvidence,
    FRESHNESS_EVIDENCE_KEYS,
    `${label}.freshnessProvenanceEvidence`
  );
  if (
    row.freshnessProvenanceEvidence.observationStatus !== 'not_observed' ||
    FRESHNESS_EVIDENCE_KEYS.some(
      field => field !== 'observationStatus' && row.freshnessProvenanceEvidence[field] !== null
    )
  ) {
    throw new Error(`${label}.freshnessProvenanceEvidence must remain entirely unobserved.`);
  }

  assertExactOwnDataKeys(row.fallbackEvidence, FALLBACK_EVIDENCE_KEYS, `${label}.fallbackEvidence`);
  if (
    row.fallbackEvidence.observationStatus !== 'not_observed' ||
    row.fallbackEvidence.silentBentonFallbackDetected !== null ||
    row.fallbackEvidence.fallbackCounty !== null
  ) {
    throw new Error(`${label}.fallbackEvidence must remain entirely unobserved.`);
  }

  assertExactOwnDataKeys(
    row.capabilityEvidence,
    CAPABILITY_EVIDENCE_KEYS,
    `${label}.capabilityEvidence`
  );
  if (row.capabilityEvidence.observationStatus !== 'not_assessed') {
    throw new Error(`${label}.capabilityEvidence must remain unassessed.`);
  }
  assertExactStringArray(
    row.capabilityEvidence.supportedCapabilities,
    [],
    `${label}.capabilityEvidence.supportedCapabilities`
  );

  assertExactOwnDataKeys(row.explicitGaps, EXPLICIT_GAP_KEYS, `${label}.explicitGaps`);
  const expectedSourceInventoryGaps = [];
  if (row.sourceInventory.officialAssessorBaseUrl === null) {
    expectedSourceInventoryGaps.push('official_assessor_url_missing');
  }
  if (row.sourceInventory.primarySalesSourceDescription === null) {
    expectedSourceInventoryGaps.push('primary_sales_source_missing');
  }
  if (row.acquisitionReadiness.acquisitionFamily === null) {
    expectedSourceInventoryGaps.push('acquisition_family_missing');
  }
  const expectedAcquisitionGaps =
    row.acquisitionReadiness.registryStatus === 'adapter-ready'
      ? []
      : ['acquisition_not_adapter_ready_in_registry'];
  assertExactStringArray(row.explicitGaps.sourceInventory, expectedSourceInventoryGaps, `${label}.explicitGaps.sourceInventory`);
  assertExactStringArray(row.explicitGaps.acquisition, expectedAcquisitionGaps, `${label}.explicitGaps.acquisition`);
  assertExactStringArray(row.explicitGaps.landedData, ['parcel_rows_not_observed', 'sales_rows_not_observed'], `${label}.explicitGaps.landedData`);
  assertExactStringArray(row.explicitGaps.runtime, ['parcel_runtime_registration_not_observed', 'sales_runtime_registration_not_observed'], `${label}.explicitGaps.runtime`);
  assertExactStringArray(row.explicitGaps.freshnessProvenance, ['acquisition_freshness_not_observed', 'row_provenance_not_observed', 'transform_version_not_observed'], `${label}.explicitGaps.freshnessProvenance`);

  if (county !== 'Benton' && containsBentonReference(row)) {
    throw new Error(`Non-Benton baseline row ${county} contains Benton source metadata.`);
  }
}

function validateAndSnapshotBaseline(baselineLedger, selectedCounty) {
  assertExactOwnDataKeys(baselineLedger, BASELINE_TOP_LEVEL_KEYS, 'baselineLedger');
  if (baselineLedger.contract !== BASELINE_CONTRACT_ID) {
    throw new Error(`baselineLedger.contract must be ${BASELINE_CONTRACT_ID}.`);
  }
  if (baselineLedger.evidenceScope !== 'source_registry_only') {
    throw new Error('baselineLedger.evidenceScope must be source_registry_only.');
  }
  assertExactOwnDataKeys(
    baselineLedger.sourceEvidence,
    SOURCE_EVIDENCE_KEYS,
    'baselineLedger.sourceEvidence'
  );
  for (const field of SOURCE_EVIDENCE_KEYS) {
    assertNullableBoundedString(
      baselineLedger.sourceEvidence[field],
      `baselineLedger.sourceEvidence.${field}`
    );
  }
  assertExactOwnDataKeys(
    baselineLedger.assertions,
    BASELINE_ASSERTION_KEYS,
    'baselineLedger.assertions'
  );
  for (const field of BASELINE_ASSERTION_KEYS) {
    if (baselineLedger.assertions[field] !== true) {
      throw new Error(`baselineLedger.assertions.${field} must be true.`);
    }
  }
  assertDensePlainArray(baselineLedger.rows, 'baselineLedger.rows');
  if (baselineLedger.rows.length !== EXPECTED_COUNTIES.length) {
    throw new Error(`baselineLedger must contain exactly ${EXPECTED_COUNTIES.length} county rows.`);
  }

  let selectedRow;
  const registryStatusCounts = new Map();
  let sourceInventoryGapCount = 0;
  baselineLedger.rows.forEach((row, index) => {
    const county = EXPECTED_COUNTIES[index];
    validateBaselineRow(row, county, index);
    const registryStatus = row.acquisitionReadiness.registryStatus;
    registryStatusCounts.set(registryStatus, (registryStatusCounts.get(registryStatus) ?? 0) + 1);
    if (row.explicitGaps.sourceInventory.length > 0) sourceInventoryGapCount += 1;
    if (county === selectedCounty) selectedRow = snapshotJsonValue(row, `${county} baseline row`);
  });

  assertExactOwnDataKeys(
    baselineLedger.summary,
    BASELINE_SUMMARY_KEYS,
    'baselineLedger.summary'
  );
  const exactSummaryValues = {
    capabilityAssessedCountyCount: 0,
    countyRowCount: EXPECTED_COUNTIES.length,
    expectedCountyCount: EXPECTED_COUNTIES.length,
    freshnessProvenanceObservedCountyCount: 0,
    landedRowsObservedCountyCount: 0,
    runtimeRegistrationObservedCountyCount: 0,
    sourceInventoryGapCount,
  };
  for (const [field, expected] of Object.entries(exactSummaryValues)) {
    if (baselineLedger.summary[field] !== expected) {
      throw new Error(`baselineLedger.summary.${field} must equal ${expected}.`);
    }
  }
  assertExactOwnDataKeys(
    baselineLedger.summary.registryStatusCounts,
    [...registryStatusCounts.keys()],
    'baselineLedger.summary.registryStatusCounts'
  );
  const derivedRegistryStatusTotal = [...registryStatusCounts.values()].reduce(
    (total, count) => total + count,
    0
  );
  if (derivedRegistryStatusTotal !== EXPECTED_COUNTIES.length) {
    throw new Error('Derived registry status counts must cover all canonical counties.');
  }
  for (const [status, expected] of registryStatusCounts) {
    if (baselineLedger.summary.registryStatusCounts[status] !== expected) {
      throw new Error(
        `baselineLedger.summary.registryStatusCounts.${status} must equal ${expected}.`
      );
    }
  }

  return selectedRow;
}

function validateArtifactAndSnapshotBytes(artifact) {
  assertExactOwnDataKeys(artifact, ['artifactKind', 'bytes', 'county'], 'artifact');
  if (!EXPECTED_COUNTIES.includes(artifact.county)) {
    throw new Error('artifact.county must be an exact canonical Washington county name.');
  }
  if (!ARTIFACT_KINDS.includes(artifact.artifactKind)) {
    throw new Error('artifact.artifactKind must be parcels or sales.');
  }
  if (!Reflect.apply(Object.prototype.isPrototypeOf, Uint8Array.prototype, [artifact.bytes])) {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  let byteLength;
  try {
    byteLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, artifact.bytes, []);
  } catch {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  if (byteLength === 0) {
    throw new Error('artifact.bytes must not be empty.');
  }
  if (byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(`artifact.bytes exceeds the ${MAX_ARTIFACT_BYTES}-byte fixture limit.`);
  }

  const bytesSnapshot = new Uint8Array(byteLength);
  Reflect.apply(Uint8Array.prototype.set, bytesSnapshot, [artifact.bytes]);
  return {
    artifactKind: artifact.artifactKind,
    bytesSnapshot,
    county: artifact.county,
  };
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const nestedValue of Object.values(value)) deepFreeze(nestedValue, seen);
  return Object.freeze(value);
}

export function buildPublicAcquisitionArtifactReceipt(options) {
  assertExactOwnDataKeys(options, ['artifact', 'baselineLedger'], 'options');
  const { baselineLedger, artifact } = options;
  const { artifactKind, bytesSnapshot, county } = validateArtifactAndSnapshotBytes(artifact);
  const baselineRowSnapshot = validateAndSnapshotBaseline(baselineLedger, county);
  const sha256 = createHash('sha256').update(bytesSnapshot).digest('hex');
  const artifactEvidence = {
    observationStatus: 'exact_supplied_bytes_observed',
    artifactKind,
    byteLength: bytesSnapshot.byteLength,
    hashAlgorithm: 'sha256',
    sha256,
  };

  return deepFreeze({
    contract: CONTRACT_ID,
    environment: ENVIRONMENT_ID,
    evidenceScope: 'supplied_in_memory_public_artifact_bytes_only',
    countyBinding: {
      county,
      countyToken: countyToken(county),
      artifactKind,
      baselineContract: BASELINE_CONTRACT_ID,
    },
    artifactReceipt: artifactEvidence,
    baselineLedgerOverlay: {
      baselineContract: BASELINE_CONTRACT_ID,
      baselineEvidenceScope: 'source_registry_only',
      county,
      baselineRowSnapshot,
      acquisitionArtifactEvidence: { ...artifactEvidence },
    },
    assertions: {
      exactSuppliedBytesObserved: true,
      networkAcquisitionPerformed: false,
      filesystemAccessPerformed: false,
      persistencePerformed: false,
      artifactParsedOrNormalized: false,
      landedRowsObserved: false,
      runtimeRegistrationObserved: false,
      freshnessObserved: false,
      capabilityAssessed: false,
      launchReadinessAssessed: false,
    },
    explicitGaps: {
      acquisition: [
        'network_acquisition_not_performed',
        'artifact_source_provenance_not_observed',
        'acquired_at_utc_not_observed',
        'freshness_not_observed',
      ],
      artifactInterpretation: [
        'format_not_validated',
        'schema_not_validated',
        'content_not_parsed',
        'row_counts_not_observed',
        'data_quality_not_assessed',
      ],
      downstream: [
        'normalization_not_performed',
        'landing_not_performed',
        'runtime_registration_not_observed',
        'capability_not_assessed',
        'launch_readiness_not_assessed',
      ],
    },
  });
}
