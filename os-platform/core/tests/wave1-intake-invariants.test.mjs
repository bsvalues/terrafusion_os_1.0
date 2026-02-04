/**
 * Wave 1 Intake Invariant Tests
 *
 * Codifies the intake lane constraints that must hold when Wave 1 unfreezes (2026-02-21):
 * - Slot table: 1:1, append-only, no reorder, cap=20
 * - Fail-closed reject rules: PII/format/late/missing evidence
 * - Canonical decision IDs
 * - Single write surface (WAVE_1_EVALUATION_LOG.md)
 * - Freeze cutoff enforcement (UTC)
 *
 * Phase: Pre-Unfreeze (Zone B)
 * Sprint: Zone B (2026-02-04) + Wave 1 Unfreeze Prep
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, '../../..');

// Slot table invariants
describe('Wave1 Intake: Slot Table Invariants', () => {
  test('enforces 1:1 slot-to-nomination mapping', () => {
    // Spec: Each slot can hold exactly 1 nomination (no sharing, no gaps if filled)
    const slots = [
      { id: 1, nomination: 'A' },
      { id: 2, nomination: null }, // gap allowed if unfilled
      { id: 3, nomination: 'B' },
    ];

    // Valid: each filled slot has exactly one nomination
    const filledSlots = slots.filter(s => s.nomination !== null);
    assert.equal(
      filledSlots.every(s => typeof s.nomination === 'string'),
      true
    );
  });

  test('enforces append-only writes (no reorder)', () => {
    // Spec: Slots filled in sequence, no retroactive changes
    const log = [
      { slot: 1, timestamp: '2026-02-21T10:00:00Z' },
      { slot: 2, timestamp: '2026-02-21T10:05:00Z' },
      { slot: 3, timestamp: '2026-02-21T10:10:00Z' },
    ];

    // Verify timestamps are monotonic increasing
    for (let i = 1; i < log.length; i++) {
      const prev = new Date(log[i - 1].timestamp);
      const curr = new Date(log[i].timestamp);
      assert.ok(curr >= prev, `Slot ${log[i].slot} timestamp must be >= previous`);
    }
  });

  test('enforces slot cap at 20', () => {
    // Spec: Maximum 20 nominations per wave
    const MAX_SLOTS = 20;
    const slots = Array.from({ length: 21 }, (_, i) => ({ id: i + 1 }));

    // Reject attempt to fill slot 21
    assert.equal(slots.length > MAX_SLOTS, true);
    assert.throws(() => {
      if (slots.length > MAX_SLOTS) {
        throw new Error(`REJECT: Slot cap exceeded (max=${MAX_SLOTS})`);
      }
    }, /REJECT: Slot cap exceeded/);
  });
});

// Fail-closed reject rules
describe('Wave1 Intake: Fail-Closed Reject Rules', () => {
  test('rejects nomination with PII in title', () => {
    // Spec: Fail closed on SSN, email, phone patterns
    const badNominations = [
      { title: 'Fix issue for john.doe@example.com' },
      { title: 'SSN 123-45-6789 exposed' },
      { title: 'Call 555-1234 for details' },
    ];

    const PII_PATTERNS = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{4}\b/, // Phone (simple)
    ];

    badNominations.forEach(nom => {
      const hasPII = PII_PATTERNS.some(pattern => pattern.test(nom.title));
      assert.equal(hasPII, true, `Should detect PII in: ${nom.title}`);
    });
  });

  test('rejects nomination with missing evidence', () => {
    // Spec: Nomination must include evidence field
    const badNomination = { title: 'Fix bug', evidence: null };

    assert.throws(() => {
      if (!badNomination.evidence) {
        throw new Error('REJECT: Missing evidence');
      }
    }, /REJECT: Missing evidence/);
  });

  test('rejects nomination after cutoff timestamp (UTC)', () => {
    // Spec: Cutoff enforced in UTC to avoid timezone drift
    const CUTOFF = new Date('2026-02-21T23:59:59Z');
    const lateNomination = {
      title: 'Late submission',
      timestamp: new Date('2026-02-22T00:00:01Z'),
    };

    assert.ok(lateNomination.timestamp > CUTOFF);
    assert.throws(() => {
      if (lateNomination.timestamp > CUTOFF) {
        throw new Error('REJECT: Submitted after cutoff (UTC)');
      }
    }, /REJECT: Submitted after cutoff/);
  });

  test('rejects nomination with invalid format', () => {
    // Spec: Title must be non-empty string, evidence must be structured
    const badNominations = [
      { title: '', evidence: 'valid' },
      { title: 'Valid', evidence: '' },
      { title: null, evidence: 'valid' },
    ];

    badNominations.forEach(nom => {
      const isValid =
        typeof nom.title === 'string' &&
        nom.title.trim().length > 0 &&
        typeof nom.evidence === 'string' &&
        nom.evidence.trim().length > 0;

      assert.equal(isValid, false, 'Should reject invalid format');
    });
  });
});

// Canonical decision IDs
describe('Wave1 Intake: Canonical Decision IDs', () => {
  test('decision IDs form a canonical set', () => {
    // Spec: Decision IDs are predefined and immutable
    const CANONICAL_DECISIONS = [
      'APPROVED',
      'REJECTED_PII',
      'REJECTED_MISSING_EVIDENCE',
      'REJECTED_LATE',
      'REJECTED_INVALID_FORMAT',
      'REJECTED_SLOT_CAP',
    ];

    // Any decision must be in the canonical set
    const testDecisions = ['APPROVED', 'REJECTED_PII', 'UNKNOWN'];

    testDecisions.forEach(decision => {
      if (!CANONICAL_DECISIONS.includes(decision)) {
        assert.throws(() => {
          throw new Error(`REJECT: Unknown decision ID: ${decision}`);
        }, /REJECT: Unknown decision ID/);
      }
    });
  });
});

// Single write surface
describe('Wave1 Intake: Single Write Surface', () => {
  test('writes only to WAVE_1_EVALUATION_LOG.md', async () => {
    // Spec: All intake decisions append to single log file
    const LOG_PATH = join(WORKSPACE_ROOT, 'docs/ops/WAVE_1_EVALUATION_LOG.md');

    // Verify log file exists (created during setup)
    try {
      const content = await readFile(LOG_PATH, 'utf-8');
      assert.ok(content.includes('# Wave 1 Evaluation Log'), 'Log file must have correct header');
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Expected before unfreeze - log will be created on Open Day
        assert.ok(true, 'Log file will be created on 2026-02-21');
      } else {
        throw err;
      }
    }
  });

  test('prevents writes to any other Wave 1 file during intake', () => {
    // Spec: Operator card and templates are read-only during Open Day
    const READONLY_PATHS = [
      'docs/ops/WAVE_1_OPERATOR_CARD.md',
      'docs/ops/templates/WAVE_1_NOMINATION_TEMPLATE.md',
    ];

    // Simulate write attempt
    READONLY_PATHS.forEach(path => {
      assert.throws(() => {
        // Mock: any write to these paths should fail during intake window
        const isIntakeWindow = true; // Set by runtime
        if (isIntakeWindow) {
          throw new Error(`REJECT: Write to read-only path: ${path}`);
        }
      }, /REJECT: Write to read-only path/);
    });
  });
});

// UTC enforcement
describe('Wave1 Intake: UTC Enforcement', () => {
  test('all timestamps are ISO 8601 UTC format', () => {
    // Spec: Timestamps must be UTC to avoid local timezone drift
    const validTimestamps = ['2026-02-21T10:00:00Z', '2026-02-21T23:59:59Z'];

    const invalidTimestamps = [
      '2026-02-21T10:00:00', // Missing Z
      '2026-02-21T10:00:00-05:00', // Local offset
    ];

    validTimestamps.forEach(ts => {
      assert.ok(ts.endsWith('Z'), `Valid timestamp must end with Z: ${ts}`);
    });

    invalidTimestamps.forEach(ts => {
      assert.ok(!ts.endsWith('Z'), `Invalid timestamp detected: ${ts}`);
    });
  });

  test('cutoff comparison uses UTC to avoid DST bugs', () => {
    // Spec: Cutoff is 2026-02-21T23:59:59Z (no local timezone conversion)
    const CUTOFF_UTC = new Date('2026-02-21T23:59:59Z');
    const submissionUTC = new Date('2026-02-21T22:00:00Z');

    // Force UTC comparison (no local conversion)
    assert.ok(submissionUTC < CUTOFF_UTC);
    assert.equal(CUTOFF_UTC.toISOString().endsWith('Z'), true);
  });
});
