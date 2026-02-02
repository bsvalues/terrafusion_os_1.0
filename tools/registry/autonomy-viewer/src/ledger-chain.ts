/**
 * Phase 4N41 — Append-Only Ledger Chain (Hash-Chained Log)
 *
 * Provides deterministic canonicalization, hash computation, and chain validation
 * for the evidence ledger. This module enables cryptographically provable
 * append-only semantics for government audit trails.
 *
 * Key Invariants:
 *   1. Same inputs → identical canonical bytes → identical hash
 *   2. Ledger snapshots form a hash chain via previousLedgerSha256
 *   3. Each ledger-head.json points to current head of the chain
 *   4. Repo identity is bound and verified to prevent fork/spoof attacks
 *
 * Usage:
 *   import { canonicalizeLedger, computeLedgerSha256, validateLedgerChain } from './ledger-chain.js';
 */

import * as crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

export const LEDGER_CHAIN_SCHEMA = 'terrafusion.autonomy.ledger-chain.v1';
export const LEDGER_HEAD_SCHEMA = 'terrafusion.autonomy.ledger-head.v1';
export const LEDGER_CHAIN_TOOL_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Repo Identity (fork/spoof protection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stable repository identity for fork/spoof detection.
 * Bound to numeric ID + slug + default branch for maximum stability.
 */
export interface RepoIdentity {
  /** GitHub repository numeric ID (stable across renames) */
  repoId: number;
  /** Repository slug (owner/repo) */
  ownerRepo: string;
  /** Default branch (e.g., "main") */
  defaultBranch: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Ledger Snapshot Chaining
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chain metadata embedded in each ledger snapshot.
 * Enables cryptographic proof of append-only semantics.
 */
export interface LedgerChainInfo {
  /** Schema identifier for this chain metadata */
  $schema: typeof LEDGER_CHAIN_SCHEMA;
  /** SHA256 of the canonicalized ledger snapshot (self-hash) */
  ledgerSha256: string;
  /** SHA256 of the previous ledger snapshot (null for genesis) */
  previousLedgerSha256: string | null;
  /** Generation timestamp (UTC ISO8601) */
  generatedAt: string;
  /** Stable repository identity */
  repoIdentity: RepoIdentity;
  /** Monotonic sequence number (0 for genesis) */
  sequenceNumber: number;
}

/**
 * Ledger head pointer (signed artifact).
 * Points to the current head of the append-only chain.
 */
export interface LedgerHead {
  /** Schema identifier */
  $schema: typeof LEDGER_HEAD_SCHEMA;
  /** Tool version that generated this head */
  toolVersion: string;
  /** Generation timestamp (UTC ISO8601) */
  generatedAt: string;
  /** SHA256 of the current head ledger snapshot */
  headLedgerSha256: string;
  /** Release tag of the current head */
  headReleaseTag: string;
  /** SHA256 of the casefile at head (binds to casefile chain) */
  headCasefileSha256: string;
  /** Sequence number of the head */
  headSequenceNumber: number;
  /** Stable repository identity (must match ledger) */
  repoIdentity: RepoIdentity;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Chain Validation Results
// ─────────────────────────────────────────────────────────────────────────────

export type LedgerChainErrorCode =
  | 'LEDGER_CHAIN_BROKEN'
  | 'LEDGER_HEAD_MISSING'
  | 'LEDGER_HEAD_INVALID'
  | 'LEDGER_HASH_MISMATCH'
  | 'LEDGER_SEQUENCE_GAP'
  | 'REPO_ID_MISMATCH'
  | 'REPO_SLUG_MISMATCH'
  | 'DEFAULT_BRANCH_MISMATCH'
  | 'CANONICALIZATION_ERROR';

export interface LedgerChainError {
  code: LedgerChainErrorCode;
  message: string;
  expected?: string;
  actual?: string;
}

export interface LedgerChainValidationResult {
  ok: boolean;
  chainLength: number;
  headSha256: string | null;
  previousSha256: string | null;
  sequenceNumber: number;
  repoIdentity: RepoIdentity | null;
  errors: LedgerChainError[];
}

export interface RepoIdentityCheckResult {
  ok: boolean;
  expected: RepoIdentity | null;
  actual: RepoIdentity | null;
  errors: LedgerChainError[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization: Deterministic Serialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fields excluded from canonicalization (volatile/computed after hash).
 * The ledgerSha256 is excluded because it's the result of hashing the canonical form.
 */
const EXCLUDED_FIELDS = new Set(['ledgerSha256']);

/**
 * Recursively sorts object keys alphabetically for deterministic serialization.
 * Arrays preserve order; primitives pass through unchanged.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    if (!EXCLUDED_FIELDS.has(key)) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
  }

  return sorted;
}

/**
 * Canonicalizes a ledger snapshot for deterministic hashing.
 *
 * Rules:
 *   1. Keys sorted alphabetically (recursive)
 *   2. No pretty-printing (compact JSON)
 *   3. Excluded fields removed before serialization
 *   4. UTF-8 encoding with no BOM
 *   5. No trailing newline
 *
 * @param snapshot The ledger snapshot object to canonicalize
 * @returns Canonical JSON string (UTF-8 bytes)
 */
export function canonicalizeLedger(snapshot: Record<string, unknown>): string {
  const sorted = sortObjectKeys(snapshot);
  return JSON.stringify(sorted);
}

/**
 * Computes SHA256 hash of canonical ledger bytes.
 *
 * @param snapshot The ledger snapshot object
 * @returns SHA256 hex string (lowercase)
 */
export function computeLedgerSha256(snapshot: Record<string, unknown>): string {
  const canonical = canonicalizeLedger(snapshot);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Computes SHA256 hash of arbitrary bytes.
 *
 * @param data Buffer or string to hash
 * @returns SHA256 hex string (lowercase)
 */
export function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Validation: Continuity Proofs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates repo identity match between two sources.
 *
 * @param expected Expected repo identity (from policy/index)
 * @param actual Actual repo identity (from ledger/casefile)
 * @returns Validation result with specific mismatch errors
 */
export function validateRepoIdentity(
  expected: RepoIdentity | null,
  actual: RepoIdentity | null
): RepoIdentityCheckResult {
  if (!expected || !actual) {
    return {
      ok: !expected && !actual,
      expected,
      actual,
      errors:
        expected || actual
          ? [
              {
                code: expected ? 'REPO_ID_MISMATCH' : 'REPO_SLUG_MISMATCH',
                message: 'Repo identity missing on one side',
                expected: expected ? JSON.stringify(expected) : 'null',
                actual: actual ? JSON.stringify(actual) : 'null',
              },
            ]
          : [],
    };
  }

  const errors: LedgerChainError[] = [];

  if (expected.repoId !== actual.repoId) {
    errors.push({
      code: 'REPO_ID_MISMATCH',
      message: `Repo ID mismatch: expected ${expected.repoId}, got ${actual.repoId}`,
      expected: String(expected.repoId),
      actual: String(actual.repoId),
    });
  }

  if (expected.ownerRepo !== actual.ownerRepo) {
    errors.push({
      code: 'REPO_SLUG_MISMATCH',
      message: `Repo slug mismatch: expected ${expected.ownerRepo}, got ${actual.ownerRepo}`,
      expected: expected.ownerRepo,
      actual: actual.ownerRepo,
    });
  }

  if (expected.defaultBranch !== actual.defaultBranch) {
    errors.push({
      code: 'DEFAULT_BRANCH_MISMATCH',
      message: `Default branch mismatch: expected ${expected.defaultBranch}, got ${actual.defaultBranch}`,
      expected: expected.defaultBranch,
      actual: actual.defaultBranch,
    });
  }

  return {
    ok: errors.length === 0,
    expected,
    actual,
    errors,
  };
}

/**
 * Validates that two consecutive ledger snapshots form a valid chain link.
 *
 * @param current Current ledger snapshot (includes chain info)
 * @param previous Previous ledger snapshot (or null for genesis)
 * @returns Validation result with chain status
 */
export function validateChainLink(
  current: { chain?: LedgerChainInfo } & Record<string, unknown>,
  previous: ({ chain?: LedgerChainInfo } & Record<string, unknown>) | null
): LedgerChainValidationResult {
  const errors: LedgerChainError[] = [];

  const currentChain = current.chain;

  if (!currentChain) {
    return {
      ok: false,
      chainLength: 0,
      headSha256: null,
      previousSha256: null,
      sequenceNumber: -1,
      repoIdentity: null,
      errors: [
        {
          code: 'LEDGER_CHAIN_BROKEN',
          message: 'Current snapshot missing chain metadata',
        },
      ],
    };
  }

  // Genesis case: previousLedgerSha256 must be null and sequenceNumber must be 0
  if (previous === null) {
    if (currentChain.previousLedgerSha256 !== null) {
      errors.push({
        code: 'LEDGER_CHAIN_BROKEN',
        message: 'Genesis snapshot has non-null previousLedgerSha256',
        expected: 'null',
        actual: currentChain.previousLedgerSha256,
      });
    }

    if (currentChain.sequenceNumber !== 0) {
      errors.push({
        code: 'LEDGER_SEQUENCE_GAP',
        message: `Genesis snapshot has sequenceNumber ${currentChain.sequenceNumber}, expected 0`,
        expected: '0',
        actual: String(currentChain.sequenceNumber),
      });
    }

    return {
      ok: errors.length === 0,
      chainLength: 1,
      headSha256: currentChain.ledgerSha256,
      previousSha256: null,
      sequenceNumber: currentChain.sequenceNumber,
      repoIdentity: currentChain.repoIdentity,
      errors,
    };
  }

  // Non-genesis: verify chain link
  const previousChain = previous.chain;

  if (!previousChain) {
    errors.push({
      code: 'LEDGER_CHAIN_BROKEN',
      message: 'Previous snapshot missing chain metadata',
    });
    return {
      ok: false,
      chainLength: 1,
      headSha256: currentChain.ledgerSha256,
      previousSha256: currentChain.previousLedgerSha256,
      sequenceNumber: currentChain.sequenceNumber,
      repoIdentity: currentChain.repoIdentity,
      errors,
    };
  }

  // Verify previousLedgerSha256 matches previous snapshot's ledgerSha256
  if (currentChain.previousLedgerSha256 !== previousChain.ledgerSha256) {
    errors.push({
      code: 'LEDGER_CHAIN_BROKEN',
      message: 'previousLedgerSha256 does not match previous ledger hash',
      expected: previousChain.ledgerSha256,
      actual: currentChain.previousLedgerSha256 ?? 'null',
    });
  }

  // Verify sequence continuity
  if (currentChain.sequenceNumber !== previousChain.sequenceNumber + 1) {
    errors.push({
      code: 'LEDGER_SEQUENCE_GAP',
      message: `Sequence gap: expected ${previousChain.sequenceNumber + 1}, got ${currentChain.sequenceNumber}`,
      expected: String(previousChain.sequenceNumber + 1),
      actual: String(currentChain.sequenceNumber),
    });
  }

  // Verify repo identity continuity
  const repoCheck = validateRepoIdentity(previousChain.repoIdentity, currentChain.repoIdentity);
  errors.push(...repoCheck.errors);

  return {
    ok: errors.length === 0,
    chainLength: currentChain.sequenceNumber + 1,
    headSha256: currentChain.ledgerSha256,
    previousSha256: currentChain.previousLedgerSha256,
    sequenceNumber: currentChain.sequenceNumber,
    repoIdentity: currentChain.repoIdentity,
    errors,
  };
}

/**
 * Validates the ledger head pointer against a ledger snapshot.
 *
 * @param head The ledger head pointer
 * @param ledger The ledger snapshot that should be the head
 * @returns Validation result
 */
export function validateLedgerHead(
  head: LedgerHead,
  ledger: { chain?: LedgerChainInfo } & Record<string, unknown>
): LedgerChainValidationResult {
  const errors: LedgerChainError[] = [];

  if (!ledger.chain) {
    return {
      ok: false,
      chainLength: 0,
      headSha256: head.headLedgerSha256,
      previousSha256: null,
      sequenceNumber: head.headSequenceNumber,
      repoIdentity: head.repoIdentity,
      errors: [
        {
          code: 'LEDGER_HEAD_INVALID',
          message: 'Ledger snapshot missing chain metadata',
        },
      ],
    };
  }

  // Verify head points to correct ledger hash
  if (head.headLedgerSha256 !== ledger.chain.ledgerSha256) {
    errors.push({
      code: 'LEDGER_HASH_MISMATCH',
      message: 'Head pointer does not match ledger hash',
      expected: head.headLedgerSha256,
      actual: ledger.chain.ledgerSha256,
    });
  }

  // Verify sequence number matches
  if (head.headSequenceNumber !== ledger.chain.sequenceNumber) {
    errors.push({
      code: 'LEDGER_SEQUENCE_GAP',
      message: `Head sequence ${head.headSequenceNumber} does not match ledger sequence ${ledger.chain.sequenceNumber}`,
      expected: String(head.headSequenceNumber),
      actual: String(ledger.chain.sequenceNumber),
    });
  }

  // Verify repo identity
  const repoCheck = validateRepoIdentity(head.repoIdentity, ledger.chain.repoIdentity);
  errors.push(...repoCheck.errors);

  return {
    ok: errors.length === 0,
    chainLength: ledger.chain.sequenceNumber + 1,
    headSha256: ledger.chain.ledgerSha256,
    previousSha256: ledger.chain.previousLedgerSha256,
    sequenceNumber: ledger.chain.sequenceNumber,
    repoIdentity: ledger.chain.repoIdentity,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates chain info for a new ledger snapshot.
 *
 * @param params Chain parameters
 * @returns Chain info with computed ledgerSha256
 */
export function createChainInfo(params: {
  previousLedgerSha256: string | null;
  repoIdentity: RepoIdentity;
  sequenceNumber: number;
  snapshot: Record<string, unknown>;
}): LedgerChainInfo {
  const now = new Date().toISOString();

  // Build chain info without ledgerSha256 (will be computed)
  const chainInfo: Omit<LedgerChainInfo, 'ledgerSha256'> = {
    $schema: LEDGER_CHAIN_SCHEMA,
    previousLedgerSha256: params.previousLedgerSha256,
    generatedAt: now,
    repoIdentity: params.repoIdentity,
    sequenceNumber: params.sequenceNumber,
  };

  // Compute ledgerSha256 from snapshot with chain info embedded
  const snapshotWithChain = {
    ...params.snapshot,
    chain: chainInfo,
  };

  const ledgerSha256 = computeLedgerSha256(snapshotWithChain);

  return {
    ...chainInfo,
    ledgerSha256,
  };
}

/**
 * Creates a ledger head pointer for the given ledger snapshot.
 *
 * @param params Head parameters
 * @returns Ledger head object
 */
export function createLedgerHead(params: {
  ledger: { chain: LedgerChainInfo } & Record<string, unknown>;
  releaseTag: string;
  casefileSha256: string;
}): LedgerHead {
  return {
    $schema: LEDGER_HEAD_SCHEMA,
    toolVersion: LEDGER_CHAIN_TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    headLedgerSha256: params.ledger.chain.ledgerSha256,
    headReleaseTag: params.releaseTag,
    headCasefileSha256: params.casefileSha256,
    headSequenceNumber: params.ledger.chain.sequenceNumber,
    repoIdentity: params.ledger.chain.repoIdentity,
  };
}
