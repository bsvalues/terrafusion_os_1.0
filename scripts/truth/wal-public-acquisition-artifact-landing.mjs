/**
 * WO-WAL-001E - verified public artifact temporary landing.
 *
 * This module consumes one complete, deeply immutable 001D verification proof,
 * independently rechecks the caller-supplied bytes, and atomically publishes
 * those bytes inside a unique child of Node's resolved host temp directory.
 * It performs no acquisition and establishes neither source authenticity nor
 * permanent/crash-durable storage, parsing, runtime, capability, or launch truth.
 */

import { createHash } from 'node:crypto';
import { constants as FS_CONSTANTS } from 'node:fs';
import { chmod, link, lstat, mkdtemp, open, realpath, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';

import { EXPECTED_COUNTIES, MAX_ARTIFACT_BYTES } from './wal-public-acquisition-artifact-receipt.mjs';
import {
  CONTRACT_ID as VERIFICATION_CONTRACT_ID,
  ENVIRONMENT_ID as VERIFICATION_ENVIRONMENT_ID,
} from './wal-public-acquisition-artifact-verification.mjs';

export const CONTRACT_ID = 'wal.public-acquisition-artifact-landing.v1';
export const ENVIRONMENT_ID = 'local-temp-public-artifact-landing-only';
export const TERMINAL_CONDITION =
  'VERIFIED_PUBLIC_ARTIFACT_BYTES_ATOMIC_TEMP_LANDING_RECEIPT_PROVEN';

const ARTIFACT_KINDS = Object.freeze(['parcels', 'sales']);
const VERIFICATION_EVIDENCE_SCOPE =
  'supplied_in_memory_bytes_matched_to_structurally_validated_receipt_ledger_claim_only';
const LANDING_EVIDENCE_SCOPE =
  'verified_supplied_bytes_atomically_published_to_unique_host_temp_directory_only';
const TEMP_DIRECTORY_PREFIX = 'terrafusion-wal-001e-';
const STAGING_FILE_NAME = '.artifact-staging';
const VERIFICATION_TOP_LEVEL_KEYS = Object.freeze([
  'assertions',
  'contract',
  'countyBinding',
  'environment',
  'evidenceScope',
  'explicitGaps',
  'verification',
]);
const VERIFICATION_KEYS = Object.freeze([
  'aggregationValidationScope',
  'hashAlgorithm',
  'ledgerDeclaredByteLength',
  'ledgerDeclaredSha256',
  'recomputedByteLength',
  'recomputedSha256',
  'sourceLedgerContract',
  'sourceReceiptContract',
  'status',
]);
const VERIFICATION_ASSERTIONS = Object.freeze({
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
});
const INTERPRETATION_GAPS = Object.freeze([
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
const LANDING_GAPS = Object.freeze([
  'receipt_issuance_not_authenticated',
  'artifact_source_authenticity_not_established',
  'physical_temp_storage_locality_not_attested',
  'directory_entry_crash_durability_not_established',
  'post_receipt_file_presence_not_guaranteed',
  'post_receipt_file_immutability_not_guaranteed',
  'successful_use_cleanup_not_automated',
  'artifact_parsing_and_normalization_not_performed',
  'runtime_registration_not_observed',
  'capability_not_assessed',
  'launch_readiness_not_assessed',
  'same_account_filesystem_race_resistance_not_proven',
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

function frozenRecordSnapshot(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be an own-property-only plain object.`);
  }
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be deeply immutable.`);
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

function inputRecordSnapshot(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be an own-property-only plain object.`);
  }
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

function frozenArraySnapshot(value, allowedLengths, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array.`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (!lengthDescriptor || !('value' in lengthDescriptor)) {
    throw new TypeError(`${label}.length must be a data property.`);
  }
  const length = lengthDescriptor.value;
  if (!allowedLengths.includes(length)) {
    throw new TypeError(
      `${label} must contain exactly ${allowedLengths.join(' or ')} protected gap entries.`
    );
  }
  // The protected cardinality check deliberately precedes Object.isFrozen and ownKeys: both
  // reflective operations may enumerate a caller-controlled array or Proxy result internally.
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be deeply immutable.`);
  const expectedKeys = new Set(['length']);
  const snapshot = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    expectedKeys.add(key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
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

function requireExactArray(value, expected, label) {
  const actual = frozenArraySnapshot(value, [expected.length], label);
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    throw new Error(`${label} must retain the exact protected values.`);
  }
  return actual;
}

function snapshotArtifact(artifact) {
  const input = inputRecordSnapshot(artifact, ['artifactKind', 'bytes', 'county'], 'artifact');
  if (!EXPECTED_COUNTIES.includes(input.county)) {
    throw new Error('artifact.county must be an exact canonical Washington county name.');
  }
  if (!ARTIFACT_KINDS.includes(input.artifactKind)) {
    throw new Error('artifact.artifactKind must be parcels or sales.');
  }
  if (!Reflect.apply(Object.prototype.isPrototypeOf, Uint8Array.prototype, [input.bytes])) {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  let byteLength;
  try {
    byteLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, input.bytes, []);
  } catch {
    throw new TypeError('artifact.bytes must be a Uint8Array view.');
  }
  if (byteLength === 0) throw new Error('artifact.bytes must not be empty.');
  if (byteLength > MAX_ARTIFACT_BYTES) {
    throw new Error(`artifact.bytes exceeds the ${MAX_ARTIFACT_BYTES}-byte landing limit.`);
  }
  const bytes = new Uint8Array(byteLength);
  Reflect.apply(UINT8_ARRAY_SET, bytes, [input.bytes]);
  return { artifactKind: input.artifactKind, bytes, county: input.county };
}

function validateVerificationProof(verificationProof) {
  const proof = frozenRecordSnapshot(
    verificationProof,
    VERIFICATION_TOP_LEVEL_KEYS,
    'verificationProof'
  );
  if (
    proof.contract !== VERIFICATION_CONTRACT_ID ||
    proof.environment !== VERIFICATION_ENVIRONMENT_ID ||
    proof.evidenceScope !== VERIFICATION_EVIDENCE_SCOPE
  ) {
    throw new Error(`verificationProof must be a protected ${VERIFICATION_CONTRACT_ID} value.`);
  }

  const binding = frozenRecordSnapshot(
    proof.countyBinding,
    ['artifactKind', 'county', 'countyToken'],
    'verificationProof.countyBinding'
  );
  if (
    !EXPECTED_COUNTIES.includes(binding.county) ||
    binding.countyToken !== countyToken(binding.county) ||
    !ARTIFACT_KINDS.includes(binding.artifactKind)
  ) {
    throw new Error('verificationProof.countyBinding must retain one canonical county artifact slot.');
  }

  const verification = frozenRecordSnapshot(
    proof.verification,
    VERIFICATION_KEYS,
    'verificationProof.verification'
  );
  if (
    verification.status !== 'exact_match' ||
    verification.hashAlgorithm !== 'sha256' ||
    !Number.isSafeInteger(verification.recomputedByteLength) ||
    verification.recomputedByteLength < 1 ||
    verification.recomputedByteLength > MAX_ARTIFACT_BYTES ||
    verification.ledgerDeclaredByteLength !== verification.recomputedByteLength ||
    typeof verification.recomputedSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(verification.recomputedSha256) ||
    verification.ledgerDeclaredSha256 !== verification.recomputedSha256 ||
    verification.sourceLedgerContract !== 'wal.public-acquisition-receipt-ledger.v1' ||
    verification.sourceReceiptContract !== 'wal.public-acquisition-artifact-receipt.v1' ||
    verification.aggregationValidationScope !== 'structure_and_internal_consistency_only'
  ) {
    throw new Error('verificationProof.verification must retain exact protected 001D evidence.');
  }

  const assertions = frozenRecordSnapshot(
    proof.assertions,
    Object.keys(VERIFICATION_ASSERTIONS),
    'verificationProof.assertions'
  );
  for (const [key, expected] of Object.entries(VERIFICATION_ASSERTIONS)) {
    if (assertions[key] !== expected) {
      throw new Error(`verificationProof.assertions.${key} contradicts protected 001D truth.`);
    }
  }

  const explicitGaps = frozenRecordSnapshot(
    proof.explicitGaps,
    ['sourceLedgerAtAggregation', 'verification'],
    'verificationProof.explicitGaps'
  );
  const sourceGaps = frozenRecordSnapshot(
    explicitGaps.sourceLedgerAtAggregation,
    ['downstream', 'interpretation', 'parcels', 'sales'],
    'verificationProof.explicitGaps.sourceLedgerAtAggregation'
  );
  const allowedParcelGapLengths = binding.artifactKind === 'parcels' ? [0] : [0, 1];
  const allowedSalesGapLengths = binding.artifactKind === 'sales' ? [0] : [0, 1];
  const parcelGaps = frozenArraySnapshot(
    sourceGaps.parcels,
    allowedParcelGapLengths,
    'verificationProof.explicitGaps.sourceLedgerAtAggregation.parcels'
  );
  const salesGaps = frozenArraySnapshot(
    sourceGaps.sales,
    allowedSalesGapLengths,
    'verificationProof.explicitGaps.sourceLedgerAtAggregation.sales'
  );
  if (
    (parcelGaps.length === 1 && parcelGaps[0] !== 'parcel_artifact_receipt_missing') ||
    (salesGaps.length === 1 && salesGaps[0] !== 'sales_artifact_receipt_missing')
  ) {
    throw new Error('verificationProof source-ledger slot gaps contradict the selected artifact.');
  }
  requireExactArray(
    sourceGaps.interpretation,
    INTERPRETATION_GAPS,
    'verificationProof.explicitGaps.sourceLedgerAtAggregation.interpretation'
  );
  requireExactArray(
    sourceGaps.downstream,
    DOWNSTREAM_GAPS,
    'verificationProof.explicitGaps.sourceLedgerAtAggregation.downstream'
  );
  requireExactArray(
    explicitGaps.verification,
    VERIFICATION_GAPS,
    'verificationProof.explicitGaps.verification'
  );

  return { binding, verification };
}

function matchingFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function assertRegularFileStat(stat, byteLength, label) {
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== byteLength) {
    throw new Error(`${label} must be the exact expected regular file.`);
  }
}

async function verifyOpenFile(handle, expectedBytes, expectedSha256) {
  const expectedLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, expectedBytes, []);
  const observed = new Uint8Array(expectedLength + 1);
  let offset = 0;
  while (offset < observed.byteLength) {
    const { bytesRead } = await handle.read(observed, offset, observed.byteLength - offset, offset);
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset !== expectedLength) {
    throw new Error('Published artifact length changed during file-handle verification.');
  }
  const digest = createHash('sha256').update(observed.subarray(0, offset)).digest('hex');
  if (digest !== expectedSha256) {
    throw new Error('Published artifact digest changed during file-handle verification.');
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

async function cleanupFailedLanding(state) {
  const failures = [];
  if (state.handle) {
    try {
      await state.handle.close();
    } catch (error) {
      failures.push(error);
    }
    state.handle = null;
  }
  if (state.stagingCreated) {
    try {
      await unlink(state.stagingPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') failures.push(error);
    }
  }
  if (state.finalCreated) {
    try {
      await unlink(state.finalPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') failures.push(error);
    }
  }
  if (state.directoryCreated) {
    try {
      await rmdir(state.directoryPath);
    } catch (error) {
      failures.push(error);
    }
  }
  return failures;
}

export async function landVerifiedPublicAcquisitionArtifactToTemp(options) {
  const input = inputRecordSnapshot(options, ['artifact', 'verificationProof'], 'options');
  const artifact = snapshotArtifact(input.artifact);
  const proof = validateVerificationProof(input.verificationProof);
  const byteLength = Reflect.apply(TYPED_ARRAY_BYTE_LENGTH_GETTER, artifact.bytes, []);
  const sha256 = createHash('sha256').update(artifact.bytes).digest('hex');

  if (
    proof.binding.county !== artifact.county ||
    proof.binding.artifactKind !== artifact.artifactKind ||
    proof.verification.recomputedByteLength !== byteLength ||
    proof.verification.ledgerDeclaredByteLength !== byteLength ||
    proof.verification.recomputedSha256 !== sha256 ||
    proof.verification.ledgerDeclaredSha256 !== sha256
  ) {
    throw new Error('artifact bytes, county, or kind do not match the complete 001D verification proof.');
  }

  const state = {
    directoryCreated: false,
    directoryPath: null,
    finalCreated: false,
    finalPath: null,
    handle: null,
    stagingCreated: false,
    stagingPath: null,
  };

  try {
    const tempRootPath = await realpath(tmpdir());
    const tempRootStat = await lstat(tempRootPath);
    if (!isAbsolute(tempRootPath) || !tempRootStat.isDirectory() || tempRootStat.isSymbolicLink()) {
      throw new Error('Node host temp root must resolve to an absolute real directory.');
    }

    state.directoryPath = await mkdtemp(join(tempRootPath, TEMP_DIRECTORY_PREFIX));
    state.directoryCreated = true;
    if (dirname(state.directoryPath) !== tempRootPath) {
      throw new Error('Landing directory must be a direct child of the resolved host temp root.');
    }
    const directoryStat = await lstat(state.directoryPath);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new Error('Landing directory must be a real directory.');
    }
    await chmod(state.directoryPath, 0o700);
    const securedDirectoryStat = await lstat(state.directoryPath);
    if (
      !securedDirectoryStat.isDirectory() ||
      securedDirectoryStat.isSymbolicLink() ||
      !matchingFileIdentity(directoryStat, securedDirectoryStat) ||
      (process.platform !== 'win32' && (securedDirectoryStat.mode & 0o777) !== 0o700)
    ) {
      throw new Error('Landing directory must retain its real owner-only identity.');
    }

    const finalFileName = `${proof.binding.countyToken}.${artifact.artifactKind}.verified.bin`;
    state.stagingPath = join(state.directoryPath, STAGING_FILE_NAME);
    state.finalPath = join(state.directoryPath, finalFileName);
    if (
      dirname(state.stagingPath) !== state.directoryPath ||
      dirname(state.finalPath) !== state.directoryPath ||
      basename(state.finalPath) !== finalFileName
    ) {
      throw new Error('Landing paths must remain fixed children of the unique temp directory.');
    }

    const openFlags =
      FS_CONSTANTS.O_CREAT |
      FS_CONSTANTS.O_EXCL |
      FS_CONSTANTS.O_RDWR |
      (FS_CONSTANTS.O_NOFOLLOW ?? 0);
    state.handle = await open(state.stagingPath, openFlags, 0o600);
    state.stagingCreated = true;
    await state.handle.chmod(0o600);
    await state.handle.writeFile(artifact.bytes);
    await state.handle.sync();

    const handleStat = await state.handle.stat();
    const stagingStat = await lstat(state.stagingPath);
    assertRegularFileStat(handleStat, byteLength, 'Open staging handle');
    assertRegularFileStat(stagingStat, byteLength, 'Staging entry');
    if (!matchingFileIdentity(handleStat, stagingStat)) {
      throw new Error('Staging entry no longer identifies the exclusively opened file.');
    }
    if (process.platform !== 'win32' && (handleStat.mode & 0o777) !== 0o600) {
      throw new Error('Staging file must retain owner-only permissions.');
    }

    await link(state.stagingPath, state.finalPath);
    state.finalCreated = true;
    const publishedStat = await lstat(state.finalPath);
    assertRegularFileStat(publishedStat, byteLength, 'Published entry');
    if (!matchingFileIdentity(handleStat, publishedStat)) {
      throw new Error('Published entry must identify the exclusively opened staging file.');
    }
    await verifyOpenFile(state.handle, artifact.bytes, sha256);
    await unlink(state.stagingPath);
    state.stagingCreated = false;

    const finalStat = await lstat(state.finalPath);
    assertRegularFileStat(finalStat, byteLength, 'Final published entry');
    if (!matchingFileIdentity(handleStat, finalStat)) {
      throw new Error('Final entry identity changed after atomic publication.');
    }
    await state.handle.close();
    state.handle = null;

    return deepFreeze({
      contract: CONTRACT_ID,
      environment: ENVIRONMENT_ID,
      terminalCondition: TERMINAL_CONDITION,
      evidenceScope: LANDING_EVIDENCE_SCOPE,
      countyBinding: {
        county: artifact.county,
        countyToken: proof.binding.countyToken,
        artifactKind: artifact.artifactKind,
      },
      verification: {
        sourceContract: VERIFICATION_CONTRACT_ID,
        sourceEvidenceScope: VERIFICATION_EVIDENCE_SCOPE,
        hashAlgorithm: 'sha256',
        byteLength,
        sha256,
      },
      landing: {
        status: 'atomic_temp_landing_complete',
        tempRootKind: 'node_os_tmpdir_resolved_real_path',
        directoryPath: state.directoryPath,
        artifactPath: state.finalPath,
        artifactFileName: finalFileName,
        publicationMethod: 'exclusive_same_directory_hard_link',
        requestedDirectoryMode: '0700',
        requestedFileMode: '0600',
        permissionVerification: process.platform === 'win32' ? 'requested_only' : 'owner_only_bits_observed',
        cleanupRequired: true,
      },
      assertions: {
        completeFrozen001DProofValidated: true,
        exactVerificationProofMatched: true,
        artifactBytesSnapshottedBeforeFilesystemAccess: true,
        artifactByteLengthIndependentlyRecomputed: true,
        artifactDigestIndependentlyRecomputed: true,
        uniqueTempDirectoryCreated: true,
        stagingFileExclusivelyCreated: true,
        fileHandleSyncCompleted: true,
        atomicNoReplacePublicationObserved: true,
        finalEntryObservedAsRegularFile: true,
        postPublicationBytesReverifiedThroughOriginalFileHandle: true,
        receiptIssuanceAuthenticated: false,
        sourceAuthenticityEstablished: false,
        networkAcquisitionPerformed: false,
        permanentStorageEstablished: false,
        crashDurabilityEstablished: false,
        physicalStorageLocalityAttested: false,
        artifactParsedOrNormalized: false,
        runtimeRegistrationObserved: false,
        capabilityAssessed: false,
        launchReadinessAssessed: false,
      },
      explicitGaps: [...LANDING_GAPS],
    });
  } catch (error) {
    const cleanupFailures = await cleanupFailedLanding(state);
    if (cleanupFailures.length > 0) {
      throw new AggregateError(
        [error, ...cleanupFailures],
        'Temporary artifact landing failed and exact cleanup was incomplete.'
      );
    }
    throw error;
  }
}
