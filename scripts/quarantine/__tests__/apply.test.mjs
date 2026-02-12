/**
 * Apply tests — Quarantine apply script safety + batching
 *
 * Run: node --test scripts/quarantine/__tests__/apply.test.mjs
 *
 * These tests exercise the pure core (computeMovesToApply) only.
 * Actual git-mv execution is tested via integration (Increment 4).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeMovesToApply } from '../apply-core.mjs';

// A realistic plan (mirrors planner output)
const SAMPLE_PLAN = [
  { from: 'ACCESSIBILITY_REPORT.md', to: 'QUARANTINE/root-md/ACCESSIBILITY_REPORT.md' },
  {
    from: 'AdvancedAnalyticsEngine.ts',
    to: 'QUARANTINE/root-artifacts/AdvancedAnalyticsEngine.ts',
  },
  { from: 'agents/', to: 'QUARANTINE/top-level-dirs/agents/' },
  { from: 'ai-swarm-service.js', to: 'QUARANTINE/root-artifacts/ai-swarm-service.js' },
  {
    from: 'autonomous_excellence_monitor.py',
    to: 'QUARANTINE/root-artifacts/autonomous_excellence_monitor.py',
  },
  { from: 'marketplace/', to: 'QUARANTINE/top-level-dirs/marketplace/' },
  { from: 'stale.txt', to: 'QUARANTINE/root-artifacts/stale.txt' },
];

describe('computeMovesToApply', () => {
  it('refuses_when_working_tree_dirty', () => {
    // statusOutput simulates `git status --porcelain` output
    const result = computeMovesToApply({
      plan: SAMPLE_PLAN,
      batch: 10,
      statusOutput: ' M some-file.txt\n',
    });
    assert.equal(result.ok, false, 'should refuse on dirty tree');
    assert.match(result.error, /dirty/i, 'error mentions dirty');
    assert.equal(result.moves, undefined, 'no moves on dirty tree');
  });

  it('applies_git_mv_for_batch_n_only', () => {
    const result = computeMovesToApply({
      plan: SAMPLE_PLAN,
      batch: 3,
      statusOutput: '',
    });
    assert.equal(result.ok, true);
    assert.equal(result.moves.length, 3, 'batch 3 → exactly 3 moves');
    // Should be the first 3 in plan order (plan is already sorted by from)
    assert.equal(result.moves[0].from, SAMPLE_PLAN[0].from);
    assert.equal(result.moves[1].from, SAMPLE_PLAN[1].from);
    assert.equal(result.moves[2].from, SAMPLE_PLAN[2].from);
  });

  it('uses_categories_correctly_md_vs_other_vs_dir', () => {
    // Full batch — all 7 moves
    const result = computeMovesToApply({
      plan: SAMPLE_PLAN,
      batch: Infinity,
      statusOutput: '',
    });
    assert.equal(result.ok, true);
    assert.equal(result.moves.length, SAMPLE_PLAN.length);

    // Category verification: each move preserves planner's bucket assignment
    for (const move of result.moves) {
      const planEntry = SAMPLE_PLAN.find(p => p.from === move.from);
      assert.ok(planEntry, `${move.from} should exist in plan`);
      assert.equal(move.to, planEntry.to, `${move.from} destination must match plan`);
    }

    // Spot-check: .md → root-md
    const mdMove = result.moves.find(m => m.from === 'ACCESSIBILITY_REPORT.md');
    assert.ok(mdMove.to.startsWith('QUARANTINE/root-md/'));

    // Spot-check: dir → top-level-dirs
    const dirMove = result.moves.find(m => m.from === 'agents/');
    assert.ok(dirMove.to.startsWith('QUARANTINE/top-level-dirs/'));

    // Spot-check: other → root-artifacts
    const artifactMove = result.moves.find(m => m.from === 'ai-swarm-service.js');
    assert.ok(artifactMove.to.startsWith('QUARANTINE/root-artifacts/'));
  });

  it('does_not_run_without_plan', () => {
    // Empty plan → ok but zero moves
    const resultEmpty = computeMovesToApply({
      plan: [],
      batch: 10,
      statusOutput: '',
    });
    assert.equal(resultEmpty.ok, true);
    assert.equal(resultEmpty.moves.length, 0, 'empty plan → 0 moves');

    // Null/undefined plan → error
    const resultNull = computeMovesToApply({
      plan: null,
      batch: 10,
      statusOutput: '',
    });
    assert.equal(resultNull.ok, false, 'null plan → error');
    assert.match(resultNull.error, /plan/i, 'error mentions plan');
  });

  it('is_deterministic_first_n_moves', () => {
    // Same plan + same batch → identical result every time
    const r1 = computeMovesToApply({ plan: SAMPLE_PLAN, batch: 4, statusOutput: '' });
    const r2 = computeMovesToApply({ plan: SAMPLE_PLAN, batch: 4, statusOutput: '' });
    assert.deepEqual(r1.moves, r2.moves, 'deterministic: identical on repeat');

    // Shuffled plan should still produce same first-4 (plan is pre-sorted by planner)
    // But apply-core trusts plan order — it does NOT re-sort.
    // So shuffled input → different first-4 (this is correct: the planner is responsible for ordering).
    const shuffled = [...SAMPLE_PLAN].reverse();
    const r3 = computeMovesToApply({ plan: shuffled, batch: 4, statusOutput: '' });
    // r3 should use first 4 of shuffled, which differ from first 4 of original
    assert.equal(r3.moves.length, 4);
    assert.equal(r3.moves[0].from, shuffled[0].from, 'uses plan order as-is');
  });

  it('batch_zero_applies_nothing', () => {
    const result = computeMovesToApply({
      plan: SAMPLE_PLAN,
      batch: 0,
      statusOutput: '',
    });
    assert.equal(result.ok, true);
    assert.equal(result.moves.length, 0, 'batch 0 → no moves');
  });

  it('clean_tree_with_untracked_only_is_dirty', () => {
    // Untracked files also make the tree "dirty" for our purposes
    const result = computeMovesToApply({
      plan: SAMPLE_PLAN,
      batch: 10,
      statusOutput: '?? new-file.txt\n',
    });
    // We treat ANY non-empty porcelain output as dirty
    assert.equal(result.ok, false, 'untracked files = dirty');
  });
});
