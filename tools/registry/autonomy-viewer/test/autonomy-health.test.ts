/**
 * Phase 4N30 – Autonomy Health Governor Contract Tests
 * =====================================================
 *
 * Contract tests for error budget health model.
 * Tests: determinism, windowing, category mapping, threshold triggers.
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  calculateHealth,
  DEFAULT_THRESHOLDS,
  DEFAULT_WINDOW,
  extractFailureCategories,
  HEALTH_SCHEMA,
  HEALTH_TOOL_VERSION,
  type EvidenceRecordForHealth,
  type FailureCategory,
} from '../src/autonomy-health.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockRecord(
  overrides: Partial<EvidenceRecordForHealth> = {}
): EvidenceRecordForHealth {
  return {
    runId: 'test-run-' + Math.random().toString(36).slice(2),
    generatedAt: new Date().toISOString(),
    tier: 'ci',
    verify: { ok: true },
    ...overrides,
  };
}

function createOkRecord(runId = 'ok-run'): EvidenceRecordForHealth {
  return {
    runId,
    generatedAt: new Date().toISOString(),
    tier: 'ci',
    verify: { ok: true, strict: true },
    signature: { signed: true, verified: { ok: true }, pinned: true },
    tpi: { ok: true },
    rekor: { anchored: true },
    custody: { ok: true },
  };
}

function createFailedRecord(
  category: FailureCategory,
  runId = 'failed-run'
): EvidenceRecordForHealth {
  const base = createOkRecord(runId);

  switch (category) {
    case 'verify_bundle_failed':
      return { ...base, verify: { ok: false } };
    case 'verify_custody_failed':
      return { ...base, custody: { ok: false } };
    case 'signatures_failed':
      return { ...base, signature: { signed: true, verified: { ok: false }, pinned: true } };
    case 'pins_failed':
      return { ...base, signature: { signed: true, verified: { ok: true }, pinned: false } };
    case 'rekor_failed':
      return { ...base, rekor: { anchored: false } };
    case 'tpi_failed':
      // TPI only checked for non-ci tiers
      return { ...base, tier: 'merged', tpi: { ok: false } };
    case 'role_binding_failed':
      return { ...base, roleBinding: { ok: false, skipped: false } };
    case 'publisher_asset_missing':
      return { ...base, localBundleMissing: true };
    case 'workflow_failure':
      // workflow_failure uses 'error' or 'workflow_failed' outcome
      return { ...base, outcome: 'error' };
    default:
      return base;
  }
}

// ============================================================================
// Schema Version Tests
// ============================================================================

describe('Phase 4N30: Health Schema', () => {
  it('should have schema version terrafusion.autonomy.health.v1', () => {
    assert.strictEqual(HEALTH_SCHEMA, 'terrafusion.autonomy.health.v1');
  });

  it('should have tool version 4N30.1', () => {
    assert.strictEqual(HEALTH_TOOL_VERSION, '4N30.1');
  });
});

// ============================================================================
// Failure Category Extraction Tests
// ============================================================================

describe('Phase 4N30: Failure Category Extraction', () => {
  it('should return empty array for healthy record', () => {
    const record = createOkRecord();
    const categories = extractFailureCategories(record);
    assert.deepStrictEqual(categories, []);
  });

  it('should detect verify_bundle_failed', () => {
    const record = createFailedRecord('verify_bundle_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('verify_bundle_failed'));
  });

  it('should detect verify_custody_failed', () => {
    const record = createFailedRecord('verify_custody_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('verify_custody_failed'));
  });

  it('should detect signatures_failed', () => {
    const record = createFailedRecord('signatures_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('signatures_failed'));
  });

  it('should detect pins_failed', () => {
    const record = createFailedRecord('pins_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('pins_failed'));
  });

  it('should detect rekor_failed', () => {
    const record = createFailedRecord('rekor_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('rekor_failed'));
  });

  it('should detect tpi_failed', () => {
    const record = createFailedRecord('tpi_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('tpi_failed'));
  });

  it('should detect role_binding_failed', () => {
    const record = createFailedRecord('role_binding_failed');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('role_binding_failed'));
  });

  it('should detect publisher_asset_missing', () => {
    const record = createFailedRecord('publisher_asset_missing');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('publisher_asset_missing'));
  });

  it('should detect workflow_failure', () => {
    const record = createFailedRecord('workflow_failure');
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('workflow_failure'));
  });

  it('should detect multiple failures in same record', () => {
    const record: EvidenceRecordForHealth = {
      runId: 'multi-fail',
      generatedAt: new Date().toISOString(),
      tier: 'merged', // Non-ci for TPI to work
      verify: { ok: false },
      signature: { signed: true, verified: { ok: false }, pinned: false },
      tpi: { ok: false },
    };
    const categories = extractFailureCategories(record);
    assert.ok(categories.includes('verify_bundle_failed'));
    assert.ok(categories.includes('signatures_failed'));
    assert.ok(categories.includes('pins_failed'));
    assert.ok(categories.includes('tpi_failed'));
    assert.ok(categories.length >= 4);
  });
});

// ============================================================================
// Default Threshold Tests
// ============================================================================

describe('Phase 4N30: Default Thresholds', () => {
  it('should have warnFailures >= 1', () => {
    assert.ok(DEFAULT_THRESHOLDS.warnFailures >= 1);
  });

  it('should have pauseRecommendedFailures > warnFailures', () => {
    assert.ok(DEFAULT_THRESHOLDS.pauseRecommendedFailures > DEFAULT_THRESHOLDS.warnFailures);
  });

  it('should have pauseRequiredFailures > pauseRecommendedFailures', () => {
    assert.ok(
      DEFAULT_THRESHOLDS.pauseRequiredFailures > DEFAULT_THRESHOLDS.pauseRecommendedFailures
    );
  });

  it('should have at least 1 immediate warn category', () => {
    assert.ok(DEFAULT_THRESHOLDS.immediateWarnCategories.length >= 1);
  });

  it('should have at least 2 critical categories', () => {
    assert.ok(DEFAULT_THRESHOLDS.criticalCategories.length >= 2);
  });

  it('should have at least 2 combined pause categories', () => {
    assert.ok(DEFAULT_THRESHOLDS.combinedPauseCategories.length >= 2);
  });
});

// ============================================================================
// Health Calculation: OK Level
// ============================================================================

describe('Phase 4N30: Health Level OK', () => {
  it('should return ok for empty records', () => {
    const health = calculateHealth([]);
    assert.strictEqual(health.decision.level, 'ok');
  });

  it('should return ok for all healthy records', () => {
    const records = [createOkRecord('1'), createOkRecord('2'), createOkRecord('3')];
    const health = calculateHealth(records);
    assert.strictEqual(health.decision.level, 'ok');
  });

  it('should return ok for single failure (below warn threshold)', () => {
    const records = [createFailedRecord('verify_bundle_failed'), createOkRecord('2')];
    const health = calculateHealth(records);
    // One failure should be below warn threshold (default is 2)
    assert.strictEqual(health.decision.level, 'ok');
  });
});

// ============================================================================
// Health Calculation: WARN Level
// ============================================================================

describe('Phase 4N30: Health Level WARN', () => {
  it('should return warn when failures equal warnFailures threshold', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < DEFAULT_THRESHOLDS.warnFailures; i++) {
      records.push(createFailedRecord('verify_bundle_failed', `fail-${i}`));
    }
    const health = calculateHealth(records);
    assert.strictEqual(health.decision.level, 'warn');
  });

  it('should return warn for immediate warn category on first occurrence', () => {
    // rekor_failed is in immediateWarnCategories
    const records = [createFailedRecord('rekor_failed')];
    const health = calculateHealth(records);
    // Immediate warn category should trigger warn even on first occurrence
    assert.strictEqual(health.decision.level, 'warn');
  });
});

// ============================================================================
// Health Calculation: PAUSE_RECOMMENDED Level
// ============================================================================

describe('Phase 4N30: Health Level PAUSE_RECOMMENDED', () => {
  it('should return pause_recommended when failures equal pauseRecommendedFailures', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < DEFAULT_THRESHOLDS.pauseRecommendedFailures; i++) {
      records.push(createFailedRecord('verify_bundle_failed', `fail-${i}`));
    }
    const health = calculateHealth(records);
    assert.strictEqual(health.decision.level, 'pause_recommended');
  });

  it('should return pause_recommended for critical categories at threshold', () => {
    const records: EvidenceRecordForHealth[] = [];
    // Use critical categories (pins_failed, rekor_failed)
    for (let i = 0; i < DEFAULT_THRESHOLDS.criticalThreshold; i++) {
      records.push(createFailedRecord('rekor_failed', `rekor-fail-${i}`));
    }
    const health = calculateHealth(records);
    assert.ok(
      health.decision.level === 'pause_recommended' || health.decision.level === 'pause_required',
      `Expected pause_recommended or pause_required, got ${health.decision.level}`
    );
  });
});

// ============================================================================
// Health Calculation: PAUSE_REQUIRED Level
// ============================================================================

describe('Phase 4N30: Health Level PAUSE_REQUIRED', () => {
  it('should return pause_required when failures equal pauseRequiredFailures', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < DEFAULT_THRESHOLDS.pauseRequiredFailures; i++) {
      records.push(createFailedRecord('verify_bundle_failed', `fail-${i}`));
    }
    const health = calculateHealth(records);
    assert.strictEqual(health.decision.level, 'pause_required');
  });

  it('should return pause_required for combined critical categories', () => {
    // Two different critical categories in same window should trigger pause_required
    const records = [
      createFailedRecord('pins_failed', 'pin-fail-1'),
      createFailedRecord('pins_failed', 'pin-fail-2'),
      createFailedRecord('rekor_failed', 'rekor-fail-1'),
      createFailedRecord('tpi_failed', 'tpi-fail-1'),
    ];
    const health = calculateHealth(records);
    assert.strictEqual(health.decision.level, 'pause_required');
  });
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe('Phase 4N30: Determinism', () => {
  it('should produce identical output for identical input', () => {
    const fixedRecords: EvidenceRecordForHealth[] = [
      {
        runId: 'determinism-test-1',
        generatedAt: '2025-01-31T10:00:00.000Z',
        tier: 'ci',
        verify: { ok: false },
      },
      {
        runId: 'determinism-test-2',
        generatedAt: '2025-01-31T10:05:00.000Z',
        tier: 'ci',
        verify: { ok: true },
      },
    ];

    const health1 = calculateHealth(fixedRecords);
    const health2 = calculateHealth(fixedRecords);

    assert.strictEqual(health1.decision.level, health2.decision.level);
    assert.deepStrictEqual(health1.totals, health2.totals);
    assert.deepStrictEqual(health1.failuresByCategory, health2.failuresByCategory);
    assert.deepStrictEqual(health1.decision.reasonCodes, health2.decision.reasonCodes);
  });

  it('should ignore array order when calculating totals', () => {
    const records1 = [createOkRecord('a'), createFailedRecord('verify_bundle_failed', 'b')];
    const records2 = [createFailedRecord('verify_bundle_failed', 'b'), createOkRecord('a')];

    const health1 = calculateHealth(records1);
    const health2 = calculateHealth(records2);

    assert.strictEqual(health1.decision.level, health2.decision.level);
    assert.strictEqual(health1.totals.ok, health2.totals.ok);
    assert.strictEqual(health1.totals.failed, health2.totals.failed);
  });
});

// ============================================================================
// Window Tests
// ============================================================================

describe('Phase 4N30: Window Constraints', () => {
  it('should cap records to maxRecords in window', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < 50; i++) {
      records.push(createOkRecord(`run-${i}`));
    }
    const health = calculateHealth(records, DEFAULT_THRESHOLDS, DEFAULT_WINDOW);
    assert.ok(health.window.recordCount <= DEFAULT_WINDOW.maxRecords);
  });

  it('should use most recent records when capped', () => {
    const oldRecords = [
      {
        runId: 'old',
        generatedAt: '2020-01-01T00:00:00.000Z',
        tier: 'ci' as const,
        verify: { ok: false },
      },
    ];
    const newRecords = Array.from({ length: 25 }, (_, i) => ({
      runId: `new-${i}`,
      generatedAt: '2025-01-31T00:00:00.000Z',
      tier: 'ci' as const,
      verify: { ok: true },
    }));

    const health = calculateHealth([...oldRecords, ...newRecords]);

    // If properly windowed, the old failed record should be excluded
    // and all remaining should be ok
    if (health.window.recordCount === DEFAULT_WINDOW.maxRecords) {
      assert.strictEqual(health.totals.ok, DEFAULT_WINDOW.maxRecords);
      assert.strictEqual(health.totals.failed, 0);
    }
  });
});

// ============================================================================
// Reason Codes Tests
// ============================================================================

describe('Phase 4N30: Reason Codes', () => {
  it('should include reason codes explaining the decision', () => {
    const records = [
      createFailedRecord('verify_bundle_failed', 'a'),
      createFailedRecord('verify_bundle_failed', 'b'),
    ];
    const health = calculateHealth(records);
    assert.ok(health.decision.reasonCodes.length > 0);
  });

  it('should include category-specific reason codes', () => {
    const records = [createFailedRecord('rekor_failed')];
    const health = calculateHealth(records);
    const hasRekorCode = health.decision.reasonCodes.some(
      code => code.toLowerCase().includes('rekor') || code.toLowerCase().includes('immediate')
    );
    assert.ok(hasRekorCode);
  });
});

// ============================================================================
// Suggested Pause Tests
// ============================================================================

describe('Phase 4N30: Suggested Pause', () => {
  it('should not suggest pause for ok level', () => {
    const records = [createOkRecord()];
    const health = calculateHealth(records);
    assert.strictEqual(health.suggestedPause, null);
  });

  it('should not suggest pause for warn level', () => {
    const records = [createFailedRecord('rekor_failed')];
    const health = calculateHealth(records);
    // warn level should not suggest pause
    if (health.decision.level === 'warn') {
      assert.strictEqual(health.suggestedPause, null);
    }
  });

  it('should suggest pause for pause_recommended level', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < DEFAULT_THRESHOLDS.pauseRecommendedFailures; i++) {
      records.push(createFailedRecord('verify_bundle_failed', `fail-${i}`));
    }
    const health = calculateHealth(records);
    if (health.decision.level === 'pause_recommended') {
      assert.ok(health.suggestedPause !== null);
    }
  });

  it('should suggest pause for pause_required level', () => {
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < DEFAULT_THRESHOLDS.pauseRequiredFailures; i++) {
      records.push(createFailedRecord('verify_bundle_failed', `fail-${i}`));
    }
    const health = calculateHealth(records);
    assert.ok(health.suggestedPause !== null);
    assert.ok(health.suggestedPause!.durationMinutes > 0);
  });
});

// ============================================================================
// Integration: Schema Compliance
// ============================================================================

describe('Phase 4N30: Schema Compliance', () => {
  it('should include all required fields in output', () => {
    const records = [createOkRecord()];
    const health = calculateHealth(records);

    // Required fields per schema
    assert.ok(typeof health.schema === 'string');
    assert.ok(typeof health.toolVersion === 'string');
    assert.ok(typeof health.generatedAt === 'string');
    assert.ok(typeof health.window === 'object');
    assert.ok(typeof health.totals === 'object');
    assert.ok(typeof health.failuresByCategory === 'object');
    assert.ok(typeof health.decision === 'object');
  });

  it('should have valid timestamp format for generatedAt', () => {
    const records = [createOkRecord()];
    const health = calculateHealth(records);
    const timestamp = new Date(health.generatedAt);
    assert.ok(!isNaN(timestamp.getTime()));
  });
});
