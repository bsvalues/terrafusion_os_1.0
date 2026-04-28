import assert from 'node:assert';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runRelease(cwd) {
  return spawnSync(process.execPath, [localAgentCli, 'release'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function makeTempRepo() {
  return mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-'));
}

function seed(tempRoot, artifacts) {
  mkdirSync(resolve(tempRoot, '.terrafusion'), { recursive: true });
  for (const name of artifacts) {
    writeFileSync(resolve(tempRoot, '.terrafusion', name), '{}', 'utf8');
  }
}

describe('Local agent release plan', () => {
  it('on an empty repo, recommends release-notes as the next step', () => {
    const tempRoot = makeTempRepo();
    const result = runRelease(tempRoot);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
    assert.match(result.stdout, /TerraFusion Local Agent — release plan/);
    assert.match(result.stdout, /\[ \] release-notes/);
    assert.match(result.stdout, /\[ \] tag-command/);
    assert.match(result.stdout, /Next:/);
    assert.match(result.stdout, /tf:local-agent -- release-notes/);
  });

  it('skips completed early steps and recommends the first missing one', () => {
    const tempRoot = makeTempRepo();
    seed(tempRoot, ['release-notes-0.1.0.json', 'release-check-report.json']);
    const result = runRelease(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\[x\] release-notes/);
    assert.match(result.stdout, /\[x\] release-check/);
    assert.match(result.stdout, /\[ \] release-freeze/);
    assert.match(result.stdout, /Next:/);
    assert.match(result.stdout, /tf:local-agent -- release-freeze/);
  });

  it('reports complete when all 7 artifacts present', () => {
    const tempRoot = makeTempRepo();
    seed(tempRoot, [
      'release-notes-0.1.0.json',
      'release-check-report.json',
      'release-freeze-card.json',
      'tag-gate-report.json',
      'release-approval.json',
      'tag-command-report.json',
      'release-runbook-0.1.0.json',
    ]);
    const result = runRelease(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Release sequence complete/);
    assert.equal(result.stdout.includes('Next:\n'), false);
  });

  it('is read-only: does not create .terrafusion on a fresh repo', () => {
    const tempRoot = makeTempRepo();
    const result = runRelease(tempRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(resolve(tempRoot, '.terrafusion')), false);
  });
});
