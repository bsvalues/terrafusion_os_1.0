/**
 * Phase 4N41 – Ledger Chain Contract Tests
 * =========================================
 *
 * Tests for append-only ledger semantics with hash-chained snapshots.
 *
 * Test Groups:
 *   1. Canonicalization - Deterministic serialization
 *   2. Hash Computation - SHA256 of canonical bytes
 *   3. Chain Validation - Link integrity
 *   4. Genesis Case - Null previous hash
 *   5. Repo Identity - Fork/spoof detection
 *   6. Attack Detection - Truncation, divergence, swap
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    canonicalizeLedger,
    computeLedgerSha256,
    createChainInfo,
    createLedgerHead,
    LEDGER_CHAIN_SCHEMA,
    LEDGER_HEAD_SCHEMA,
    type LedgerChainInfo,
    type LedgerHead,
    type RepoIdentity,
    validateChainLink,
    validateLedgerHead,
    validateRepoIdentity,
} from '../src/ledger-chain.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createMockRepoIdentity(): RepoIdentity {
  return {
    repoId: 123456789,
    ownerRepo: 'terrafusion-platform/terrafusion_os_1.0',
    defaultBranch: 'main',
  };
}

function createMockLedgerSnapshot(
  overrides: Partial<{
    chain: LedgerChainInfo;
    entries: unknown[];
    summary: unknown;
  }> = {}
): Record<string, unknown> {
  return {
    schema: 'terrafusion.autonomy.evidence.ledger.v1',
    generatedAt: '2026-01-15T12:00:00.000Z',
    entries: overrides.entries ?? [],
    summary: overrides.summary ?? { total: 0 },
    chain: overrides.chain,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Canonicalization (Deterministic Serialization)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Canonicalization', () => {
  it('produces identical output for objects with same content', () => {
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, z: 1, m: 3 };
    const obj3 = { m: 3, z: 1, a: 2 };

    const canonical1 = canonicalizeLedger(obj1);
    const canonical2 = canonicalizeLedger(obj2);
    const canonical3 = canonicalizeLedger(obj3);

    assert.equal(canonical1, canonical2, 'Same content must produce identical canonical form');
    assert.equal(canonical2, canonical3, 'Key order in input must not affect output');
  });

  it('sorts keys alphabetically in output', () => {
    const obj = { zebra: 1, alpha: 2, middle: 3 };
    const canonical = canonicalizeLedger(obj);

    assert.equal(canonical, '{"alpha":2,"middle":3,"zebra":1}');
  });

  it('handles nested objects with consistent ordering', () => {
    const obj = {
      outer: { z: 1, a: 2 },
      another: { b: 3, a: 4 },
    };
    const canonical = canonicalizeLedger(obj);

    assert.equal(canonical, '{"another":{"a":4,"b":3},"outer":{"a":2,"z":1}}');
  });

  it('preserves array order', () => {
    const obj = { arr: [3, 1, 2] };
    const canonical = canonicalizeLedger(obj);

    assert.equal(canonical, '{"arr":[3,1,2]}');
  });

  it('excludes ledgerSha256 field (computed after canonicalization)', () => {
    const obj = { ledgerSha256: 'abc123', data: 'test' };
    const canonical = canonicalizeLedger(obj);

    assert.equal(canonical, '{"data":"test"}');
    assert.ok(!canonical.includes('ledgerSha256'));
  });

  it('produces compact JSON without whitespace', () => {
    const obj = { a: 1, b: { c: 2 } };
    const canonical = canonicalizeLedger(obj);

    assert.ok(!canonical.includes(' '));
    assert.ok(!canonical.includes('\n'));
  });

  it('handles null and undefined values', () => {
    const obj = { a: null, b: undefined, c: 1 };
    const canonical = canonicalizeLedger(obj);

    // undefined is omitted by JSON.stringify
    assert.equal(canonical, '{"a":null,"c":1}');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Hash Computation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Hash Computation', () => {
  it('produces consistent hash for same input (10x)', () => {
    const obj = { data: 'test', value: 42 };
    const hashes: string[] = [];

    for (let i = 0; i < 10; i++) {
      hashes.push(computeLedgerSha256(obj));
    }

    const first = hashes[0];
    for (const hash of hashes) {
      assert.equal(hash, first, 'Same input must produce identical hash');
    }
  });

  it('produces valid SHA256 hex string', () => {
    const obj = { test: 'data' };
    const hash = computeLedgerSha256(obj);

    assert.match(hash, /^[a-f0-9]{64}$/i);
  });

  it('different inputs produce different hashes', () => {
    const obj1 = { data: 'test1' };
    const obj2 = { data: 'test2' };

    const hash1 = computeLedgerSha256(obj1);
    const hash2 = computeLedgerSha256(obj2);

    assert.notEqual(hash1, hash2);
  });

  it('key order does not affect hash', () => {
    const obj1 = { z: 1, a: 2 };
    const obj2 = { a: 2, z: 1 };

    const hash1 = computeLedgerSha256(obj1);
    const hash2 = computeLedgerSha256(obj2);

    assert.equal(hash1, hash2, 'Canonicalization must normalize key order before hashing');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Genesis Case
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Genesis Case', () => {
  it('genesis has null previousLedgerSha256', () => {
    const chainInfo = createChainInfo({
      previousLedgerSha256: null,
      repoIdentity: createMockRepoIdentity(),
      sequenceNumber: 0,
      snapshot: createMockLedgerSnapshot(),
    });

    assert.equal(chainInfo.previousLedgerSha256, null);
    assert.equal(chainInfo.sequenceNumber, 0);
    assert.ok(chainInfo.ledgerSha256);
  });

  it('genesis validation succeeds with null previous', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'abc123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const snapshot = createMockLedgerSnapshot({ chain: chainInfo });
    const result = validateChainLink(snapshot, null);

    assert.equal(result.ok, true);
    assert.equal(result.chainLength, 1);
    assert.equal(result.sequenceNumber, 0);
  });

  it('genesis validation fails with non-null previousLedgerSha256', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'abc123',
      previousLedgerSha256: 'not-null',
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const snapshot = createMockLedgerSnapshot({ chain: chainInfo });
    const result = validateChainLink(snapshot, null);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_CHAIN_BROKEN');
    assert.ok(error);
  });

  it('genesis validation fails with non-zero sequence number', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'abc123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 5,
    };

    const snapshot = createMockLedgerSnapshot({ chain: chainInfo });
    const result = validateChainLink(snapshot, null);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_SEQUENCE_GAP');
    assert.ok(error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Chain Continuity
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Chain Continuity', () => {
  it('valid chain link passes validation', () => {
    const repoIdentity = createMockRepoIdentity();

    const prevChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'previous-hash-123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-14T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const currentChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'current-hash-456',
      previousLedgerSha256: 'previous-hash-123',
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 1,
    };

    const prevSnapshot = createMockLedgerSnapshot({ chain: prevChain });
    const currentSnapshot = createMockLedgerSnapshot({ chain: currentChain });

    const result = validateChainLink(currentSnapshot, prevSnapshot);

    assert.equal(result.ok, true);
    assert.equal(result.chainLength, 2);
    assert.equal(result.sequenceNumber, 1);
  });

  it('detects truncation (missing previous)', () => {
    const repoIdentity = createMockRepoIdentity();

    const currentChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'current-hash-456',
      previousLedgerSha256: 'missing-hash-xxx',
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 5,
    };

    const currentSnapshot = createMockLedgerSnapshot({ chain: currentChain });

    // Passing null when previousLedgerSha256 is non-null = truncation
    const result = validateChainLink(currentSnapshot, null);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_CHAIN_BROKEN');
    assert.ok(error);
  });

  it('detects hash mismatch (swap attack)', () => {
    const repoIdentity = createMockRepoIdentity();

    const prevChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'actual-previous-hash',
      previousLedgerSha256: null,
      generatedAt: '2026-01-14T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const currentChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'current-hash-456',
      previousLedgerSha256: 'wrong-previous-hash',
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 1,
    };

    const prevSnapshot = createMockLedgerSnapshot({ chain: prevChain });
    const currentSnapshot = createMockLedgerSnapshot({ chain: currentChain });

    const result = validateChainLink(currentSnapshot, prevSnapshot);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_CHAIN_BROKEN');
    assert.ok(error);
    assert.equal(error?.expected, 'actual-previous-hash');
    assert.equal(error?.actual, 'wrong-previous-hash');
  });

  it('detects sequence gap', () => {
    const repoIdentity = createMockRepoIdentity();

    const prevChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'previous-hash-123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-14T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const currentChain: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'current-hash-456',
      previousLedgerSha256: 'previous-hash-123',
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 5, // Should be 1
    };

    const prevSnapshot = createMockLedgerSnapshot({ chain: prevChain });
    const currentSnapshot = createMockLedgerSnapshot({ chain: currentChain });

    const result = validateChainLink(currentSnapshot, prevSnapshot);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_SEQUENCE_GAP');
    assert.ok(error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Repo Identity (Fork/Spoof Detection)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Repo Identity', () => {
  it('matching repo identity passes validation', () => {
    const expected = createMockRepoIdentity();
    const actual = { ...expected };

    const result = validateRepoIdentity(expected, actual);

    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it('detects repo ID mismatch', () => {
    const expected = createMockRepoIdentity();
    const actual = { ...expected, repoId: 999999999 };

    const result = validateRepoIdentity(expected, actual);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'REPO_ID_MISMATCH');
    assert.ok(error);
  });

  it('detects repo slug mismatch', () => {
    const expected = createMockRepoIdentity();
    const actual = { ...expected, ownerRepo: 'attacker/forked-repo' };

    const result = validateRepoIdentity(expected, actual);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'REPO_SLUG_MISMATCH');
    assert.ok(error);
  });

  it('detects default branch mismatch', () => {
    const expected = createMockRepoIdentity();
    const actual = { ...expected, defaultBranch: 'develop' };

    const result = validateRepoIdentity(expected, actual);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'DEFAULT_BRANCH_MISMATCH');
    assert.ok(error);
  });

  it('reports multiple mismatches simultaneously', () => {
    const expected = createMockRepoIdentity();
    const actual: RepoIdentity = {
      repoId: 999999999,
      ownerRepo: 'attacker/forked-repo',
      defaultBranch: 'develop',
    };

    const result = validateRepoIdentity(expected, actual);

    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Ledger Head Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Ledger Head', () => {
  it('creates valid ledger head', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'ledger-hash-123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const ledger = createMockLedgerSnapshot({ chain: chainInfo });
    const head = createLedgerHead({
      ledger: ledger as { chain: LedgerChainInfo } & Record<string, unknown>,
      releaseTag: 'autonomy-evidence/2026-01',
      casefileSha256: 'casefile-hash-456',
    });

    assert.equal(head.$schema, LEDGER_HEAD_SCHEMA);
    assert.equal(head.headLedgerSha256, 'ledger-hash-123');
    assert.equal(head.headReleaseTag, 'autonomy-evidence/2026-01');
    assert.equal(head.headCasefileSha256, 'casefile-hash-456');
    assert.equal(head.headSequenceNumber, 0);
    assert.deepEqual(head.repoIdentity, repoIdentity);
  });

  it('validates matching head and ledger', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'ledger-hash-123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 5,
    };

    const ledger = createMockLedgerSnapshot({ chain: chainInfo });
    const head: LedgerHead = {
      $schema: LEDGER_HEAD_SCHEMA,
      toolVersion: '1.0.0',
      generatedAt: '2026-01-15T12:00:00.000Z',
      headLedgerSha256: 'ledger-hash-123',
      headReleaseTag: 'autonomy-evidence/2026-01',
      headCasefileSha256: 'casefile-hash-456',
      headSequenceNumber: 5,
      repoIdentity,
    };

    const result = validateLedgerHead(head, ledger);

    assert.equal(result.ok, true);
    assert.equal(result.chainLength, 6);
  });

  it('detects head hash mismatch', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'actual-ledger-hash',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const ledger = createMockLedgerSnapshot({ chain: chainInfo });
    const head: LedgerHead = {
      $schema: LEDGER_HEAD_SCHEMA,
      toolVersion: '1.0.0',
      generatedAt: '2026-01-15T12:00:00.000Z',
      headLedgerSha256: 'wrong-ledger-hash',
      headReleaseTag: 'autonomy-evidence/2026-01',
      headCasefileSha256: 'casefile-hash-456',
      headSequenceNumber: 0,
      repoIdentity,
    };

    const result = validateLedgerHead(head, ledger);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_HASH_MISMATCH');
    assert.ok(error);
  });

  it('detects sequence number mismatch', () => {
    const repoIdentity = createMockRepoIdentity();
    const chainInfo: LedgerChainInfo = {
      $schema: LEDGER_CHAIN_SCHEMA,
      ledgerSha256: 'ledger-hash-123',
      previousLedgerSha256: null,
      generatedAt: '2026-01-15T12:00:00.000Z',
      repoIdentity,
      sequenceNumber: 0,
    };

    const ledger = createMockLedgerSnapshot({ chain: chainInfo });
    const head: LedgerHead = {
      $schema: LEDGER_HEAD_SCHEMA,
      toolVersion: '1.0.0',
      generatedAt: '2026-01-15T12:00:00.000Z',
      headLedgerSha256: 'ledger-hash-123',
      headReleaseTag: 'autonomy-evidence/2026-01',
      headCasefileSha256: 'casefile-hash-456',
      headSequenceNumber: 10,
      repoIdentity,
    };

    const result = validateLedgerHead(head, ledger);

    assert.equal(result.ok, false);
    const error = result.errors.find(e => e.code === 'LEDGER_SEQUENCE_GAP');
    assert.ok(error);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism (Same Input → Same Output)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N41 – Canonicalization Determinism', () => {
  it('produces identical hash across 100 iterations', () => {
    const snapshot = {
      schema: 'test',
      generatedAt: '2026-01-15T12:00:00.000Z',
      entries: [
        { id: 1, data: 'test1' },
        { id: 2, data: 'test2' },
      ],
      nested: {
        z: { deep: 'value' },
        a: { other: 'data' },
      },
    };

    const hashes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      hashes.add(computeLedgerSha256(snapshot));
    }

    assert.equal(hashes.size, 1, 'All iterations must produce identical hash');
  });
});
