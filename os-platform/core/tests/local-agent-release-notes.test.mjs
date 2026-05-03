import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentReleaseNotesBuilder;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentReleaseNotesBuilder = pilot.LocalAgentReleaseNotesBuilder;
});

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
}

describe('Local agent release notes', () => {
  it('writes changelog and release note artifacts', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-notes-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const notes = new LocalAgentReleaseNotesBuilder(root).build();
      assert.equal(notes.version, '0.1.0');
      assert.equal(notes.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(notes.internalCodename, 'Prometheus');
      assert.match(readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8'), /0.1.0/);
      assert.match(readFileSync(resolve(root, '.terrafusion/release-notes-0.1.0.md'), 'utf8'), /Authority Boundary/);
      assert.match(readFileSync(resolve(root, '.terrafusion/release-notes-0.1.0.md'), 'utf8'), /Prometheus is not a model/);
      const payload = JSON.parse(readFileSync(resolve(root, '.terrafusion/release-notes-0.1.0.json'), 'utf8'));
      assert.equal(payload.version, '0.1.0');
      assert.equal(payload.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(payload.internalCodename, 'Prometheus');
      assert.ok(payload.capabilities.some(item => /tag command/i.test(item)));
      assert.ok(payload.countySafePosture.some(item => /OpenMythos is only one optional local model backend/i.test(item)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the release-notes CLI command', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-notes-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCli(root, 'release-notes');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /TerraFusion Release Notes/);
      assert.match(result.stdout, /CHANGELOG\.md/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});