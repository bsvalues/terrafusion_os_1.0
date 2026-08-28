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

  const actualKeys = ownKeys.toSorted();
  const sortedExpectedKeys = [...expectedKeys].toSorted();
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

function snapshotJsonValue(value, label, ancestors = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (!value || typeof value !== 'object') {
    throw new TypeError(`${label} must contain only finite JSON data.`);
  }
  if (ancestors.has(value)) throw new TypeError(`${label} must not contain cycles.`);
  ancestors.add(value);

  let snapshot;
  if (Array.isArray(value)) {
    snapshot = value.map((entry, index) => snapshotJsonValue(entry, `${label}[${index}]`, ancestors));
  } else {
    assertPlainRecord(value, label);
    snapshot = {};
    for (const key of Reflect.ownKeys(value).toSorted()) {
      if (typeof key !== 'string') {
        throw new TypeError(`${label} must not contain symbol properties.`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
        throw new TypeError(`${label}.${key} must be an enumerable data property.`);
      }
      Object.defineProperty(snapshot, key, {
        value: snapshotJsonValue(descriptor.value, `${label}.${key}`, ancestors),
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

function assertBaselineNonInference(row, county) {
  const requiredStates = [
    [row.landedRowsEvidence?.observationStatus, 'not_observed', 'landedRowsEvidence'],
    [row.runtimeRegistrationEvidence?.observationStatus, 'not_observed', 'runtimeRegistrationEvidence'],
    [row.freshnessProvenanceEvidence?.observationStatus, 'not_observed', 'freshnessProvenanceEvidence'],
    [row.fallbackEvidence?.observationStatus, 'not_observed', 'fallbackEvidence'],
    [row.capabilityEvidence?.observationStatus, 'not_assessed', 'capabilityEvidence'],
  ];
  for (const [actual, expected, field] of requiredStates) {
    if (actual !== expected) {
      throw new Error(`Baseline row ${county} has non-canonical ${field} state.`);
    }
  }
}

function validateAndSnapshotBaseline(baselineLedger) {
  assertExactOwnDataKeys(baselineLedger, BASELINE_TOP_LEVEL_KEYS, 'baselineLedger');
  const baselineSnapshot = snapshotJsonValue(baselineLedger, 'baselineLedger');
  if (baselineSnapshot.contract !== BASELINE_CONTRACT_ID) {
    throw new Error(`baselineLedger.contract must be ${BASELINE_CONTRACT_ID}.`);
  }
  if (baselineSnapshot.evidenceScope !== 'source_registry_only') {
    throw new Error('baselineLedger.evidenceScope must be source_registry_only.');
  }
  if (
    !Array.isArray(baselineSnapshot.rows) ||
    baselineSnapshot.rows.length !== EXPECTED_COUNTIES.length
  ) {
    throw new Error(`baselineLedger must contain exactly ${EXPECTED_COUNTIES.length} county rows.`);
  }

  baselineSnapshot.rows.forEach((row, index) => {
    const county = EXPECTED_COUNTIES[index];
    assertExactOwnDataKeys(row, BASELINE_ROW_KEYS, `baselineLedger.rows[${index}]`);
    if (row.county !== county) {
      throw new Error(`baselineLedger row ${index} must be canonical county ${county}.`);
    }
    if (row.countyToken !== countyToken(county)) {
      throw new Error(`Baseline row ${county} has a non-canonical countyToken.`);
    }
    assertBaselineNonInference(row, county);
    if (
      county !== 'Benton' &&
      containsBentonReference({
        sourceInventory: row.sourceInventory,
        acquisitionReadiness: row.acquisitionReadiness,
      })
    ) {
      throw new Error(`Non-Benton baseline row ${county} contains Benton source metadata.`);
    }
  });

  return baselineSnapshot;
}

function validateArtifactAndSnapshotBytes(artifact) {
  assertExactOwnDataKeys(artifact, ['artifactKind', 'bytes', 'county'], 'artifact');
  if (!EXPECTED_COUNTIES.includes(artifact.county)) {
    throw new Error('artifact.county must be an exact canonical Washington county name.');
  }
  if (!ARTIFACT_KINDS.includes(artifact.artifactKind)) {
    throw new Error('artifact.artifactKind must be parcels or sales.');
  }
  if (!(artifact.bytes instanceof Uint8Array)) {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  if (artifact.bytes.byteLength === 0) {
    throw new Error('artifact.bytes must not be empty.');
  }
  if (artifact.bytes.byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(`artifact.bytes exceeds the ${MAX_ARTIFACT_BYTES}-byte fixture limit.`);
  }

  return Uint8Array.from(artifact.bytes);
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
  const baselineSnapshot = validateAndSnapshotBaseline(baselineLedger);
  const bytesSnapshot = validateArtifactAndSnapshotBytes(artifact);
  const selectedRowIndex = EXPECTED_COUNTIES.indexOf(artifact.county);
  const baselineRowSnapshot = baselineSnapshot.rows[selectedRowIndex];
  const sha256 = createHash('sha256').update(bytesSnapshot).digest('hex');
  const artifactEvidence = {
    observationStatus: 'exact_supplied_bytes_observed',
    artifactKind: artifact.artifactKind,
    byteLength: bytesSnapshot.byteLength,
    hashAlgorithm: 'sha256',
    sha256,
  };

  return deepFreeze({
    contract: CONTRACT_ID,
    environment: ENVIRONMENT_ID,
    evidenceScope: 'supplied_in_memory_public_artifact_bytes_only',
    countyBinding: {
      county: artifact.county,
      countyToken: countyToken(artifact.county),
      artifactKind: artifact.artifactKind,
      baselineContract: BASELINE_CONTRACT_ID,
    },
    artifactReceipt: artifactEvidence,
    baselineLedgerOverlay: {
      baselineContract: BASELINE_CONTRACT_ID,
      baselineEvidenceScope: baselineSnapshot.evidenceScope,
      county: artifact.county,
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
