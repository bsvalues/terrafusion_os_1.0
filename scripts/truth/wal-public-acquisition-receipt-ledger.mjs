/**
 * WO-WAL-001C - canonical in-memory public acquisition receipt ledger.
 *
 * This module aggregates already-issued WO-WAL-001B receipts. It performs no
 * acquisition or I/O and never promotes a receipt into landed/runtime truth.
 */

import {
  BASELINE_CONTRACT_ID,
  CONTRACT_ID as ARTIFACT_RECEIPT_CONTRACT_ID,
  ENVIRONMENT_ID as ARTIFACT_RECEIPT_ENVIRONMENT_ID,
  EXPECTED_COUNTIES,
  MAX_ARTIFACT_BYTES,
} from './wal-public-acquisition-artifact-receipt.mjs';

export const CONTRACT_ID = 'wal.public-acquisition-receipt-ledger.v1';
export const ENVIRONMENT_ID = 'local-memory-receipt-ledger-only';

const ARTIFACT_KINDS = Object.freeze(['parcels', 'sales']);
const TOP_LEVEL_KEYS = Object.freeze([
  'artifactReceipt',
  'assertions',
  'baselineLedgerOverlay',
  'contract',
  'countyBinding',
  'environment',
  'evidenceScope',
  'explicitGaps',
]);
const ASSERTION_VALUES = Object.freeze({
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
});
const ACQUISITION_GAPS = Object.freeze([
  'network_acquisition_not_performed',
  'artifact_source_provenance_not_observed',
  'acquired_at_utc_not_observed',
  'freshness_not_observed',
]);
const SOURCE_INTERPRETATION_GAPS = Object.freeze([
  'format_not_validated',
  'schema_not_validated',
  'content_not_parsed',
  'row_counts_not_observed',
  'data_quality_not_assessed',
]);
const LEDGER_INTERPRETATION_GAPS = Object.freeze([
  'receipt_issuance_not_authenticated',
  'artifact_digest_not_recomputed',
  ...SOURCE_INTERPRETATION_GAPS,
]);
const DOWNSTREAM_GAPS = Object.freeze([
  'normalization_not_performed',
  'landing_not_performed',
  'runtime_registration_not_observed',
  'capability_not_assessed',
  'launch_readiness_not_assessed',
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
const BASELINE_EXPLICIT_GAP_KEYS = Object.freeze([
  'acquisition',
  'freshnessProvenance',
  'landedData',
  'runtime',
  'sourceInventory',
]);
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
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) {
    throw new TypeError(`${label} must not contain symbol properties.`);
  }
  const actual = [...keys].sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} must contain exactly: ${expected.join(', ')}.`);
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError(`${label}.${key} must be an enumerable data property.`);
    }
  }
}

function assertDensePlainArray(value, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array.`);
  }
  const expectedKeys = new Set(['length']);
  for (let index = 0; index < value.length; index += 1) {
    expectedKeys.add(String(index));
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError(`${label} must contain dense enumerable data elements.`);
    }
  }
  if (Reflect.ownKeys(value).some(key => !expectedKeys.has(key))) {
    throw new TypeError(`${label} must not contain custom properties.`);
  }
}

