import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentCommandRegistryBuilder;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentCommandRegistryBuilder = pilot.LocalAgentCommandRegistryBuilder;
});

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent command registry', () => {
  it('writes registry json and markdown with core commands', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-command-registry-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const registry = new LocalAgentCommandRegistryBuilder(root).build();
      assert.ok(registry.commandCount >= 10);
      assert.ok(registry.globalOptions.some(option => option.name === '--repo-root'));
      assert.ok(registry.commands.some(command => command.name === 'control-center-state'));
      assert.ok(registry.commands.some(command => command.name === 'next'));

      const payload = JSON.parse(readFileSync(resolve(root, '.terrafusion/command-registry.json'), 'utf8'));
      assert.ok(Array.isArray(payload.commands));
      assert.ok(Array.isArray(payload.globalOptions));
      assert.match(readFileSync(resolve(root, '.terrafusion/command-registry.md'), 'utf8'), /--repo-root/);
      assert.match(readFileSync(resolve(root, '.terrafusion/command-registry.md'), 'utf8'), /Authority Boundary/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the command-registry CLI command', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-command-registry-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCli(root, 'command-registry');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /TerraFusion Command Registry/);
      assert.match(result.stdout, /command-registry.json/);
      assert.match(result.stdout, /command-registry.md/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});