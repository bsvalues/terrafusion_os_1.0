/**
 * Phase 4N43d — Adversarial Attack Library
 * =========================================
 *
 * Deterministic mutation helpers for generating tampered test artifacts.
 * Each attack maps to a specific failure code for testing fail-closed semantics.
 *
 * Key Principles:
 *   1. All mutations are deterministic (reproducible test failures)
 *   2. Each attack targets a specific verification check
 *   3. Attacks should trigger exactly one error code (no ambiguity)
 *   4. JSON key reordering should NOT defeat verification (canonicalization test)
 *
 * Usage in tests:
 *   import { swapCasefileKeepManifest, bitflipPayload } from './attack-lib.js';
 */

import * as crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attack result containing the mutated artifact and expected failure.
 */
export interface AttackResult<T> {
  /** Mutated artifact */
  artifact: T;
  /** Expected verification error code */
  expectedErrorCode: string;
  /** Human-readable attack description */
  attackDescription: string;
  /** Attack category for grouping */
  attackCategory: AttackCategory;
}

export type AttackCategory =
  | 'asset-swap'
  | 'hash-tampering'
  | 'chain-tampering'
  | 'identity-tampering'
  | 'linkage-tampering'
  | 'bitflip'
  | 'canonicalization';

/**
 * Sealed casefile artifact structure for testing.
 */
export interface TestCasefileArtifact {
  'casefile.zip': Buffer;
  'casefile-manifest.json': Buffer;
  'sealed-manifest.json': Buffer;
  'ledger-head.json'?: Buffer;
  seals?: Record<string, Buffer>;
}

/**
 * Ledger snapshot with chain info for testing.
 */
export interface TestLedgerSnapshot {
  chain: {
    ledgerSha256: string;
    previousLedgerSha256: string | null;
    generatedAt: string;
    repoIdentity: {
      repoId: number;
      ownerRepo: string;
      defaultBranch: string;
    };
    sequenceNumber: number;
  };
  [key: string]: unknown;
}

/**
 * Ledger head for testing.
 */
export interface TestLedgerHead {
  headLedgerSha256: string;
  headReleaseTag: string;
  headCasefileSha256: string;
  headSequenceNumber: number;
  repoIdentity: {
    repoId: number;
    ownerRepo: string;
    defaultBranch: string;
  };
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes SHA256 of a buffer.
 */
export function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Creates a deterministic random buffer (for reproducibility).
 */
export function deterministicBuffer(seed: string, size: number): Buffer {
  const hash = crypto.createHash('sha256').update(seed).digest();
  const result = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    result[i] = hash[i % hash.length];
  }
  return result;
}

/**
 * Shuffles object keys without changing values (defeats naive JSON comparison).
 */
