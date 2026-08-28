/**
 * WO-WAL-001D - bounded in-memory public artifact byte verification.
 *
 * This module recomputes byte length and SHA-256 for one caller-supplied
 * artifact and compares them with one canonical slot in a protected 001C
 * receipt ledger. It performs no I/O and establishes neither receipt issuance
 * nor source authenticity, acquisition, parsing, freshness, landing, runtime,
 * capability, or launch truth.
 */

import { createHash } from 'node:crypto';

import {
  BASELINE_CONTRACT_ID,
  CONTRACT_ID as ARTIFACT_RECEIPT_CONTRACT_ID,
  EXPECTED_COUNTIES,
  MAX_ARTIFACT_BYTES,
} from './wal-public-acquisition-artifact-receipt.mjs';
import {
  CONTRACT_ID as RECEIPT_LEDGER_CONTRACT_ID,
  ENVIRONMENT_ID as RECEIPT_LEDGER_ENVIRONMENT_ID,
} from './wal-public-acquisition-receipt-ledger.mjs';

export const CONTRACT_ID = 'wal.public-acquisition-artifact-verification.v1';
export const ENVIRONMENT_ID = 'local-memory-public-artifact-verification-only';

const ARTIFACT_KINDS = Object.freeze(['parcels', 'sales']);
const LEDGER_TOP_LEVEL_KEYS = Object.freeze([
  'assertions',
  'contract',
  'environment',
  'evidenceScope',
  'rows',
  'sourceContracts',
  'summary',
]);
const LEDGER_ASSERTION_VALUES = Object.freeze({
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
});
const LEDGER_SUMMARY_KEYS = Object.freeze([
  'countiesWithAnyReceipt',
  'countiesWithBothReceipts',
  'countiesWithMissingReceiptSlots',
  'countyRowCount',
  'expectedCountyCount',
  'parcelReceiptCount',
  'receiptCount',
  'salesReceiptCount',
]);
const LEDGER_ROW_KEYS = Object.freeze([
  'artifacts',
  'county',
  'countyToken',
  'explicitGaps',
]);
const RECEIPT_EVIDENCE_KEYS = Object.freeze([
  'receiptDeclaredByteLength',
  'receiptDeclaredHashAlgorithm',
  'receiptDeclaredSha256',
  'sourceContract',
  'sourceReceiptObservationStatus',
  'validationScope',
]);
const LEDGER_INTERPRETATION_GAPS = Object.freeze([
  'receipt_issuance_not_authenticated',
  'artifact_digest_not_recomputed',
  'format_not_validated',
  'schema_not_validated',
  'content_not_parsed',
  'row_counts_not_observed',
  'data_quality_not_assessed',
]);
const DOWNSTREAM_GAPS = Object.freeze([
  'normalization_not_performed',
  'landing_not_performed',
  'runtime_registration_not_observed',
  'capability_not_assessed',
  'launch_readiness_not_assessed',
]);
const VERIFICATION_GAPS = Object.freeze([
  'receipt_issuance_not_authenticated',
  'artifact_source_authenticity_not_established',
  'network_acquisition_not_performed',
  'acquired_at_utc_not_observed',
  'freshness_not_observed',
]);
const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const TYPED_ARRAY_BYTE_LENGTH_GETTER = Object.getOwnPropertyDescriptor(
  TYPED_ARRAY_PROTOTYPE,
  'byteLength'
).get;
const UINT8_ARRAY_SET = Uint8Array.prototype.set;

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

