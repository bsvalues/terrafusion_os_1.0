import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runEvents(cwd, extraArgs = []) {
  return spawnSync(process.execPath, [localAgentCli, 'events', ...extraArgs], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function makeTempRepo() {
  return mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-events-'));
}

function seedEvents(tempRoot, events) {
  mkdirSync(resolve(tempRoot, '.terrafusion'), { recursive: true });
  writeFileSync(
    resolve(tempRoot, '.terrafusion/agent-events.jsonl'),
    events.map(e => JSON.stringify(e)).join('\n') + '\n',
    'utf8',
  );
}

describe('Local agent events', () => {
  it('reports an empty repo without throwing', () => {
    const tempRoot = makeTempRepo();
    const result = runEvents(tempRoot);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
    assert.match(result.stdout, /TerraFusion Local Agent — events/);
    assert.match(result.stdout, /\(no events recorded\)/);
  });

  it('prints last 20 by default in newest-first order with ISO timestamps', () => {
    const tempRoot = makeTempRepo();
    const events = [];
    for (let i = 0; i < 30; i++) {
      events.push({ ts: 1700000000 + i, type: `evt_${i}`, payload: { i } });
    }
    seedEvents(tempRoot, events);

    const result = runEvents(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Showing newest 20 of 30 parsed/);
    // Newest first: evt_29 must appear before evt_10.
    const idx29 = result.stdout.indexOf('evt_29');
    const idx10 = result.stdout.indexOf('evt_10');
    assert.ok(idx29 >= 0 && idx10 > idx29, 'evt_29 should print before evt_10');
    // Oldest 10 events must not appear.
    assert.equal(result.stdout.includes('evt_0 '), false);
    assert.equal(result.stdout.includes('evt_9 '), false);
    // ISO timestamp present.
    assert.match(result.stdout, /20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('honors --tail N within range', () => {
    const tempRoot = makeTempRepo();
    const events = [];
    for (let i = 0; i < 10; i++) events.push({ ts: 1700000000 + i, type: 't', payload: {} });
    seedEvents(tempRoot, events);

    const result = runEvents(tempRoot, ['--tail', '3']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Showing newest 3 of 10 parsed/);
  });

  it('clamps invalid --tail to default (20) without throwing', () => {
    const tempRoot = makeTempRepo();
    const events = [];
    for (let i = 0; i < 25; i++) events.push({ ts: 1700000000 + i, type: 't', payload: {} });
    seedEvents(tempRoot, events);

    const result = runEvents(tempRoot, ['--tail', 'banana']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Showing newest 20 of 25 parsed/);
  });

  it('filters by --type and reports no-match cleanly', () => {
    const tempRoot = makeTempRepo();
    seedEvents(tempRoot, [
      { ts: 1700000001, type: 'alpha', payload: { ok: true } },
      { ts: 1700000002, type: 'beta', payload: {} },
      { ts: 1700000003, type: 'alpha', payload: { ok: false } },
    ]);

    const ok = runEvents(tempRoot, ['--type', 'alpha']);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /type=alpha/);
    assert.match(ok.stdout, /alpha/);
    assert.equal(ok.stdout.includes('beta'), false);

    const miss = runEvents(tempRoot, ['--type', 'gamma']);
    assert.equal(miss.status, 0, miss.stderr);
    assert.match(miss.stdout, /\(no matching events\)/);
  });

  it('skips malformed JSONL lines without throwing', () => {
    const tempRoot = makeTempRepo();
    mkdirSync(resolve(tempRoot, '.terrafusion'), { recursive: true });
    const lines = [
      JSON.stringify({ ts: 1700000001, type: 'good', payload: {} }),
      '{not json',
      '',
      JSON.stringify({ ts: 1700000002, type: 'good_two', payload: {} }),
    ];
    writeFileSync(resolve(tempRoot, '.terrafusion/agent-events.jsonl'), lines.join('\n'), 'utf8');

    const result = runEvents(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Showing newest 2 of 2 parsed/);
    assert.match(result.stdout, /good_two/);
  });
});