export function reorderJsonKeys<T extends Record<string, unknown>>(obj: T): T {
  const keys = Object.keys(obj);
  // Reverse alphabetical order (opposite of canonical)
  keys.sort().reverse();

  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Swap Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Swaps casefile.zip with different content but keeps manifest unchanged.
 * Expected failure: CASEFILE_HASH_MISMATCH
 */
export function swapCasefileKeepManifest(
  artifacts: TestCasefileArtifact,
  newCasefile: Buffer
): AttackResult<TestCasefileArtifact> {
  return {
    artifact: {
      ...artifacts,
      'casefile.zip': newCasefile,
    },
    expectedErrorCode: 'CASEFILE_HASH_MISMATCH',
    attackDescription: 'Swapped casefile.zip with different content, manifest unchanged',
    attackCategory: 'asset-swap',
  };
}

/**
 * Swaps manifest with different content but keeps casefile.zip unchanged.
 * Expected failure: MANIFEST_HASH_MISMATCH
 */
export function swapManifestKeepCasefile(
  artifacts: TestCasefileArtifact,
  newManifest: Buffer
): AttackResult<TestCasefileArtifact> {
  return {
    artifact: {
      ...artifacts,
      'casefile-manifest.json': newManifest,
    },
    expectedErrorCode: 'MANIFEST_HASH_MISMATCH',
    attackDescription: 'Swapped casefile-manifest.json with different content, casefile unchanged',
    attackCategory: 'asset-swap',
  };
}

/**
 * Removes casefile.zip entirely.
 * Expected failure: CASEFILE_NOT_FOUND
 */
export function removeCasefile(
  artifacts: TestCasefileArtifact
): AttackResult<Omit<TestCasefileArtifact, 'casefile.zip'>> {
  const { 'casefile.zip': _, ...rest } = artifacts;
  return {
    artifact: rest,
    expectedErrorCode: 'CASEFILE_NOT_FOUND',
    attackDescription: 'Removed casefile.zip from artifact set',
    attackCategory: 'asset-swap',
  };
}

/**
 * Removes manifest entirely.
 * Expected failure: MANIFEST_NOT_FOUND
 */
export function removeManifest(
  artifacts: TestCasefileArtifact
): AttackResult<Omit<TestCasefileArtifact, 'casefile-manifest.json'>> {
  const { 'casefile-manifest.json': _, ...rest } = artifacts;
  return {
    artifact: rest,
    expectedErrorCode: 'MANIFEST_NOT_FOUND',
    attackDescription: 'Removed casefile-manifest.json from artifact set',
    attackCategory: 'asset-swap',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger Head Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutates ledger-head.json headLedgerSha256 field.
 * Expected failure: LEDGER_HASH_MISMATCH
 */
export function mutateLedgerHeadHash(head: TestLedgerHead): AttackResult<TestLedgerHead> {
  return {
    artifact: {
      ...head,
      headLedgerSha256: sha256(`tampered-${head.headLedgerSha256}`),
    },
    expectedErrorCode: 'LEDGER_HASH_MISMATCH',
    attackDescription: 'Mutated ledger-head.json headLedgerSha256 to invalid value',
    attackCategory: 'hash-tampering',
  };
}

/**
 * Mutates ledger-head.json sequence number.
 * Expected failure: LEDGER_SEQUENCE_GAP
 */
export function mutateLedgerHeadSequence(head: TestLedgerHead): AttackResult<TestLedgerHead> {
  return {
    artifact: {
      ...head,
      headSequenceNumber: head.headSequenceNumber + 100,
    },
    expectedErrorCode: 'LEDGER_SEQUENCE_GAP',
    attackDescription: 'Mutated ledger-head.json sequence number to create gap',
    attackCategory: 'chain-tampering',
  };
}

/**
 * Removes ledger-head.json entirely.
 * Expected failure: LEDGER_HEAD_NOT_FOUND
 */
export function removeLedgerHead(
  artifacts: TestCasefileArtifact
): AttackResult<Omit<TestCasefileArtifact, 'ledger-head.json'>> {
  const { 'ledger-head.json': _, ...rest } = artifacts;
  return {
    artifact: rest,
    expectedErrorCode: 'LEDGER_HEAD_NOT_FOUND',
    attackDescription: 'Removed ledger-head.json from artifact set',
    attackCategory: 'chain-tampering',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Continuity Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Breaks chain by mutating previousLedgerSha256.
 * Expected failure: LEDGER_CHAIN_BROKEN
 */
export function breakChainContinuity(
  snapshot: TestLedgerSnapshot
): AttackResult<TestLedgerSnapshot> {
  return {
    artifact: {
      ...snapshot,
      chain: {
        ...snapshot.chain,
        previousLedgerSha256: sha256(`broken-${snapshot.chain.previousLedgerSha256}`),
      },
    },
    expectedErrorCode: 'LEDGER_CHAIN_BROKEN',
    attackDescription: 'Mutated previousLedgerSha256 to break chain link',
    attackCategory: 'chain-tampering',
  };
}

/**
 * Creates sequence gap by incrementing sequence number.
 * Expected failure: LEDGER_SEQUENCE_GAP
 */
export function createSequenceGap(
  snapshot: TestLedgerSnapshot,
  gapSize: number = 1
): AttackResult<TestLedgerSnapshot> {
  return {
    artifact: {
      ...snapshot,
      chain: {
        ...snapshot.chain,
        sequenceNumber: snapshot.chain.sequenceNumber + gapSize + 1,
      },
    },
    expectedErrorCode: 'LEDGER_SEQUENCE_GAP',
    attackDescription: `Created sequence gap of ${gapSize} by incrementing sequence number`,
    attackCategory: 'chain-tampering',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Repo Identity Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutates repo ID (numeric) for fork spoofing attack.
 * Expected failure: REPO_ID_MISMATCH
 */
export function spoofRepoId(
  snapshot: TestLedgerSnapshot,
  fakeRepoId: number = 999999
): AttackResult<TestLedgerSnapshot> {
  return {
    artifact: {
      ...snapshot,
      chain: {
        ...snapshot.chain,
        repoIdentity: {
          ...snapshot.chain.repoIdentity,
          repoId: fakeRepoId,
        },
      },
    },
    expectedErrorCode: 'REPO_ID_MISMATCH',
    attackDescription: `Spoofed repoId from ${snapshot.chain.repoIdentity.repoId} to ${fakeRepoId}`,
    attackCategory: 'identity-tampering',
  };
}

/**
 * Mutates repo slug for repository spoofing attack.
 * Expected failure: REPO_SLUG_MISMATCH
 */
export function spoofRepoSlug(
  snapshot: TestLedgerSnapshot,
  fakeSlug: string = 'attacker/fake-repo'
): AttackResult<TestLedgerSnapshot> {
  return {
    artifact: {
      ...snapshot,
      chain: {
        ...snapshot.chain,
        repoIdentity: {
          ...snapshot.chain.repoIdentity,
          ownerRepo: fakeSlug,
        },
      },
    },
    expectedErrorCode: 'REPO_SLUG_MISMATCH',
    attackDescription: `Spoofed ownerRepo from ${snapshot.chain.repoIdentity.ownerRepo} to ${fakeSlug}`,
    attackCategory: 'identity-tampering',
  };
}

/**
 * Mutates default branch for branch spoofing attack.
 * Expected failure: DEFAULT_BRANCH_MISMATCH
 */
export function spoofDefaultBranch(
  snapshot: TestLedgerSnapshot,
  fakeBranch: string = 'evil-main'
): AttackResult<TestLedgerSnapshot> {
  return {
    artifact: {
      ...snapshot,
      chain: {
        ...snapshot.chain,
        repoIdentity: {
          ...snapshot.chain.repoIdentity,
          defaultBranch: fakeBranch,
        },
      },
    },
    expectedErrorCode: 'DEFAULT_BRANCH_MISMATCH',
    attackDescription: `Spoofed defaultBranch from ${snapshot.chain.repoIdentity.defaultBranch} to ${fakeBranch}`,
    attackCategory: 'identity-tampering',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Release Linkage Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutates release linkage fields in manifest.
 */
export interface ReleaseLinkedManifest {
  releaseTag: string;
  previousReleaseTag: string | null;
  previousCasefileSha256: string | null;
  ledgerHeadSha256: string | null;
  [key: string]: unknown;
}

/**
 * Breaks release chain by mutating previousCasefileSha256.
 * Expected failure: RELEASE_CHAIN_BROKEN
 */
export function breakReleaseChain(
  manifest: ReleaseLinkedManifest
): AttackResult<ReleaseLinkedManifest> {
  return {
    artifact: {
      ...manifest,
      previousCasefileSha256: sha256(`broken-${manifest.previousCasefileSha256}`),
    },
    expectedErrorCode: 'RELEASE_CHAIN_BROKEN',
    attackDescription: 'Mutated previousCasefileSha256 to break release chain',
    attackCategory: 'linkage-tampering',
  };
}

/**
 * Mutates ledgerHeadSha256 in manifest to mismatch ledger-head.json.
 * Expected failure: RELEASE_LINKAGE_INVALID
 */
export function breakLedgerLinkage(
  manifest: ReleaseLinkedManifest
): AttackResult<ReleaseLinkedManifest> {
  return {
    artifact: {
      ...manifest,
      ledgerHeadSha256: sha256(`broken-${manifest.ledgerHeadSha256}`),
    },
    expectedErrorCode: 'RELEASE_LINKAGE_INVALID',
    attackDescription: 'Mutated ledgerHeadSha256 to break ledger linkage',
    attackCategory: 'linkage-tampering',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bitflip Attack
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs a single bitflip at a deterministic position.
 * Expected failure: depends on what was flipped (hash mismatch or corruption)
 */
export function bitflipPayload(
  payload: Buffer,
  position?: number,
  expectedCode: string = 'CASEFILE_CORRUPT'
): AttackResult<Buffer> {
  const pos = position ?? Math.floor(payload.length / 2);
  const mutated = Buffer.from(payload);
  mutated[pos] = mutated[pos] ^ 0x01; // Flip least significant bit

  return {
    artifact: mutated,
    expectedErrorCode: expectedCode,
    attackDescription: `Bitflip at position ${pos} (byte 0x${payload[pos].toString(16)} → 0x${mutated[pos].toString(16)})`,
    attackCategory: 'bitflip',
  };
}

/**
 * Performs multiple bitflips across the payload.
 */
export function multiplebitflips(
  payload: Buffer,
  count: number = 3,
  expectedCode: string = 'CASEFILE_CORRUPT'
): AttackResult<Buffer> {
  const mutated = Buffer.from(payload);
  const positions: number[] = [];

  for (let i = 0; i < count; i++) {
    const pos = Math.floor((payload.length / (count + 1)) * (i + 1));
    positions.push(pos);
    mutated[pos] = mutated[pos] ^ 0xff; // Flip all bits
  }

  return {
    artifact: mutated,
    expectedErrorCode: expectedCode,
    attackDescription: `Multiple bitflips at positions ${positions.join(', ')}`,
    attackCategory: 'bitflip',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization Defense Test
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reorders JSON keys to test canonicalization.
 * This should NOT trigger any error if canonicalization is working.
 * Expected: PASS (no error)
 */
export function reorderJsonKeysAttack<T extends Record<string, unknown>>(obj: T): AttackResult<T> {
  return {
    artifact: reorderJsonKeys(obj),
    expectedErrorCode: 'NONE', // Should NOT fail
    attackDescription: 'Reordered JSON keys to test canonicalization defense',
    attackCategory: 'canonicalization',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Triplet Parity Attacks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes signature file from triplet.
 * Expected failure: TRIPLET_MISSING
 */
export function removeSignature(
  seals: Record<string, Buffer>,
  artifact: string
): AttackResult<Record<string, Buffer>> {
  const { [`${artifact}.sig`]: _, ...rest } = seals;
  return {
    artifact: rest,
    expectedErrorCode: 'TRIPLET_MISSING',
    attackDescription: `Removed ${artifact}.sig to break triplet parity`,
    attackCategory: 'asset-swap',
  };
}

/**
 * Removes certificate file from triplet.
 * Expected failure: TRIPLET_MISSING
 */
export function removeCertificate(
  seals: Record<string, Buffer>,
  artifact: string
): AttackResult<Record<string, Buffer>> {
  const { [`${artifact}.crt`]: _, ...rest } = seals;
  return {
    artifact: rest,
    expectedErrorCode: 'TRIPLET_MISSING',
    attackDescription: `Removed ${artifact}.crt to break triplet parity`,
    attackCategory: 'asset-swap',
  };
}

/**
 * Removes bundle file from triplet.
 * Expected failure: TRIPLET_MISSING
 */
export function removeBundle(
  seals: Record<string, Buffer>,
  artifact: string
): AttackResult<Record<string, Buffer>> {
  const { [`${artifact}.bundle`]: _, ...rest } = seals;
  return {
    artifact: rest,
    expectedErrorCode: 'TRIPLET_MISSING',
    attackDescription: `Removed ${artifact}.bundle to break triplet parity`,
    attackCategory: 'asset-swap',
  };
}

/**
 * Mutates signature content.
 * Expected failure: SIGNATURE_INVALID
 */
export function mutateSignature(
  seals: Record<string, Buffer>,
  artifact: string
): AttackResult<Record<string, Buffer>> {
  const sigKey = `${artifact}.sig`;
  const original = seals[sigKey];
  if (!original) {
    throw new Error(`Signature ${sigKey} not found`);
  }

  return {
    artifact: {
      ...seals,
      [sigKey]: Buffer.from('INVALID_SIGNATURE_' + original.toString('base64').slice(0, 50)),
    },
    expectedErrorCode: 'SIGNATURE_INVALID',
    attackDescription: `Mutated ${sigKey} content to invalid signature`,
    attackCategory: 'hash-tampering',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Attack Suite Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a comprehensive attack suite for a given artifact set.
 */
export function generateAttackSuite(
  artifacts: TestCasefileArtifact,
  ledgerSnapshot: TestLedgerSnapshot,
  ledgerHead: TestLedgerHead
): Array<{
  name: string;
  category: AttackCategory;
  expectedCode: string;
  execute: () => unknown;
}> {
  return [
    {
      name: 'swap-casefile-keep-manifest',
      category: 'asset-swap',
      expectedCode: 'CASEFILE_HASH_MISMATCH',
      execute: () => swapCasefileKeepManifest(artifacts, Buffer.from('FAKE')),
    },
    {
      name: 'swap-manifest-keep-casefile',
      category: 'asset-swap',
      expectedCode: 'MANIFEST_HASH_MISMATCH',
      execute: () => swapManifestKeepCasefile(artifacts, Buffer.from('FAKE')),
    },
    {
      name: 'mutate-ledger-head-hash',
      category: 'hash-tampering',
      expectedCode: 'LEDGER_HASH_MISMATCH',
      execute: () => mutateLedgerHeadHash(ledgerHead),
    },
    {
      name: 'break-chain-continuity',
      category: 'chain-tampering',
      expectedCode: 'LEDGER_CHAIN_BROKEN',
      execute: () => breakChainContinuity(ledgerSnapshot),
    },
    {
      name: 'create-sequence-gap',
      category: 'chain-tampering',
      expectedCode: 'LEDGER_SEQUENCE_GAP',
      execute: () => createSequenceGap(ledgerSnapshot),
    },
    {
      name: 'spoof-repo-id',
      category: 'identity-tampering',
      expectedCode: 'REPO_ID_MISMATCH',
      execute: () => spoofRepoId(ledgerSnapshot),
    },
    {
      name: 'spoof-repo-slug',
      category: 'identity-tampering',
      expectedCode: 'REPO_SLUG_MISMATCH',
      execute: () => spoofRepoSlug(ledgerSnapshot),
    },
    {
      name: 'spoof-default-branch',
      category: 'identity-tampering',
      expectedCode: 'DEFAULT_BRANCH_MISMATCH',
      execute: () => spoofDefaultBranch(ledgerSnapshot),
    },
    {
      name: 'bitflip-casefile',
      category: 'bitflip',
      expectedCode: 'CASEFILE_CORRUPT',
      execute: () => bitflipPayload(artifacts['casefile.zip']),
    },
    {
      name: 'reorder-json-keys',
      category: 'canonicalization',
      expectedCode: 'NONE',
      execute: () => reorderJsonKeysAttack(ledgerSnapshot),
    },
  ];
}
