/**
 * Phase 4N44e – Rollup Compaction Contract Tests
 * ===============================================
 *
 * TDD-first tests for monthly rollups preserving hash chain continuity.
 *
 * Invariants:
 *   - Monthly rollups keep previousLedgerSha256 chain intact
 *   - Rollups are additive references, never history rewrites
 *   - Verifier accepts rollup chain proofs
 */

import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

import {
    addEntryToRollup,
    createMonthlyRollup,
    finalizeRollup,
    linkRollups,
    ROLLUP_SCHEMA,
    ROLLUP_VERSION,
    verifyRollupChain,
    type LedgerEntryRef,
    type LedgerRollup
} from '../src/rollup.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Rollup Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Rollup Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(ROLLUP_SCHEMA, 'terrafusion.autonomy.ledger-rollup.v1');
  });

  it('version is 4N44.1', () => {
    assert.strictEqual(ROLLUP_VERSION, '4N44.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Monthly Rollup Creation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Monthly Rollup Creation', () => {
  it('createMonthlyRollup produces valid structure', () => {
    const rollup = createMonthlyRollup({
      year: 2024,
      month: 6,
      previousRollupSha256: null,
    });

    assert.strictEqual(rollup.$schema, ROLLUP_SCHEMA);
    assert.strictEqual(rollup.period, '2024-06');
    assert.strictEqual(rollup.entries.length, 0);
    assert.strictEqual(rollup.previousRollupSha256, null);
  });

  it('addEntryToRollup appends entry reference', () => {
    const rollup = createMonthlyRollup({ year: 2024, month: 6 });

    const entry: LedgerEntryRef = {
      sequenceNumber: 1,
      sha256: sha256('entry-1'),
      recordId: 'run-12345',
      timestamp: '2024-06-15T10:00:00Z',
    };

    const updated = addEntryToRollup(rollup, entry);

    assert.strictEqual(updated.entries.length, 1);
    assert.strictEqual(updated.entries[0].sequenceNumber, 1);
  });

  it('entries are ordered by sequence number', () => {
    let rollup = createMonthlyRollup({ year: 2024, month: 6 });

    rollup = addEntryToRollup(rollup, {
      sequenceNumber: 3,
      sha256: sha256('entry-3'),
      recordId: 'run-3',
      timestamp: '2024-06-15T12:00:00Z',
    });

    rollup = addEntryToRollup(rollup, {
      sequenceNumber: 1,
      sha256: sha256('entry-1'),
      recordId: 'run-1',
      timestamp: '2024-06-15T10:00:00Z',
    });

    rollup = addEntryToRollup(rollup, {
      sequenceNumber: 2,
      sha256: sha256('entry-2'),
      recordId: 'run-2',
      timestamp: '2024-06-15T11:00:00Z',
    });

    // After finalization, entries should be sorted
    const finalized = finalizeRollup(rollup);

    assert.strictEqual(finalized.entries[0].sequenceNumber, 1);
    assert.strictEqual(finalized.entries[1].sequenceNumber, 2);
    assert.strictEqual(finalized.entries[2].sequenceNumber, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Hash Chain Preservation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Hash Chain Preservation', () => {
  it('monthly rollup preserves hash chain head', () => {
    const rollup = createMonthlyRollup({
      year: 2024,
      month: 6,
      previousRollupSha256: null,
    });

    // Add entries with chain hashes
    const entry1: LedgerEntryRef = {
      sequenceNumber: 1,
      sha256: sha256('entry-1'),
      recordId: 'run-1',
      timestamp: '2024-06-01T00:00:00Z',
      previousSha256: null,
    };

    const entry2: LedgerEntryRef = {
      sequenceNumber: 2,
      sha256: sha256('entry-2'),
      recordId: 'run-2',
      timestamp: '2024-06-02T00:00:00Z',
      previousSha256: entry1.sha256,
    };

    let updated = addEntryToRollup(rollup, entry1);
    updated = addEntryToRollup(updated, entry2);
    const finalized = finalizeRollup(updated);

    // The rollup should record the head (last entry's hash)
    assert.strictEqual(finalized.headSha256, entry2.sha256);
    assert.strictEqual(finalized.entryCount, 2);
  });

  it('rollup references prior ledgers by hash', () => {
    // Create May rollup
    const mayRollup = createMonthlyRollup({ year: 2024, month: 5 });
    const mayEntry: LedgerEntryRef = {
      sequenceNumber: 1,
      sha256: sha256('may-entry'),
      recordId: 'may-run',
      timestamp: '2024-05-15T00:00:00Z',
    };
    const mayFinalized = finalizeRollup(addEntryToRollup(mayRollup, mayEntry));

    // Create June rollup linking to May
    const juneRollup = createMonthlyRollup({
      year: 2024,
      month: 6,
      previousRollupSha256: mayFinalized.rollupSha256,
    });

    assert.strictEqual(juneRollup.previousRollupSha256, mayFinalized.rollupSha256);
  });

  it('linkRollups creates valid chain', () => {
    const rollups: LedgerRollup[] = [];

    // Create 3 months of rollups
    for (let m = 4; m <= 6; m++) {
      const rollup = createMonthlyRollup({
        year: 2024,
        month: m,
        previousRollupSha256: rollups.length > 0 ? rollups[rollups.length - 1].rollupSha256 : null,
      });
      rollups.push(finalizeRollup(rollup));
    }

    const chain = linkRollups(rollups);

    assert.strictEqual(chain.rollups.length, 3);
    assert.strictEqual(chain.headSha256, rollups[2].rollupSha256);
    assert.strictEqual(chain.tailSha256, rollups[0].rollupSha256);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Rollup Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Rollup Verification', () => {
  it('verifier accepts valid rollup chain', () => {
    const rollups: LedgerRollup[] = [];

    // Create chain of 3 rollups
    for (let m = 1; m <= 3; m++) {
      let rollup = createMonthlyRollup({
        year: 2024,
        month: m,
        previousRollupSha256: rollups.length > 0 ? rollups[rollups.length - 1].rollupSha256 : null,
      });

      rollup = addEntryToRollup(rollup, {
        sequenceNumber: m,
        sha256: sha256(`entry-${m}`),
        recordId: `run-${m}`,
        timestamp: `2024-0${m}-15T00:00:00Z`,
      });

      rollups.push(finalizeRollup(rollup));
    }

    const chain = linkRollups(rollups);
    const result = verifyRollupChain(chain);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('verifier rejects broken chain', () => {
    // Create two rollups that don't link
    const rollup1 = finalizeRollup(createMonthlyRollup({ year: 2024, month: 1 }));
    const rollup2 = finalizeRollup(
      createMonthlyRollup({
        year: 2024,
        month: 2,
        previousRollupSha256: 'wrong-hash-not-matching-rollup1',
      })
    );

    const chain = linkRollups([rollup1, rollup2]);
    const result = verifyRollupChain(chain);

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.code === 'CHAIN_BROKEN'));
  });

  it('verifier detects missing rollup in sequence', () => {
    // Create rollups for months 1 and 3 (skipping 2)
    const rollup1 = finalizeRollup(createMonthlyRollup({ year: 2024, month: 1 }));
    const rollup3 = finalizeRollup(
      createMonthlyRollup({
        year: 2024,
        month: 3,
        previousRollupSha256: rollup1.rollupSha256,
      })
    );

    const chain = linkRollups([rollup1, rollup3]);
    const result = verifyRollupChain(chain);

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.code === 'PERIOD_GAP'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Rollup Immutability
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Rollup Immutability', () => {
  it('finalized rollup has stable hash', () => {
    let rollup = createMonthlyRollup({ year: 2024, month: 6 });
    rollup = addEntryToRollup(rollup, {
      sequenceNumber: 1,
      sha256: sha256('entry'),
      recordId: 'run',
      timestamp: '2024-06-15T00:00:00Z',
    });

    const finalized1 = finalizeRollup(rollup);
    const finalized2 = finalizeRollup(rollup);

    assert.strictEqual(finalized1.rollupSha256, finalized2.rollupSha256);
  });

  it('different entries produce different rollup hash', () => {
    let rollup1 = createMonthlyRollup({ year: 2024, month: 6 });
    rollup1 = addEntryToRollup(rollup1, {
      sequenceNumber: 1,
      sha256: sha256('entry-a'),
      recordId: 'run-a',
      timestamp: '2024-06-15T00:00:00Z',
    });

    let rollup2 = createMonthlyRollup({ year: 2024, month: 6 });
    rollup2 = addEntryToRollup(rollup2, {
      sequenceNumber: 1,
      sha256: sha256('entry-b'),
      recordId: 'run-b',
      timestamp: '2024-06-15T00:00:00Z',
    });

    const finalized1 = finalizeRollup(rollup1);
    const finalized2 = finalizeRollup(rollup2);

    assert.notStrictEqual(finalized1.rollupSha256, finalized2.rollupSha256);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44e – Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44e – Rollup Edge Cases', () => {
  it('empty rollup is valid', () => {
    const rollup = finalizeRollup(createMonthlyRollup({ year: 2024, month: 6 }));

    assert.strictEqual(rollup.entryCount, 0);
    assert.strictEqual(rollup.entries.length, 0);
    assert.ok(rollup.rollupSha256); // Still has a hash
  });

  it('single-month chain is valid', () => {
    const rollup = finalizeRollup(createMonthlyRollup({ year: 2024, month: 1 }));
    const chain = linkRollups([rollup]);
    const result = verifyRollupChain(chain);

    assert.strictEqual(result.ok, true);
  });

  it('rollup preserves entry order within month', () => {
    let rollup = createMonthlyRollup({ year: 2024, month: 6 });

    // Add entries in reverse order
    for (let i = 10; i >= 1; i--) {
      rollup = addEntryToRollup(rollup, {
        sequenceNumber: i,
        sha256: sha256(`entry-${i}`),
        recordId: `run-${i}`,
        timestamp: `2024-06-${String(i).padStart(2, '0')}T00:00:00Z`,
      });
    }

    const finalized = finalizeRollup(rollup);

    // Should be sorted by sequence number
    for (let i = 0; i < finalized.entries.length - 1; i++) {
      assert.ok(finalized.entries[i].sequenceNumber < finalized.entries[i + 1].sequenceNumber);
    }
  });
});
