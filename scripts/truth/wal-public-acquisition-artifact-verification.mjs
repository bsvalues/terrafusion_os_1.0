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
  const snapshot = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError(`${label}.${key} must be an enumerable data property.`);
    }
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function assertDensePlainArray(value, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array.`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (!lengthDescriptor || !('value' in lengthDescriptor)) {
    throw new TypeError(`${label}.length must be a data property.`);
  }
  const length = lengthDescriptor.value;
  const expectedKeys = new Set(['length']);
  const snapshot = [];
  for (let index = 0; index < length; index += 1) {
    expectedKeys.add(String(index));
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError(`${label} must contain dense enumerable data elements.`);
    }
    snapshot.push(descriptor.value);
  }
  if (Reflect.ownKeys(value).some(key => !expectedKeys.has(key))) {
    throw new TypeError(`${label} must not contain custom properties.`);
  }
  return snapshot;
}

function assertExactArray(value, expected, label) {
  const snapshot = assertDensePlainArray(value, label);
  if (
    snapshot.length !== expected.length ||
    snapshot.some((entry, index) => entry !== expected[index])
  ) {
    throw new Error(`${label} must retain the protected canonical values.`);
  }
  return snapshot;
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
  const declaration = assertExactOwnDataKeys(
    artifact,
    ['artifactKind', 'bytes', 'county'],
    'artifact'
  );
  if (!EXPECTED_COUNTIES.includes(declaration.county)) {
    throw new Error('artifact.county must be an exact canonical Washington county name.');
  }
  if (!ARTIFACT_KINDS.includes(declaration.artifactKind)) {
    throw new Error('artifact.artifactKind must be parcels or sales.');
  }
  if (!Reflect.apply(Object.prototype.isPrototypeOf, Uint8Array.prototype, [declaration.bytes])) {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }

  let byteLength;
  try {
    byteLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, declaration.bytes, []);
  } catch {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  if (byteLength === 0) throw new Error('artifact.bytes must not be empty.');
  if (byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(`artifact.bytes exceeds the ${MAX_ARTIFACT_BYTES}-byte verification limit.`);
  }

  const bytesSnapshot = new Uint8Array(byteLength);
  Reflect.apply(UINT8_ARRAY_SET, bytesSnapshot, [declaration.bytes]);
  return {
    artifactKind: declaration.artifactKind,
    bytesSnapshot,
    county: declaration.county,
  };
}

function validateReceiptEvidence(value, label) {
  const evidence = assertExactOwnDataKeys(value, RECEIPT_EVIDENCE_KEYS, label);
  if (
    evidence.sourceReceiptObservationStatus !== 'exact_supplied_bytes_observed' ||
    !Number.isSafeInteger(evidence.receiptDeclaredByteLength) ||
    evidence.receiptDeclaredByteLength < 1 ||
    evidence.receiptDeclaredByteLength > MAX_ARTIFACT_BYTES ||
    evidence.receiptDeclaredHashAlgorithm !== 'sha256' ||
    typeof evidence.receiptDeclaredSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(evidence.receiptDeclaredSha256) ||
    evidence.sourceContract !== ARTIFACT_RECEIPT_CONTRACT_ID ||
    evidence.validationScope !== 'structure_and_internal_consistency_only'
  ) {
    throw new Error(`${label} must retain exact protected receipt-ledger evidence.`);
  }
  return evidence;
}

function validateReceiptLedgerAndSelect(receiptLedger, selectedCounty, selectedKind) {
  const ledger = assertExactOwnDataKeys(receiptLedger, LEDGER_TOP_LEVEL_KEYS, 'receiptLedger');
  assertDeepFrozen(receiptLedger, 'receiptLedger');
  if (
    ledger.contract !== RECEIPT_LEDGER_CONTRACT_ID ||
    ledger.environment !== RECEIPT_LEDGER_ENVIRONMENT_ID ||
    ledger.evidenceScope !== 'structurally_validated_in_memory_receipt_claims_only'
  ) {
    throw new Error(`receiptLedger must be a protected ${RECEIPT_LEDGER_CONTRACT_ID} value.`);
  }

  const sourceContracts = assertExactOwnDataKeys(
    ledger.sourceContracts,
    ['artifactReceipt', 'baseline'],
    'receiptLedger.sourceContracts'
  );
  if (
    sourceContracts.baseline !== BASELINE_CONTRACT_ID ||
    sourceContracts.artifactReceipt !== ARTIFACT_RECEIPT_CONTRACT_ID
  ) {
    throw new Error('receiptLedger.sourceContracts must retain the protected source contracts.');
  }

  const assertions = assertExactOwnDataKeys(
    ledger.assertions,
    Object.keys(LEDGER_ASSERTION_VALUES),
    'receiptLedger.assertions'
  );
  for (const [key, expected] of Object.entries(LEDGER_ASSERTION_VALUES)) {
    if (assertions[key] !== expected) {
      throw new Error(`receiptLedger.assertions.${key} contradicts protected ledger truth.`);
    }
  }

  const rows = assertDensePlainArray(ledger.rows, 'receiptLedger.rows');
  if (rows.length !== EXPECTED_COUNTIES.length) {
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

  rows.forEach((rowValue, index) => {
    const county = EXPECTED_COUNTIES[index];
    const label = `receiptLedger.rows[${index}]`;
    const row = assertExactOwnDataKeys(rowValue, LEDGER_ROW_KEYS, label);
    if (row.county !== county || row.countyToken !== countyToken(county)) {
      throw new Error(`${label} must be canonical county ${county}.`);
    }

    const artifacts = assertExactOwnDataKeys(row.artifacts, ARTIFACT_KINDS, `${label}.artifacts`);
    const validatedArtifacts = Object.create(null);
    for (const kind of ARTIFACT_KINDS) {
      const evidence = artifacts[kind];
      if (evidence !== null) {
        validatedArtifacts[kind] = validateReceiptEvidence(
          evidence,
          `${label}.artifacts.${kind}`
        );
        receiptCount += 1;
        if (kind === 'parcels') parcelReceiptCount += 1;
        else salesReceiptCount += 1;
      } else {
        validatedArtifacts[kind] = null;
      }
    }

    const explicitGaps = assertExactOwnDataKeys(
      row.explicitGaps,
      ['downstream', 'interpretation', 'parcels', 'sales'],
      `${label}.explicitGaps`
    );
    const parcelGaps = assertExactArray(
      explicitGaps.parcels,
      artifacts.parcels === null ? ['parcel_artifact_receipt_missing'] : [],
      `${label}.explicitGaps.parcels`
    );
    const salesGaps = assertExactArray(
      explicitGaps.sales,
      artifacts.sales === null ? ['sales_artifact_receipt_missing'] : [],
      `${label}.explicitGaps.sales`
    );
    const interpretationGaps = assertExactArray(
      explicitGaps.interpretation,
      LEDGER_INTERPRETATION_GAPS,
      `${label}.explicitGaps.interpretation`
    );
    const downstreamGaps = assertExactArray(
      explicitGaps.downstream,
      DOWNSTREAM_GAPS,
      `${label}.explicitGaps.downstream`
    );

    const hasParcels = artifacts.parcels !== null;
    const hasSales = artifacts.sales !== null;
    if (hasParcels && hasSales) countiesWithBothReceipts += 1;
    if (hasParcels || hasSales) countiesWithAnyReceipt += 1;
    if (!hasParcels || !hasSales) countiesWithMissingReceiptSlots += 1;

    if (county === selectedCounty) {
      selectedEvidence = validatedArtifacts[selectedKind];
      selectedGaps = {
        parcels: [...parcelGaps],
        sales: [...salesGaps],
        interpretation: [...interpretationGaps],
        downstream: [...downstreamGaps],
      };
    }
  });

  const summary = assertExactOwnDataKeys(
    ledger.summary,
    LEDGER_SUMMARY_KEYS,
    'receiptLedger.summary'
  );
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
    if (summary[key] !== expected) {
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
  const input = assertExactOwnDataKeys(options, ['artifact', 'receiptLedger'], 'options');
  const { artifactKind, bytesSnapshot, county } = validateArtifactAndSnapshotBytes(input.artifact);
  const { selectedEvidence, selectedGaps } = validateReceiptLedgerAndSelect(
    input.receiptLedger,
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