function assertExactArray(value, expected, label) {
  assertDensePlainArray(value, label);
  if (value.length !== expected.length || value.some((entry, index) => entry !== expected[index])) {
    throw new Error(`${label} must retain the protected canonical values.`);
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

function assertDeepFrozen(value, label, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be deeply immutable.`);
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (key !== 'length' && (!descriptor || !('value' in descriptor))) {
      throw new TypeError(`${label} must contain data properties only.`);
    }
    if (descriptor && 'value' in descriptor) assertDeepFrozen(descriptor.value, `${label}.${String(key)}`, seen);
  }
}

function assertEvidence(value, kind, label) {
  assertExactOwnDataKeys(
    value,
    ['artifactKind', 'byteLength', 'hashAlgorithm', 'observationStatus', 'sha256'],
    label
  );
  if (
    value.observationStatus !== 'exact_supplied_bytes_observed' ||
    value.artifactKind !== kind ||
    value.hashAlgorithm !== 'sha256' ||
    !Number.isSafeInteger(value.byteLength) ||
    value.byteLength < 1 ||
    value.byteLength > MAX_ARTIFACT_BYTES ||
    typeof value.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.sha256)
  ) {
    throw new Error(`${label} must contain exact bounded SHA-256 receipt evidence.`);
  }
}

function containsBentonReference(value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .includes('benton');
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some(nested => containsBentonReference(nested, seen));
}

function validateBaselineSnapshot(row, county, label) {
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
    assertNullableBoundedString(
      row.acquisitionReadiness[field],
      `${label}.acquisitionReadiness.${field}`
    );
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
    throw new Error(`${label}.runtimeRegistrationEvidence must remain entirely unobserved.`);
  }
  for (const dataset of ARTIFACT_KINDS) {
    const value = row.runtimeRegistrationEvidence[dataset];
    assertExactOwnDataKeys(
      value,
      RUNTIME_DATASET_KEYS,
      `${label}.runtimeRegistrationEvidence.${dataset}`
    );
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
  assertExactArray(
    row.capabilityEvidence.supportedCapabilities,
    [],
    `${label}.capabilityEvidence.supportedCapabilities`
  );

  assertExactOwnDataKeys(row.explicitGaps, BASELINE_EXPLICIT_GAP_KEYS, `${label}.explicitGaps`);
  const sourceInventoryGaps = [];
  if (row.sourceInventory.officialAssessorBaseUrl === null) {
    sourceInventoryGaps.push('official_assessor_url_missing');
  }
  if (row.sourceInventory.primarySalesSourceDescription === null) {
    sourceInventoryGaps.push('primary_sales_source_missing');
  }
  if (row.acquisitionReadiness.acquisitionFamily === null) {
    sourceInventoryGaps.push('acquisition_family_missing');
  }
  const acquisitionGaps =
    row.acquisitionReadiness.registryStatus === 'adapter-ready'
      ? []
      : ['acquisition_not_adapter_ready_in_registry'];
  assertExactArray(
    row.explicitGaps.sourceInventory,
    sourceInventoryGaps,
    `${label}.explicitGaps.sourceInventory`
  );
  assertExactArray(
    row.explicitGaps.acquisition,
    acquisitionGaps,
    `${label}.explicitGaps.acquisition`
  );
  assertExactArray(
    row.explicitGaps.landedData,
    ['parcel_rows_not_observed', 'sales_rows_not_observed'],
    `${label}.explicitGaps.landedData`
  );
  assertExactArray(
    row.explicitGaps.runtime,
    ['parcel_runtime_registration_not_observed', 'sales_runtime_registration_not_observed'],
    `${label}.explicitGaps.runtime`
  );
  assertExactArray(
    row.explicitGaps.freshnessProvenance,
    [
      'acquisition_freshness_not_observed',
      'row_provenance_not_observed',
      'transform_version_not_observed',
    ],
    `${label}.explicitGaps.freshnessProvenance`
  );

  if (county !== 'Benton' && containsBentonReference(row)) {
    throw new Error(`${label} contains Benton metadata for non-Benton county ${county}.`);
  }
}

function validateReceipt(receipt, index) {
  const label = `receipts[${index}]`;
  assertExactOwnDataKeys(receipt, TOP_LEVEL_KEYS, label);
  assertDeepFrozen(receipt, label);
  if (
    receipt.contract !== ARTIFACT_RECEIPT_CONTRACT_ID ||
    receipt.environment !== ARTIFACT_RECEIPT_ENVIRONMENT_ID ||
    receipt.evidenceScope !== 'supplied_in_memory_public_artifact_bytes_only'
  ) {
    throw new Error(`${label} must be a protected ${ARTIFACT_RECEIPT_CONTRACT_ID} value.`);
  }

  assertExactOwnDataKeys(
    receipt.countyBinding,
    ['artifactKind', 'baselineContract', 'county', 'countyToken'],
    `${label}.countyBinding`
  );
  const { county, artifactKind } = receipt.countyBinding;
  if (!EXPECTED_COUNTIES.includes(county) || !ARTIFACT_KINDS.includes(artifactKind)) {
    throw new Error(`${label} must use an exact canonical county and artifact kind.`);
  }
  if (
    receipt.countyBinding.countyToken !== countyToken(county) ||
    receipt.countyBinding.baselineContract !== BASELINE_CONTRACT_ID
  ) {
    throw new Error(`${label}.countyBinding does not match its canonical baseline binding.`);
  }

  assertEvidence(receipt.artifactReceipt, artifactKind, `${label}.artifactReceipt`);
  assertExactOwnDataKeys(
    receipt.baselineLedgerOverlay,
    [
      'acquisitionArtifactEvidence',
      'baselineContract',
      'baselineEvidenceScope',
      'baselineRowSnapshot',
      'county',
    ],
    `${label}.baselineLedgerOverlay`
  );
  if (
    receipt.baselineLedgerOverlay.baselineContract !== BASELINE_CONTRACT_ID ||
    receipt.baselineLedgerOverlay.baselineEvidenceScope !== 'source_registry_only' ||
    receipt.baselineLedgerOverlay.county !== county
  ) {
    throw new Error(`${label}.baselineLedgerOverlay must match the county binding.`);
  }
  assertEvidence(
    receipt.baselineLedgerOverlay.acquisitionArtifactEvidence,
    artifactKind,
    `${label}.baselineLedgerOverlay.acquisitionArtifactEvidence`
  );
  if (
    JSON.stringify(receipt.baselineLedgerOverlay.acquisitionArtifactEvidence) !==
    JSON.stringify(receipt.artifactReceipt)
  ) {
    throw new Error(`${label} contains mismatched artifact evidence copies.`);
  }
  const snapshot = receipt.baselineLedgerOverlay.baselineRowSnapshot;
  validateBaselineSnapshot(snapshot, county, `${label}.baselineLedgerOverlay.baselineRowSnapshot`);

  assertExactOwnDataKeys(receipt.assertions, Object.keys(ASSERTION_VALUES), `${label}.assertions`);
  for (const [key, expected] of Object.entries(ASSERTION_VALUES)) {
    if (receipt.assertions[key] !== expected) {
      throw new Error(`${label}.assertions.${key} contradicts protected receipt truth.`);
    }
  }
  assertExactOwnDataKeys(
    receipt.explicitGaps,
    ['acquisition', 'artifactInterpretation', 'downstream'],
    `${label}.explicitGaps`
  );
  assertExactArray(receipt.explicitGaps.acquisition, ACQUISITION_GAPS, `${label}.explicitGaps.acquisition`);
  assertExactArray(
    receipt.explicitGaps.artifactInterpretation,
    SOURCE_INTERPRETATION_GAPS,
    `${label}.explicitGaps.artifactInterpretation`
  );
  assertExactArray(receipt.explicitGaps.downstream, DOWNSTREAM_GAPS, `${label}.explicitGaps.downstream`);

  return {
    county,
    artifactKind,
    evidence: {
      sourceReceiptObservationStatus: receipt.artifactReceipt.observationStatus,
      receiptDeclaredByteLength: receipt.artifactReceipt.byteLength,
      receiptDeclaredHashAlgorithm: receipt.artifactReceipt.hashAlgorithm,
      receiptDeclaredSha256: receipt.artifactReceipt.sha256,
      sourceContract: ARTIFACT_RECEIPT_CONTRACT_ID,
      validationScope: 'structure_and_internal_consistency_only',
    },
  };
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

export function buildPublicAcquisitionReceiptLedger(options) {
  assertExactOwnDataKeys(options, ['receipts'], 'options');
  assertDensePlainArray(options.receipts, 'receipts');
  if (options.receipts.length > EXPECTED_COUNTIES.length * ARTIFACT_KINDS.length) {
    throw new Error('receipts exceeds the exact 39-county parcel/sales ledger capacity.');
  }

  const evidenceByKey = new Map();
  options.receipts.forEach((receipt, index) => {
    const validated = validateReceipt(receipt, index);
    const key = `${validated.county}\u0000${validated.artifactKind}`;
    if (evidenceByKey.has(key)) {
      throw new Error(`Duplicate ${validated.artifactKind} receipt for ${validated.county}.`);
    }
    evidenceByKey.set(key, validated.evidence);
  });

  const rows = EXPECTED_COUNTIES.map(county => {
    const parcels = evidenceByKey.get(`${county}\u0000parcels`) ?? null;
    const sales = evidenceByKey.get(`${county}\u0000sales`) ?? null;
    return {
      county,
      countyToken: countyToken(county),
      artifacts: { parcels, sales },
      explicitGaps: {
        parcels: parcels ? [] : ['parcel_artifact_receipt_missing'],
        sales: sales ? [] : ['sales_artifact_receipt_missing'],
        interpretation: [...LEDGER_INTERPRETATION_GAPS],
        downstream: [...DOWNSTREAM_GAPS],
      },
    };
  });
  const parcelReceiptCount = rows.filter(row => row.artifacts.parcels !== null).length;
  const salesReceiptCount = rows.filter(row => row.artifacts.sales !== null).length;

  return deepFreeze({
    contract: CONTRACT_ID,
    environment: ENVIRONMENT_ID,
    evidenceScope: 'structurally_validated_in_memory_receipt_claims_only',
    sourceContracts: {
      baseline: BASELINE_CONTRACT_ID,
      artifactReceipt: ARTIFACT_RECEIPT_CONTRACT_ID,
    },
    assertions: {
      exactCanonicalCountySet: true,
      exactlyOneRowPerCounty: true,
      deterministicCanonicalOrder: true,
      duplicateCountyArtifactReceiptsAccepted: false,
      receiptIssuanceAuthenticated: false,
      artifactDigestRecomputed: false,
      acquisitionPerformed: false,
      artifactContentParsed: false,
      landedRowsObserved: false,
      runtimeRegistrationObserved: false,
      capabilityAssessed: false,
    },
    summary: {
      expectedCountyCount: EXPECTED_COUNTIES.length,
      countyRowCount: rows.length,
      receiptCount: evidenceByKey.size,
      parcelReceiptCount,
      salesReceiptCount,
      countiesWithBothReceipts: rows.filter(
        row => row.artifacts.parcels !== null && row.artifacts.sales !== null
      ).length,
      countiesWithAnyReceipt: rows.filter(
        row => row.artifacts.parcels !== null || row.artifacts.sales !== null
      ).length,
      countiesWithMissingReceiptSlots: rows.filter(
        row => row.explicitGaps.parcels.length || row.explicitGaps.sales.length
      ).length,
    },
    rows,
  });
}