function assertDeepFrozen(value, label, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be deeply immutable.`);
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (key !== 'length' && (!descriptor || !('value' in descriptor))) {
      throw new TypeError(`${label} must contain data properties only.`);
    }
    if (descriptor && 'value' in descriptor) {
      assertDeepFrozen(descriptor.value, `${label}.${String(key)}`, seen);
    }
  }
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
  if (byteLength === 0) throw new Error('artifact.bytes must not be empty.');
  if (byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(`artifact.bytes exceeds the ${MAX_ARTIFACT_BYTES}-byte verification limit.`);
  }

  const bytesSnapshot = new Uint8Array(byteLength);
  Reflect.apply(UINT8_ARRAY_SET, bytesSnapshot, [artifact.bytes]);
  return {
    artifactKind: artifact.artifactKind,
    bytesSnapshot,
    county: artifact.county,
  };
}

function validateReceiptEvidence(value, label) {
  assertExactOwnDataKeys(value, RECEIPT_EVIDENCE_KEYS, label);
  if (
    value.sourceReceiptObservationStatus !== 'exact_supplied_bytes_observed' ||
    !Number.isSafeInteger(value.receiptDeclaredByteLength) ||
    value.receiptDeclaredByteLength < 1 ||
    value.receiptDeclaredByteLength > MAX_ARTIFACT_BYTES ||
    value.receiptDeclaredHashAlgorithm !== 'sha256' ||
    typeof value.receiptDeclaredSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.receiptDeclaredSha256) ||
    value.sourceContract !== ARTIFACT_RECEIPT_CONTRACT_ID ||
    value.validationScope !== 'structure_and_internal_consistency_only'
  ) {
    throw new Error(`${label} must retain exact protected receipt-ledger evidence.`);
  }
}

function validateReceiptLedgerAndSelect(receiptLedger, selectedCounty, selectedKind) {
  assertExactOwnDataKeys(receiptLedger, LEDGER_TOP_LEVEL_KEYS, 'receiptLedger');
  assertDeepFrozen(receiptLedger, 'receiptLedger');
  if (
    receiptLedger.contract !== RECEIPT_LEDGER_CONTRACT_ID ||
    receiptLedger.environment !== RECEIPT_LEDGER_ENVIRONMENT_ID ||
    receiptLedger.evidenceScope !== 'structurally_validated_in_memory_receipt_claims_only'
  ) {
    throw new Error(`receiptLedger must be a protected ${RECEIPT_LEDGER_CONTRACT_ID} value.`);
  }

  assertExactOwnDataKeys(
    receiptLedger.sourceContracts,
    ['artifactReceipt', 'baseline'],
    'receiptLedger.sourceContracts'
  );
  if (
    receiptLedger.sourceContracts.baseline !== BASELINE_CONTRACT_ID ||
    receiptLedger.sourceContracts.artifactReceipt !== ARTIFACT_RECEIPT_CONTRACT_ID
  ) {
    throw new Error('receiptLedger.sourceContracts must retain the protected source contracts.');
  }

  assertExactOwnDataKeys(
    receiptLedger.assertions,
    Object.keys(LEDGER_ASSERTION_VALUES),
    'receiptLedger.assertions'
  );
  for (const [key, expected] of Object.entries(LEDGER_ASSERTION_VALUES)) {
    if (receiptLedger.assertions[key] !== expected) {
      throw new Error(`receiptLedger.assertions.${key} contradicts protected ledger truth.`);
    }
  }

  assertDensePlainArray(receiptLedger.rows, 'receiptLedger.rows');
  if (receiptLedger.rows.length !== EXPECTED_COUNTIES.length) {
    throw new Error(`receiptLedger.rows must contain exactly ${EXPECTED_COUNTIES.length} rows.`);
  }

  let selectedEvidence = null;
  let selectedGaps = null;
  let receiptCount = 0;
  let parcelReceiptCount = 0;
  let salesReceiptCount = 0;
  let countiesWithBothReceipts = 0;
  let countiesWithAnyReceipt = 0;
  let countiesWithMissingReceiptSlots = 0;

  receiptLedger.rows.forEach((row, index) => {
    const county = EXPECTED_COUNTIES[index];
    const label = `receiptLedger.rows[${index}]`;
    assertExactOwnDataKeys(row, LEDGER_ROW_KEYS, label);
    if (row.county !== county || row.countyToken !== countyToken(county)) {
      throw new Error(`${label} must be canonical county ${county}.`);
    }

    assertExactOwnDataKeys(row.artifacts, ARTIFACT_KINDS, `${label}.artifacts`);
    for (const kind of ARTIFACT_KINDS) {
      const evidence = row.artifacts[kind];
      if (evidence !== null) {
        validateReceiptEvidence(evidence, `${label}.artifacts.${kind}`);
        receiptCount += 1;
        if (kind === 'parcels') parcelReceiptCount += 1;
        else salesReceiptCount += 1;
      }
    }

    assertExactOwnDataKeys(
      row.explicitGaps,
      ['downstream', 'interpretation', 'parcels', 'sales'],
      `${label}.explicitGaps`
    );
    assertExactArray(
      row.explicitGaps.parcels,
      row.artifacts.parcels === null ? ['parcel_artifact_receipt_missing'] : [],
      `${label}.explicitGaps.parcels`
    );
    assertExactArray(
      row.explicitGaps.sales,
      row.artifacts.sales === null ? ['sales_artifact_receipt_missing'] : [],
      `${label}.explicitGaps.sales`
    );
    assertExactArray(
      row.explicitGaps.interpretation,
      LEDGER_INTERPRETATION_GAPS,
      `${label}.explicitGaps.interpretation`
    );
    assertExactArray(
      row.explicitGaps.downstream,
      DOWNSTREAM_GAPS,
      `${label}.explicitGaps.downstream`
    );

    const hasParcels = row.artifacts.parcels !== null;
    const hasSales = row.artifacts.sales !== null;
    if (hasParcels && hasSales) countiesWithBothReceipts += 1;
    if (hasParcels || hasSales) countiesWithAnyReceipt += 1;
    if (!hasParcels || !hasSales) countiesWithMissingReceiptSlots += 1;

    if (county === selectedCounty) {
      selectedEvidence = row.artifacts[selectedKind];
      selectedGaps = {
        parcels: [...row.explicitGaps.parcels],
        sales: [...row.explicitGaps.sales],
        interpretation: [...row.explicitGaps.interpretation],
        downstream: [...row.explicitGaps.downstream],
      };
    }
  });

  assertExactOwnDataKeys(receiptLedger.summary, LEDGER_SUMMARY_KEYS, 'receiptLedger.summary');
  const expectedSummary = {
    expectedCountyCount: EXPECTED_COUNTIES.length,
    countyRowCount: EXPECTED_COUNTIES.length,
    receiptCount,
    parcelReceiptCount,
    salesReceiptCount,
    countiesWithBothReceipts,
    countiesWithAnyReceipt,
    countiesWithMissingReceiptSlots,
  };
  for (const [key, expected] of Object.entries(expectedSummary)) {
    if (receiptLedger.summary[key] !== expected) {
      throw new Error(`receiptLedger.summary.${key} must equal ${expected}.`);
    }
  }

  if (selectedEvidence === null) {
    throw new Error(`receiptLedger has no ${selectedKind} receipt claim for ${selectedCounty}.`);
  }
  return { selectedEvidence, selectedGaps };
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

export function verifyPublicAcquisitionArtifactBytes(options) {
  assertExactOwnDataKeys(options, ['artifact', 'receiptLedger'], 'options');
  const { artifactKind, bytesSnapshot, county } = validateArtifactAndSnapshotBytes(options.artifact);
  const { selectedEvidence, selectedGaps } = validateReceiptLedgerAndSelect(
    options.receiptLedger,
    county,
    artifactKind
  );
  const recomputedByteLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, bytesSnapshot, []);
  const recomputedSha256 = createHash('sha256').update(bytesSnapshot).digest('hex');

  if (recomputedByteLength !== selectedEvidence.receiptDeclaredByteLength) {
    throw new Error(
      `Supplied ${county} ${artifactKind} byte length does not match the receipt-ledger claim.`
    );
  }
  if (recomputedSha256 !== selectedEvidence.receiptDeclaredSha256) {
    throw new Error(
      `Supplied ${county} ${artifactKind} SHA-256 does not match the receipt-ledger claim.`
    );
  }

  return deepFreeze({
    contract: CONTRACT_ID,
    environment: ENVIRONMENT_ID,
    evidenceScope: 'supplied_in_memory_bytes_matched_to_structurally_validated_receipt_ledger_claim_only',
    countyBinding: {
      county,
      countyToken: countyToken(county),
      artifactKind,
    },
    verification: {
      status: 'exact_match',
      hashAlgorithm: 'sha256',
      recomputedByteLength,
      recomputedSha256,
      ledgerDeclaredByteLength: selectedEvidence.receiptDeclaredByteLength,
      ledgerDeclaredSha256: selectedEvidence.receiptDeclaredSha256,
      sourceLedgerContract: RECEIPT_LEDGER_CONTRACT_ID,
      sourceReceiptContract: ARTIFACT_RECEIPT_CONTRACT_ID,
      aggregationValidationScope: selectedEvidence.validationScope,
    },
    assertions: {
      receiptLedgerStructureAndInternalConsistencyValidated: true,
      exactCanonicalCountyArtifactSlotMatched: true,
      artifactByteLengthRecomputedFromSuppliedBytes: true,
      artifactDigestRecomputedFromSuppliedBytes: true,
      exactByteLengthMatched: true,
      exactSha256Matched: true,
      receiptIssuanceAuthenticated: false,
      sourceAuthenticityEstablished: false,
      networkAcquisitionPerformed: false,
      filesystemAccessPerformed: false,
      persistencePerformed: false,
      artifactParsedOrNormalized: false,
      freshnessObserved: false,
      landedRowsObserved: false,
      runtimeRegistrationObserved: false,
      capabilityAssessed: false,
      launchReadinessAssessed: false,
    },
    explicitGaps: {
      sourceLedgerAtAggregation: selectedGaps,
      verification: [...VERIFICATION_GAPS],
    },
  });
}
