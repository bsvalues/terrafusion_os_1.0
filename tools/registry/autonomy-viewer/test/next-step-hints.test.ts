/**
 * Phase 4N48 – Next-Step Hints Contract Tests
 * ============================================
 *
 * Test contracts for telemetry-backed next-step hints.
 * Hints require run context, prioritize blockers,
 * never include PII, and are deterministic.
 *
 * @module next-step-hints.test
 */

import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Hint Interface (contract)
// ─────────────────────────────────────────────────────────────────────────────

interface Hint {
  readonly id: string;
  readonly priority: 'blocker' | 'warning' | 'info';
  readonly category: 'prerequisite' | 'config' | 'exercise' | 'security' | 'operational';
  readonly message: string;
  readonly action?: string;
  readonly link?: string;
}

interface HintResult {
  readonly ok: boolean;
  readonly hints: readonly Hint[];
  readonly context: HintContext;
  readonly generatedAt: string;
}

interface HintContext {
  readonly profile: string;
  readonly lastRunId?: string;
  readonly lastRunStatus?: 'passed' | 'failed' | 'partial';
  readonly lastRunTimestamp?: string;
  readonly exerciseStatuses: Record<string, 'passed' | 'failed' | 'skipped' | 'not-run'>;
}

interface LastRunSummary {
  readonly drillId: string;
  readonly profile: string;
  readonly overall: 'passed' | 'failed' | 'partial';
  readonly timestamp: string;
  readonly exercisesRun: readonly { name: string; status: 'passed' | 'failed' | 'skipped' }[];
  readonly errors: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Known PII patterns (for validation)
// ─────────────────────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i, // Email
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
  /\b\d{1,5}\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ct|court)\b/i, // Address
];

