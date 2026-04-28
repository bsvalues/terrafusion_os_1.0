import assert from 'node:assert';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runStatus(cwd) {
  return spawnSync(process.execPath, [localAgentCli, 'status'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function makeTempRepo() {
  return mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-status-'));
}

function seedDir(tempRoot) {
  mkdirSync(resolve(tempRoot, '.terrafusion'), { recursive: true });
}

describe('Local agent status', () => {
  it('reports an empty repo without throwing and recommends start', () => {
    const tempRoot = makeTempRepo();
    const result = runStatus(tempRoot);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
    assert.match(result.stdout, /TerraFusion Local Agent — status/);
    assert.match(result.stdout, /Card:\n {2}\(none\)/);
    assert.match(result.stdout, /Proof:\n {2}\(none\)/);
    assert.match(result.stdout, /Pending patches: 0/);
    assert.match(result.stdout, /Next:/);
    assert.match(result.stdout, /tf:local-agent -- start/);
  });

  it('surfaces a locked card with task and mode', () => {
    const tempRoot = makeTempRepo();
    seedDir(tempRoot);
    const payload = {
      lockedAt: 1700000000,
      card: { id: 'demo', task: 'Demo task line', mode: 'Patch' },
    };
    writeFileSync(
      resolve(tempRoot, '.terrafusion/current-work-card.json'),
      JSON.stringify(payload),
      'utf8',
    );

    const result = runStatus(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Task: Demo task line/);
    assert.match(result.stdout, /Mode: Patch/);
  });

  it('surfaces proof verdict and failing gate count when proof exists', () => {
    const tempRoot = makeTempRepo();
    seedDir(tempRoot);
    const proof = {
      ok: false,
      workCardId: 'demo',
      task: 'demo',
      startedAt: 0,
      finishedAt: 1700000001,
      results: [
        { ok: true, gate: 'a' },
        { ok: false, gate: 'b' },
        { ok: false, gate: 'c' },
      ],
    };
    writeFileSync(
      resolve(tempRoot, '.terrafusion/proof-results.json'),
      JSON.stringify(proof),
      'utf8',
    );

    const result = runStatus(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Last run: FAIL/);
    assert.match(result.stdout, /Failing gates: 2/);
  });

  it('counts pending patches and surfaces last 3 events newest-first', () => {
    const tempRoot = makeTempRepo();
    seedDir(tempRoot);
    mkdirSync(resolve(tempRoot, '.terrafusion/patches'), { recursive: true });
    writeFileSync(resolve(tempRoot, '.terrafusion/patches/p1.json'), '{}', 'utf8');
    writeFileSync(resolve(tempRoot, '.terrafusion/patches/p2.json'), '{}', 'utf8');
    writeFileSync(resolve(tempRoot, '.terrafusion/patches/note.txt'), 'ignore me', 'utf8');

    const events = [
      { ts: 1700000001, type: 'event_one' },
      { ts: 1700000002, type: 'event_two' },
      { ts: 1700000003, type: 'event_three' },
      { ts: 1700000004, type: 'event_four' },
    ];
    writeFileSync(
      resolve(tempRoot, '.terrafusion/agent-events.jsonl'),
      events.map(e => JSON.stringify(e)).join('\n') + '\n',
      'utf8',
    );

    const result = runStatus(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Pending patches: 2/);
    // Last 3 events, newest first.
    const idxFour = result.stdout.indexOf('event_four');
    const idxThree = result.stdout.indexOf('event_three');
    const idxTwo = result.stdout.indexOf('event_two');
    assert.ok(idxFour >= 0 && idxThree > idxFour && idxTwo > idxThree, 'events ordered newest-first');
    assert.equal(result.stdout.includes('event_one'), false, 'oldest event beyond limit must be omitted');
  });

  it('does not write any files into .terrafusion (read-only)', () => {
    const tempRoot = makeTempRepo();
    const result = runStatus(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    const created = resolve(tempRoot, '.terrafusion');
    assert.equal(existsSync(created), false, 'status must be read-only on a fresh repo');
  });
});
