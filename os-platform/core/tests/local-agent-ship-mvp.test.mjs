import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentShipMvpRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
});

describe('Local agent ship mvp', () => {
  it('writes release notes and docs index and does not create a git tag', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-ship-mvp-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      spawnSync('git', ['init'], { cwd: root, encoding: 'utf8', windowsHide: true });
      const report = new LocalAgentShipMvpRunner(root).run('release', true);
      const stepNames = new Set(report.steps.map(step => step.name));
      assert.ok(stepNames.has('Release Notes'));
      assert.ok(stepNames.has('Docs Index'));
      assert.ok(stepNames.has('Release Bundle'));
      assert.equal(spawnSync('git', ['tag', '--list', 'v0.1.0'], { cwd: root, encoding: 'utf8', windowsHide: true }).stdout.trim(), '');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});