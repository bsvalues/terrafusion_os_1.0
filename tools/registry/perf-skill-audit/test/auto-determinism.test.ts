/**
 * Phase 4M5d: --auto Determinism Contract Tests
 *
 * These tests guarantee:
 * 1. Same input plan + same repo state → same selected item id
 * 2. Tie-breaking factor changes → selection changes predictably
 * 3. noop always has proof + selectionReason explaining why
 *
 * NON-NEGOTIABLE: These tests prevent "silent drift" in the autonomy envelope.
 */

import assert from 'node:assert';
import { describe, test } from 'node:test';

import type { PerfPlan, PerfPlanItem } from '../src/patch-strategies/types.js';
import {
    classifyNoopReason,
    DEFAULT_GOVERNANCE,
    getStrategyTier,
    isInAllowedSurface,
    isInForbiddenZone,
    selectBestCandidate,
    type SelectionOptions,
} from '../src/selection-algorithm.js';

console.log('✅ Phase 4M5d determinism contract tests loaded');

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockPlanItem(overrides: Partial<PerfPlanItem>): PerfPlanItem {
  return {
    id: 'test-item-1',
    scanner: 'test',
    kind: 'missing-use-client',
    priorityScore: 80,
    eligibility: 'eligible',
    reason: 'Test item',
    patchStrategy: 'missing-use-client',
    file: 'tools/registry/test.tsx',
    files: ['tools/registry/test.tsx'],
    evidence: [{ line: 10, snippet: 'useEffect()', varName: 'test' }],
    risk: 'low',
    gates: ['type-check', 'phase83-tools'],
    ...overrides,
  };
}

function createMockPlan(items: PerfPlanItem[]): PerfPlan {
  return {
    generated: new Date().toISOString(),
    ref: 'test-ref',
    rulesVersion: '1.0.0',
    baseSha: 'abc123',
    summary: {
      total: items.length,
      eligible: items.filter(i => i.eligibility === 'eligible').length,
      review: items.filter(i => i.eligibility === 'review').length,
      blocked: items.filter(i => i.eligibility === 'blocked').length,
      byStrategy: {} as any,
      byRisk: { low: 0, medium: 0, high: 0 },
    },
    items,
  };
}

const defaultOptions: SelectionOptions = {
  tier1Enabled: false,
  governance: DEFAULT_GOVERNANCE,
};

// ============================================================================
// CONTRACT 1: Same input → same output (determinism)
// ============================================================================
describe('Determinism Contract: Same input → same selection', () => {
  test('identical plan produces identical selection across multiple runs', () => {
    const items = [
      createMockPlanItem({ id: 'item-a', priorityScore: 90, estimatedLinesChanged: 5 }),
      createMockPlanItem({ id: 'item-b', priorityScore: 90, estimatedLinesChanged: 5 }),
      createMockPlanItem({ id: 'item-c', priorityScore: 90, estimatedLinesChanged: 5 }),
    ];
    const plan = createMockPlan(items);

    // Run selection 10 times - must always return same result
    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = selectBestCandidate(plan, defaultOptions);
      if (result.item) {
        results.push(result.item.id);
      }
    }

    assert.equal(results.length, 10, 'Should have 10 results');
    assert.ok(
      results.every(id => id === results[0]),
      `All selections should be identical, got: ${[...new Set(results)].join(', ')}`
    );
  });

  test('selection is stable across plan shuffles', () => {
    const items = [
      createMockPlanItem({ id: 'item-x', priorityScore: 70, estimatedLinesChanged: 3 }),
      createMockPlanItem({ id: 'item-y', priorityScore: 80, estimatedLinesChanged: 10 }),
      createMockPlanItem({ id: 'item-z', priorityScore: 75, estimatedLinesChanged: 5 }),
    ];

    // Shuffle order multiple times
    const orderings = [
      [items[0], items[1], items[2]],
      [items[2], items[0], items[1]],
      [items[1], items[2], items[0]],
    ];

    const selectedIds = orderings.map(order => {
      const plan = createMockPlan([...order]);
      const result = selectBestCandidate(plan, defaultOptions);
      return result.item?.id;
    });

    // All should select the same item (item-y with highest priority)
    assert.ok(
      selectedIds.every(id => id === 'item-y'),
      `Should always select highest priority, got: ${selectedIds.join(', ')}`
    );
  });
});