function containsPII(text: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub implementations (will be replaced by real imports)
// ─────────────────────────────────────────────────────────────────────────────

function generateHints(lastRun: LastRunSummary | null): HintResult {
  // Contract: fail closed without run context
  if (!lastRun) {
    return {
      ok: false,
      hints: [
        {
          id: 'no-context',
          priority: 'blocker',
          category: 'prerequisite',
          message: 'No drill run context available. Run `tf drills --profile county` first.',
          action: 'tf drills --profile county',
        },
      ],
      context: {
        profile: 'unknown',
        exerciseStatuses: {},
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const hints: Hint[] = [];

  // Build exercise status map
  const exerciseStatuses: Record<string, 'passed' | 'failed' | 'skipped' | 'not-run'> = {};
  for (const ex of lastRun.exercisesRun) {
    exerciseStatuses[ex.name] = ex.status;
  }

  // Check for failures → blockers
  const failures = lastRun.exercisesRun.filter(e => e.status === 'failed');
  for (const failure of failures) {
    hints.push({
      id: `failed-${failure.name}`,
      priority: 'blocker',
      category: 'exercise',
      message: `Exercise ${failure.name} failed. Review the exercise and fix issues.`,
      action: `Open exercises/${failure.name}.md`,
      link: `exercises/${failure.name}.md`,
    });
  }

  // Check for skipped → warnings
  const skipped = lastRun.exercisesRun.filter(e => e.status === 'skipped');
  for (const skip of skipped) {
    hints.push({
      id: `skipped-${skip.name}`,
      priority: 'warning',
      category: 'exercise',
      message: `Exercise ${skip.name} was skipped. Run drills again after fixing blockers.`,
    });
  }

  // If all passed, suggest next steps
  if (lastRun.overall === 'passed') {
    hints.push({
      id: 'all-passed-next',
      priority: 'info',
      category: 'operational',
      message:
        'All exercises passed! Consider running the full drill sequence or reviewing audit settings.',
      action: 'tf drills --profile county --full',
    });
  }

  // Check for stale run
  const runAge = Date.now() - new Date(lastRun.timestamp).getTime();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  if (runAge > ONE_WEEK) {
    hints.push({
      id: 'stale-run',
      priority: 'warning',
      category: 'operational',
      message: `Last drill run was ${Math.floor(runAge / (24 * 60 * 60 * 1000))} days ago. Consider re-running.`,
      action: 'tf drills --profile county',
    });
  }

  // Sort by priority: blockers first, then warnings, then info
  const priorityOrder = { blocker: 0, warning: 1, info: 2 };
  hints.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    ok: hints.filter(h => h.priority === 'blocker').length === 0,
    hints,
    context: {
      profile: lastRun.profile,
      lastRunId: lastRun.drillId,
      lastRunStatus: lastRun.overall,
      lastRunTimestamp: lastRun.timestamp,
      exerciseStatuses,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('NextStepHints', () => {
  describe('Context Requirements', () => {
    it('hints_require_last_run_context_or_fail_closed', () => {
      // Contract: no run context → fail closed with actionable error
      const result = generateHints(null);

      assert.equal(result.ok, false, 'Should fail closed without context');
      assert.ok(result.hints.length >= 1, 'Should have at least one hint');

      const noContextHint = result.hints.find(h => h.id === 'no-context');
      assert.ok(noContextHint, 'Should have no-context hint');
      assert.equal(noContextHint?.priority, 'blocker');
      assert.ok(noContextHint?.action, 'Hint should have action');
      assert.ok(
        noContextHint?.action?.includes('tf drills'),
        'Action should suggest running drills'
      );
    });

    it('hints_populate_context_from_last_run', () => {
      // Contract: hints include context from last run
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'passed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'passed' }],
        errors: [],
      };

      const result = generateHints(lastRun);

      assert.equal(result.context.profile, 'county');
      assert.equal(result.context.lastRunId, 'drill-county-1234');
      assert.equal(result.context.lastRunStatus, 'passed');
      assert.ok(result.context.lastRunTimestamp);
      assert.deepEqual(result.context.exerciseStatuses, { COUNTY_PILOT: 'passed' });
    });
  });

  describe('Priority Ordering', () => {
    it('hints_prioritize_blockers', () => {
      // Contract: blockers come before warnings and info
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'partial',
        timestamp: new Date().toISOString(),
        exercisesRun: [
          { name: 'COUNTY_PILOT', status: 'failed' },
          { name: 'INCIDENT_DRILL', status: 'skipped' },
        ],
        errors: ['Exercise failed'],
      };

      const result = generateHints(lastRun);

      assert.ok(result.hints.length >= 2, 'Should have multiple hints');

      // Blockers should be first
      const blockers = result.hints.filter(h => h.priority === 'blocker');
      const firstBlockerIdx = result.hints.findIndex(h => h.priority === 'blocker');

      assert.ok(blockers.length >= 1, 'Should have at least one blocker');
      assert.equal(firstBlockerIdx, 0, 'First hint should be blocker');

      // Warnings after blockers
      const firstWarningIdx = result.hints.findIndex(h => h.priority === 'warning');
      if (firstWarningIdx !== -1 && blockers.length > 0) {
        assert.ok(firstWarningIdx >= blockers.length, 'Warnings should come after all blockers');
      }
    });

    it('hints_blockers_cause_not_ok', () => {
      // Contract: presence of blockers sets ok=false
      const lastRunWithFailure: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'failed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'failed' }],
        errors: ['Failed'],
      };

      const result = generateHints(lastRunWithFailure);
      assert.equal(result.ok, false, 'Should be not ok when blockers exist');

      const lastRunWithSuccess: LastRunSummary = {
        drillId: 'drill-county-1235',
        profile: 'county',
        overall: 'passed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'passed' }],
        errors: [],
      };

      const resultOk = generateHints(lastRunWithSuccess);
      assert.equal(resultOk.ok, true, 'Should be ok when no blockers');
    });
  });

  describe('PII Protection', () => {
    it('hints_never_include_pii', () => {
      // Contract: no hint text contains PII patterns
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'partial',
        timestamp: new Date().toISOString(),
        exercisesRun: [
          { name: 'COUNTY_PILOT', status: 'failed' },
          { name: 'INCIDENT_DRILL', status: 'passed' },
        ],
        errors: ['Exercise failed'],
      };

      const result = generateHints(lastRun);

      for (const hint of result.hints) {
        assert.equal(
          containsPII(hint.message),
          false,
          `Hint message should not contain PII: ${hint.message}`
        );
        if (hint.action) {
          assert.equal(
            containsPII(hint.action),
            false,
            `Hint action should not contain PII: ${hint.action}`
          );
        }
      }
    });

    it('pii_detector_works', () => {
      // Verify our PII detection logic
      assert.equal(containsPII('test@example.com'), true, 'Should detect email');
      assert.equal(containsPII('123-45-6789'), true, 'Should detect SSN');
      assert.equal(containsPII('555-123-4567'), true, 'Should detect phone');
      assert.equal(containsPII('123 Main Street'), true, 'Should detect address');
      assert.equal(containsPII('Run tf drills'), false, 'Should not flag commands');
    });
  });

  describe('Determinism', () => {
    it('hints_are_deterministic_given_same_inputs', () => {
      // Contract: same LastRunSummary → same hints (ignoring generatedAt)
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'partial',
        timestamp: '2024-01-15T10:00:00.000Z',
        exercisesRun: [
          { name: 'COUNTY_PILOT', status: 'passed' },
          { name: 'INCIDENT_DRILL', status: 'failed' },
        ],
        errors: ['Exercise failed'],
      };

      const result1 = generateHints(lastRun);
      const result2 = generateHints(lastRun);

      // Same ok status
      assert.equal(result1.ok, result2.ok);

      // Same number of hints
      assert.equal(result1.hints.length, result2.hints.length);

      // Same hint IDs in same order
      assert.deepEqual(
        result1.hints.map(h => h.id),
        result2.hints.map(h => h.id)
      );

      // Same hint messages
      assert.deepEqual(
        result1.hints.map(h => h.message),
        result2.hints.map(h => h.message)
      );

      // Same context (excluding generatedAt)
      assert.deepEqual(result1.context, result2.context);
    });
  });

  describe('Result Contract', () => {
    it('returns_HintResult_shape', () => {
      // Contract: result matches HintResult interface
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'passed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'passed' }],
        errors: [],
      };

      const result = generateHints(lastRun);

      assert.equal(typeof result.ok, 'boolean');
      assert.ok(Array.isArray(result.hints));
      assert.equal(typeof result.context, 'object');
      assert.equal(typeof result.generatedAt, 'string');
      assert.doesNotThrow(() => new Date(result.generatedAt));
    });

    it('hint_shape', () => {
      // Contract: each Hint has required fields
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-1234',
        profile: 'county',
        overall: 'failed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'failed' }],
        errors: ['Failed'],
      };

      const result = generateHints(lastRun);

      for (const hint of result.hints) {
        assert.equal(typeof hint.id, 'string');
        assert.ok(['blocker', 'warning', 'info'].includes(hint.priority));
        assert.ok(
          ['prerequisite', 'config', 'exercise', 'security', 'operational'].includes(hint.category)
        );
        assert.equal(typeof hint.message, 'string');
        assert.ok(hint.message.length > 0, 'Message should not be empty');
      }
    });
  });

  describe('Stale Run Detection', () => {
    it('warns_on_stale_run', () => {
      // Contract: runs older than 7 days get stale warning
      const oldTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

      const lastRun: LastRunSummary = {
        drillId: 'drill-county-old',
        profile: 'county',
        overall: 'passed',
        timestamp: oldTimestamp,
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'passed' }],
        errors: [],
      };

      const result = generateHints(lastRun);

      const staleHint = result.hints.find(h => h.id === 'stale-run');
      assert.ok(staleHint, 'Should have stale run hint');
      assert.equal(staleHint?.priority, 'warning');
      assert.ok(staleHint?.message.includes('days ago'));
    });

    it('no_stale_warning_for_recent_run', () => {
      // Contract: recent runs don't get stale warning
      const lastRun: LastRunSummary = {
        drillId: 'drill-county-recent',
        profile: 'county',
        overall: 'passed',
        timestamp: new Date().toISOString(),
        exercisesRun: [{ name: 'COUNTY_PILOT', status: 'passed' }],
        errors: [],
      };

      const result = generateHints(lastRun);

      const staleHint = result.hints.find(h => h.id === 'stale-run');
      assert.ok(!staleHint, 'Should not have stale run hint for recent run');
    });
  });
});
