/**
 * Phase 4N50 — SLO Enforcement Gate Contract Tests
 * =================================================
 *
 * Tests for enforcing SLOs as build/CI gates.
 *
 * CONTRACTS:
 * - Fails gate when budget exceeded
 * - Warns when near threshold
 * - Passes within thresholds
 * - Combines multiple metrics into single gate result
 * - Provides actionable error messages
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    runSLOGate,
    SLO_GATE_SCHEMA,
    SLO_GATE_VERSION,
    type SLOGateInput
} from '../src/ops/slo-gate.js';

import { getDefaultSLOs, type SLOMetric } from '../src/ops-slo.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createMetric(name: string, value: number, ceiling: number): SLOMetric {
  return {
    name,
    value,
    ceiling,
    unit: 'ms',
    measuredAt: '2026-01-31T12:00:00.000Z',
  };
}

function createGateInput(metrics: SLOMetric[]): SLOGateInput {
  return {
    metrics,
    slos: getDefaultSLOs(),
    profile: 'county',
    context: {
      runId: 'test-run-123',
      workflow: 'ci',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Schema & Version', () => {
  it('exports SLO_GATE_SCHEMA', () => {
    assert.equal(SLO_GATE_SCHEMA, 'terrafusion.autonomy.slo-gate.v1');
  });

  it('exports SLO_GATE_VERSION matching 4N50.x', () => {
    assert.match(SLO_GATE_VERSION, /^4N50\.\d+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Gate Pass/Fail
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Pass/Fail', () => {
  it('passes_within_thresholds', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 1000, 5000), // 20% of ceiling
      createMetric('dr-reconstitute', 5000, 30000), // 17% of ceiling
    ]);

    const result = runSLOGate(input);

    assert.equal(result.passed, true);
    assert.equal(result.gateStatus, 'pass');
    assert.deepEqual(result.violations, []);
  });

  it('fails_when_budget_exceeded', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 6000, 5000), // 120% of ceiling - EXCEEDED
    ]);

    const result = runSLOGate(input);

    assert.equal(result.passed, false);
    assert.equal(result.gateStatus, 'fail');
    assert.equal(result.violations.length, 1);
    assert.equal(result.violations[0].metric, 'verify-casefile');
    assert.equal(result.violations[0].type, 'exceeded');
  });

  it('warns_when_near_threshold', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 4200, 5000), // 84% of ceiling - WARN (threshold 80%)
    ]);

    const result = runSLOGate(input);

    // Still passes but has warnings
    assert.equal(result.passed, true);
    assert.equal(result.gateStatus, 'warn');
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].metric, 'verify-casefile');
    assert.ok(result.warnings[0].message.includes('near threshold'));
  });

  it('fails_when_multiple_budgets_exceeded', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 6000, 5000), // exceeded
      createMetric('dr-reconstitute', 35000, 30000), // exceeded
      createMetric('generate-pack', 30000, 60000), // ok
    ]);

    const result = runSLOGate(input);

    assert.equal(result.passed, false);
    assert.equal(result.violations.length, 2);
  });

  it('fail_takes_precedence_over_warn', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 6000, 5000), // exceeded
      createMetric('dr-reconstitute', 25000, 30000), // 83% - warn territory
    ]);

    const result = runSLOGate(input);

    // Gate should fail, not warn
    assert.equal(result.passed, false);
    assert.equal(result.gateStatus, 'fail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Metric Details
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Metric Details', () => {
  it('includes_utilization_percent', () => {
    const input = createGateInput([createMetric('verify-casefile', 2500, 5000)]);

    const result = runSLOGate(input);

    const detail = result.metricDetails.find(m => m.name === 'verify-casefile');
    assert.ok(detail);
    assert.equal(detail.utilizationPercent, 50);
    assert.equal(detail.headroomPercent, 50);
  });

  it('includes_overage_when_exceeded', () => {
    const input = createGateInput([createMetric('verify-casefile', 7000, 5000)]);

    const result = runSLOGate(input);

    const detail = result.metricDetails.find(m => m.name === 'verify-casefile');
    assert.ok(detail);
    assert.equal(detail.overage, 2000);
    assert.equal(detail.exceeded, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Actionable Messages
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Actionable Messages', () => {
  it('violation_includes_actionable_message', () => {
    const input = createGateInput([createMetric('verify-casefile', 6000, 5000)]);

    const result = runSLOGate(input);

    assert.ok(result.violations[0].message);
    assert.ok(result.violations[0].message.includes('exceeded'));
    assert.ok(result.violations[0].message.includes('5000'));
  });

  it('violation_includes_suggested_action', () => {
    const input = createGateInput([createMetric('verify-casefile', 6000, 5000)]);

    const result = runSLOGate(input);

    assert.ok(result.violations[0].suggestedAction);
    // Should suggest investigation or optimization
    assert.ok(
      result.violations[0].suggestedAction.includes('investigate') ||
        result.violations[0].suggestedAction.includes('optimize') ||
        result.violations[0].suggestedAction.includes('check')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Result Shape
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Result Shape', () => {
  it('returns_SLOGateResult_contract', () => {
    const input = createGateInput([createMetric('verify-casefile', 1000, 5000)]);
    const result = runSLOGate(input);

    // Required fields
    assert.ok('$schema' in result);
    assert.ok('version' in result);
    assert.ok('evaluatedAt' in result);
    assert.ok('passed' in result);
    assert.ok('gateStatus' in result);
    assert.ok('violations' in result);
    assert.ok('warnings' in result);
    assert.ok('metricDetails' in result);
    assert.ok('context' in result);

    // Schema matches
    assert.equal(result.$schema, SLO_GATE_SCHEMA);
    assert.equal(result.version, SLO_GATE_VERSION);
  });

  it('includes_context_in_result', () => {
    const input = createGateInput([createMetric('verify-casefile', 1000, 5000)]);
    const result = runSLOGate(input);

    assert.equal(result.context.runId, 'test-run-123');
    assert.equal(result.context.workflow, 'ci');
    assert.equal(result.context.profile, 'county');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Determinism', () => {
  it('gate_is_deterministic_given_same_inputs', () => {
    const input = createGateInput([
      createMetric('verify-casefile', 3000, 5000),
      createMetric('dr-reconstitute', 15000, 30000),
    ]);

    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = runSLOGate(input);
      // Exclude evaluatedAt for comparison
      const { evaluatedAt, ...rest } = result;
      results.push(JSON.stringify(rest));
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], results[0]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Empty/Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('SLOGate: Edge Cases', () => {
  it('handles_empty_metrics', () => {
    const input = createGateInput([]);
    const result = runSLOGate(input);

    // No metrics = pass by default (nothing to fail)
    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.metricDetails.length, 0);
  });

  it('handles_exactly_at_ceiling', () => {
    const input = createGateInput([createMetric('verify-casefile', 5000, 5000)]);
    const result = runSLOGate(input);

    // At ceiling is exactly 100% - should pass but be at limit
    assert.equal(result.passed, true);
    assert.equal(result.gateStatus, 'warn'); // At 100% triggers warn
  });

  it('handles_zero_ceiling', () => {
    const input = createGateInput([createMetric('verify-casefile', 100, 0)]);
    const result = runSLOGate(input);

    // Zero ceiling should fail (any value exceeds it)
    assert.equal(result.passed, false);
    assert.ok(result.violations.length > 0);
  });
});