// ============================================================================
// CONTRACT 2: Tie-breaking changes → predictable selection changes
// ============================================================================
describe('Tie-breaking Contract: Factor changes → predictable selection', () => {
  test('priorityScore wins over estimatedLinesChanged', () => {
    const items = [
      createMockPlanItem({ id: 'low-lines', priorityScore: 75, estimatedLinesChanged: 2 }),
      createMockPlanItem({ id: 'high-priority', priorityScore: 85, estimatedLinesChanged: 50 }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item?.id, 'high-priority', 'Higher priority wins despite more lines');
  });

  test('estimatedLinesChanged wins when priorityScore ties', () => {
    const items = [
      createMockPlanItem({ id: 'many-lines', priorityScore: 80, estimatedLinesChanged: 100 }),
      createMockPlanItem({ id: 'few-lines', priorityScore: 80, estimatedLinesChanged: 5 }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item?.id, 'few-lines', 'Fewer lines wins when priority ties');
  });

  test('id wins when both priorityScore and estimatedLinesChanged tie', () => {
    const items = [
      createMockPlanItem({ id: 'zebra', priorityScore: 80, estimatedLinesChanged: 10 }),
      createMockPlanItem({ id: 'alpha', priorityScore: 80, estimatedLinesChanged: 10 }),
      createMockPlanItem({ id: 'beta', priorityScore: 80, estimatedLinesChanged: 10 }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item?.id, 'alpha', 'Lexicographically first id wins on full tie');
  });

  test('changing priority changes selection predictably', () => {
    const itemA = createMockPlanItem({
      id: 'item-a',
      priorityScore: 80,
      estimatedLinesChanged: 10,
    });
    const itemB = createMockPlanItem({
      id: 'item-b',
      priorityScore: 75,
      estimatedLinesChanged: 10,
    });

    // A wins initially
    let plan = createMockPlan([itemA, itemB]);
    let result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item?.id, 'item-a');

    // Raise B's priority - now B wins
    itemB.priorityScore = 85;
    plan = createMockPlan([itemA, itemB]);
    result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item?.id, 'item-b');
  });
});

// ============================================================================
// CONTRACT 3: noop always has proof + selectionReason
// ============================================================================
describe('Noop Contract: Always emit proof with reason', () => {
  test('noop when no eligible items - reason explains why', () => {
    const items = [
      createMockPlanItem({ id: 'review-only', eligibility: 'review' }),
      createMockPlanItem({ id: 'blocked', eligibility: 'blocked' }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item, null, 'Should return null');
    assert.ok(result.reason, 'Must have reason');
    assert.ok(result.reason.reason.length > 0, 'Reason must have text');
    assert.equal(result.reason.candidatesConsidered, 2, 'Should count candidates');
  });

  test('noop when all filtered by governance - reason explains', () => {
    const items = [
      createMockPlanItem({ id: 'forbidden', file: 'ARCHIVE/old-code.tsx' }),
      createMockPlanItem({ id: 'outside', file: 'src/components/Button.tsx' }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item, null, 'Should return null');
    assert.ok(
      result.reason.filteredByGovernance > 0 || result.reason.reason.includes('governance'),
      'Should mention governance filtering'
    );
  });

  test('noop when tier disabled - reason explains', () => {
    const items = [
      createMockPlanItem({
        id: 'tier1-only',
        patchStrategy: 'waterfall-parallelize',
        file: 'tools/registry/test.tsx',
      }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, { ...defaultOptions, tier1Enabled: false });
    assert.equal(result.item, null, 'Should return null');
    assert.ok(
      result.reason.reason.includes('Tier') || result.reason.filteredByTier > 0,
      'Should mention tier filtering'
    );
  });

  test('classifyNoopReason categorizes correctly', () => {
    // Test governance reason
    const govReason = {
      reason: 'No candidates pass governance filters',
      candidatesConsidered: 5,
      filteredByGovernance: 5,
      filteredByTier: 0,
    };
    assert.equal(classifyNoopReason(govReason), 'all-filtered-by-governance');

    // Test tier reason
    const tierReason = {
      reason: 'No Tier 0 candidates available',
      candidatesConsidered: 5,
      filteredByGovernance: 0,
      filteredByTier: 5,
    };
    assert.equal(classifyNoopReason(tierReason), 'tier-disabled');

    // Test generic no-eligible
    const genericReason = {
      reason: 'No items available',
      candidatesConsidered: 0,
      filteredByGovernance: 0,
      filteredByTier: 0,
    };
    assert.equal(classifyNoopReason(genericReason), 'no-eligible');
  });
});

// ============================================================================
// CONTRACT 4: Strategy tier classification
// ============================================================================
describe('Strategy Tier Contract', () => {
  test('Tier 0 strategies are correctly identified', () => {
    assert.equal(getStrategyTier('missing-use-client'), 0);
    assert.equal(getStrategyTier('dedupe-imports'), 0);
    assert.equal(getStrategyTier('debarrel-import'), 0);
  });

  test('Tier 1 strategies are correctly identified', () => {
    assert.equal(getStrategyTier('waterfall-parallelize'), 1);
    assert.equal(getStrategyTier('rerender-stabilize'), 1);
  });

  test('Unknown/review-only returns -1', () => {
    assert.equal(getStrategyTier('review-only'), -1);
    assert.equal(getStrategyTier(undefined), -1);
    assert.equal(getStrategyTier('unknown-strategy'), -1);
  });
});

// ============================================================================
// CONTRACT 5: Governance surface validation
// ============================================================================
describe('Governance Surface Contract', () => {
  test('allowed surface patterns work correctly', () => {
    assert.ok(isInAllowedSurface('os-platform/core/pilot/test.ts'));
    assert.ok(isInAllowedSurface('os-platform/core/types/index.ts'));
    assert.ok(isInAllowedSurface('tools/registry/perf-skill-audit/src/index.ts'));
    assert.ok(!isInAllowedSurface('src/components/Button.tsx'));
    assert.ok(!isInAllowedSurface('applications/app1/page.tsx'));
  });

  test('forbidden path patterns work correctly', () => {
    assert.ok(isInForbiddenZone('ARCHIVE/old-code.tsx'));
    assert.ok(isInForbiddenZone('path/to/ARCHIVE/file.ts'));
    assert.ok(isInForbiddenZone('specialized/module/index.ts'));
    assert.ok(isInForbiddenZone('applications/app1/page.tsx'));
    assert.ok(!isInForbiddenZone('tools/registry/test.ts'));
  });

  test('Windows paths are normalized', () => {
    assert.ok(isInAllowedSurface('os-platform\\core\\pilot\\test.ts'));
    assert.ok(isInForbiddenZone('path\\to\\ARCHIVE\\file.ts'));
  });
});

// ============================================================================
// CONTRACT 6: Selection explains ranking factors
// ============================================================================
describe('Selection Reason Contract: Ranking factors', () => {
  test('successful selection includes rankingFactors', () => {
    const items = [
      createMockPlanItem({
        id: 'test-item',
        priorityScore: 85,
        estimatedLinesChanged: 7,
        riskScore: 25,
      }),
    ];
    const plan = createMockPlan(items);

    const result = selectBestCandidate(plan, defaultOptions);
    assert.ok(result.item, 'Should select item');
    assert.ok(result.reason.rankingFactors, 'Must have ranking factors');
    assert.equal(result.reason.rankingFactors!.priorityScore, 85);
    assert.equal(result.reason.rankingFactors!.estimatedLinesChanged, 7);
    assert.equal(result.reason.rankingFactors!.riskScore, 25);
    assert.equal(result.reason.rankingFactors!.id, 'test-item');
  });

  test('noop selection has no rankingFactors', () => {
    const plan = createMockPlan([]);
    const result = selectBestCandidate(plan, defaultOptions);
    assert.equal(result.item, null);
    assert.ok(!result.reason.rankingFactors, 'Noop should not have ranking factors');
  });
});
