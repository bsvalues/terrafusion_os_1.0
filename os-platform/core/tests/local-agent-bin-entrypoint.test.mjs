import assert from 'node:assert';
import { mkdtempSync, existsSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const tfBin = resolve(repoRoot, 'tools/bin/tf.mjs');
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runTf(args, options = {}) {
  return spawnSync(process.execPath, [tfBin, ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('tf agent founder entrypoint', () => {
  it('exposes an "agent" subcommand in tf --help', () => {
    const result = runTf(['--help']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\bagent\b/);
    assert.match(result.stdout, /Local Agent/i);
  });

  it('delegates to the local-agent CLI when invoked with no agent args', () => {
    assert.ok(
      existsSync(localAgentCli),
      `expected generated local-agent CLI at ${localAgentCli}; run pnpm run build:core-js`,
    );
    const result = runTf(['agent']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /TerraFusion Local Agent/);
    assert.match(result.stdout, /Commands:/);
  });

  it('forwards subcommand args verbatim including --repo-root from an external cwd', () => {
    const externalCwd = mkdtempSync(resolve(os.tmpdir(), 'tf-agent-external-cwd-'));
    const result = runTf(['agent', 'help-me', '--repo-root', repoRoot], {
      cwd: externalCwd,
    });
    assert.equal(result.status, 0, result.stderr);
    // help-me prints the founder next-step recommendation derived from the
    // governed pilot surface; smoke-check it ran against the real repo root.
    assert.ok(result.stdout.length > 0, 'expected help-me output');
  });

  it('propagates the local-agent CLI exit code for unknown subcommands', () => {
    const result = runTf(['agent', '__definitely_not_a_real_verb__']);
    // local-agent CLI returns 1 for unknown command; tf agent must surface it.
    assert.equal(result.status, 1);
  });
});
