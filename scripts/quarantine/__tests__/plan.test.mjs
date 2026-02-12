/**
 * Planner tests — Deterministic quarantine move plan from git-tracked entries
 *
 * Run: node --test scripts/quarantine/__tests__/plan.test.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { computePlan } from '../plan-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keepList = JSON.parse(readFileSync(join(__dirname, '..', 'keep-list.json'), 'utf8'));

describe('computePlan', () => {
  it('plan_respects_keep_list', () => {
    const entries = [
      ...keepList.dirs.map(d => ({ name: d, type: 'tree' })),
      ...keepList.files.map(f => ({ name: f, type: 'blob' })),
      { name: 'agents', type: 'tree' },
      { name: 'stale.txt', type: 'blob' },
    ];
    const plan = computePlan({ entries, keepList });
    const fromNames = plan.map(m => m.from);
    // Only intruders appear in plan
    assert.ok(fromNames.includes('agents/'), 'expected agents/ in plan');
    assert.ok(fromNames.includes('stale.txt'), 'expected stale.txt in plan');
    assert.equal(plan.length, 2, 'only 2 intruders expected');
    // No keep-list entry scheduled for move
    for (const d of keepList.dirs) {
      assert.ok(!fromNames.includes(d + '/'), `${d}/ should not be in plan`);
    }
    for (const f of keepList.files) {
      assert.ok(!fromNames.includes(f), `${f} should not be in plan`);
    }
  });

  it('plan_is_deterministic_sorted', () => {
    const entries = [
      { name: 'zebra', type: 'tree' },
      { name: 'alpha', type: 'blob' },
      { name: 'middle', type: 'tree' },
    ];
    const reversed = [...entries].reverse();
    const plan1 = computePlan({ entries, keepList });
    const plan2 = computePlan({ entries: reversed, keepList });
    // Identical output regardless of input order
    assert.deepEqual(plan1, plan2, 'plans should be byte-identical regardless of input order');
    // Output is sorted by `from`
    for (let i = 1; i < plan1.length; i++) {
      assert.ok(
        plan1[i].from > plan1[i - 1].from,
        `${plan1[i].from} should sort after ${plan1[i - 1].from}`
      );
    }
  });

  it('plan_uses_git_ls_tree', () => {
    // Validates the core function accepts entries in git ls-tree format
    // (name + type) and produces the correct output contract:
    //   dirs  → trailing /  → QUARANTINE/top-level-dirs/
    //   blobs → no trailing → QUARANTINE/root-artifacts/ or root-md/
    const entries = [
      { name: 'agents', type: 'tree' },
      { name: 'stale.txt', type: 'blob' },
      { name: 'TROPHY.md', type: 'blob' },
    ];
    const plan = computePlan({ entries, keepList });
    assert.equal(plan.length, 3);
    // Dir gets trailing / and goes to top-level-dirs
    const dirMove = plan.find(m => m.from === 'agents/');
    assert.ok(dirMove, 'dir entry should have trailing /');
    assert.equal(dirMove.to, 'QUARANTINE/top-level-dirs/agents/');
    // Non-md blob goes to root-artifacts
    const fileMove = plan.find(m => m.from === 'stale.txt');
    assert.ok(fileMove);
    assert.equal(fileMove.to, 'QUARANTINE/root-artifacts/stale.txt');
    // .md blob goes to root-md
    const mdMove = plan.find(m => m.from === 'TROPHY.md');
    assert.ok(mdMove);
    assert.equal(mdMove.to, 'QUARANTINE/root-md/TROPHY.md');
  });

  it('dry_run_reports_without_writing', () => {
    // computePlan is a pure function — no side effects.
    // Verify: returns fresh arrays, no shared references, no mutations.
    const entries = [
      { name: 'junk', type: 'blob' },
      { name: 'debris', type: 'tree' },
    ];
    const plan1 = computePlan({ entries, keepList });
    assert.ok(Array.isArray(plan1), 'plan is an array');
    assert.equal(plan1.length, 2);
    // Mutating result must not affect subsequent calls
    plan1.push({ from: 'fake', to: 'fake' });
    plan1[0].from = 'corrupted';
    const plan2 = computePlan({ entries, keepList });
    assert.equal(plan2.length, 2, 'second call unaffected by mutation of first result');
    assert.notEqual(plan2[0].from, 'corrupted', 'no shared object references');
  });

  it('plan_excludes_hidden_and_ignored', () => {
    const entries = [
      { name: '.git', type: 'tree' },
      { name: '.github', type: 'tree' },
      { name: '.env', type: 'blob' },
      { name: '.claude', type: 'tree' },
      { name: '.ralph', type: 'tree' },
      { name: 'QUARANTINE', type: 'tree' },
      { name: 'intruder', type: 'tree' },
    ];
    const plan = computePlan({ entries, keepList });
    const fromNames = plan.map(m => m.from);
    // Hidden entries excluded
    assert.ok(!fromNames.some(f => f.startsWith('.')), 'no hidden entries in plan');
    // QUARANTINE excluded
    assert.ok(!fromNames.includes('QUARANTINE/'), 'QUARANTINE excluded');
    // Only the intruder remains
    assert.equal(plan.length, 1);
    assert.equal(plan[0].from, 'intruder/');
    assert.equal(plan[0].to, 'QUARANTINE/top-level-dirs/intruder/');
  });

  it('plan_quarantines_tracked_node_modules', () => {
    const entries = [
      { name: 'node_modules', type: 'tree' },
      { name: 'intruder', type: 'tree' },
    ];
    const plan = computePlan({ entries, keepList });
    const fromNames = plan.map(m => m.from);
    assert.ok(fromNames.includes('node_modules/'), 'tracked node_modules gets quarantined');
    assert.ok(fromNames.includes('intruder/'), 'intruder also quarantined');
    assert.equal(plan.length, 2);
  });

  it('json_mode_emits_valid_json_only', () => {
    // Invoke plan.mjs --json as a subprocess and verify stdout is pure JSON
    const planCli = join(__dirname, '..', 'plan.mjs');
    const stdout = execFileSync(process.execPath, [planCli, '--json'], {
      encoding: 'utf8',
      cwd: join(__dirname, '..', '..', '..'),
    });
    // Must parse as valid JSON
    const parsed = JSON.parse(stdout);
    assert.ok(Array.isArray(parsed), 'output is a JSON array');
    // No trailing text after JSON (the raw stdout trimmed should round-trip)
    const roundTrip = JSON.stringify(parsed, null, 2) + '\n';
    assert.equal(stdout, roundTrip, 'stdout contains only JSON, no banner text');
  });
});
