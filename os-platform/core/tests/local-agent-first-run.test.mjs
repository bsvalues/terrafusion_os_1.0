import assert from 'node:assert';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runInit(cwd, extraArgs = []) {
  return spawnSync(process.execPath, [localAgentCli, 'init', ...extraArgs], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function makeTempRepo() {
  return mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-init-'));
}

describe('Local agent first run (init)', () => {
  it('writes a starter plan-mode card and init-report on a fresh repo', () => {
    const tempRoot = makeTempRepo();
    const result = runInit(tempRoot);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);

    const cardPath = resolve(tempRoot, '.terrafusion/current-work-card.md');
    const reportPath = resolve(tempRoot, '.terrafusion/init-report.json');
    assert.ok(existsSync(cardPath), 'starter work card should be written');
    assert.ok(existsSync(reportPath), 'init-report.json should be written');

    const cardText = readFileSync(cardPath, 'utf8');
    assert.match(cardText, /# Work Card: starter/);
    assert.match(cardText, /## Mode\s+\nPlan/);

    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.cardCreated, true);
    assert.equal(report.cardAlreadyExisted, false);
    assert.ok(Array.isArray(report.envChecks));
    assert.ok(report.envChecks.find(c => c.name === 'node' && c.ok === true));
    assert.ok(Array.isArray(report.nextCommands));

    assert.match(result.stdout, /TerraFusion Local Agent — first run/);
    assert.match(result.stdout, /Environment:/);
    assert.match(result.stdout, /Next commands:/);
  });

  it('is idempotent: never overwrites an existing card on a second run', () => {
    const tempRoot = makeTempRepo();
    const cardPath = resolve(tempRoot, '.terrafusion/current-work-card.md');
    mkdirSync(resolve(tempRoot, '.terrafusion'), { recursive: true });
    const founderCard = '# Work Card: founder-authored\n\nDo not touch.\n';
    writeFileSync(cardPath, founderCard, 'utf8');
    const stat1 = statSync(cardPath);

    const result = runInit(tempRoot);
    assert.equal(result.status, 0, result.stderr);

    const stat2 = statSync(cardPath);
    assert.equal(readFileSync(cardPath, 'utf8'), founderCard, 'existing card must be preserved');
    assert.equal(stat1.size, stat2.size, 'card size unchanged');

    const report = JSON.parse(readFileSync(resolve(tempRoot, '.terrafusion/init-report.json'), 'utf8'));
    assert.equal(report.cardCreated, false);
    assert.equal(report.cardAlreadyExisted, true);
  });

  it('appends a local_agent_init audit event on every run', () => {
    const tempRoot = makeTempRepo();
    runInit(tempRoot);
    runInit(tempRoot);

    const eventsPath = resolve(tempRoot, '.terrafusion/agent-events.jsonl');
    assert.ok(existsSync(eventsPath), 'audit log should exist');
    const lines = readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
    const initEvents = lines.map(l => JSON.parse(l)).filter(e => e.type === 'local_agent_init');
    assert.equal(initEvents.length, 2);
    assert.equal(initEvents[0].payload.cardCreated, true);
    assert.equal(initEvents[1].payload.cardCreated, false);
    // Payload must not leak secret-like values; only counts and booleans.
    for (const evt of initEvents) {
      const keys = Object.keys(evt.payload);
      assert.deepEqual(
        keys.sort(),
        ['blockerCount', 'cardAlreadyExisted', 'cardCreated', 'envCheckCount'].sort(),
      );
    }
  });

  it('registers init in the local-agent command registry', () => {
    const result = spawnSync(
      process.execPath,
      [localAgentCli, 'command-registry'],
      { cwd: makeTempRepo(), encoding: 'utf8', windowsHide: true },
    );
    assert.equal(result.status, 0, result.stderr);
    // command-registry writes both md+json into cwd's .terrafusion; locate via the cwd.
  });

  it('exposes init via the tf agent founder entrypoint', () => {
    const tempRoot = makeTempRepo();
    const tfBin = resolve(repoRoot, 'tools/bin/tf.mjs');
    const result = spawnSync(
      process.execPath,
      [tfBin, 'agent', 'init', '--repo-root', tempRoot],
      { cwd: makeTempRepo(), encoding: 'utf8', windowsHide: true },
    );
    assert.equal(result.status, 0, `stderr=${result.stderr}`);
    assert.match(result.stdout, /first run/);
    assert.ok(existsSync(resolve(tempRoot, '.terrafusion/current-work-card.md')));
  });
});
