import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const localAgentCli = resolve(repoRoot, 'os-platform/core/pilot/local-agent/cli.js');

function runDocTruth(cwd, files = []) {
  return spawnSync(process.execPath, [localAgentCli, 'doc-truth', ...files], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function makeTempRepo() {
  return mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-doc-truth-'));
}

function seed(tempRoot, relativePath, content) {
  const full = resolve(tempRoot, relativePath);
  mkdirSync(resolve(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf8');
}

describe('Local agent doc-truth', () => {
  it('passes when all referenced verbs are real', () => {
    const tempRoot = makeTempRepo();
    seed(
      tempRoot,
      'good.md',
      [
        '# Good doc',
        '',
        '```bash',
        'pnpm run tf:local-agent -- proof',
        'pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"',
        'pnpm run tf:local-agent -- status',
        '```',
      ].join('\n'),
    );
    const result = runDocTruth(tempRoot, ['good.md']);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
    assert.match(result.stdout, /Violations:\s+0/);
    assert.match(result.stdout, /All referenced verbs exist in the command registry/);
  });

  it('fails with file:line:verb when a doc references an unknown verb', () => {
    const tempRoot = makeTempRepo();
    seed(
      tempRoot,
      'bad.md',
      [
        '# Bad doc',
        '',
        'pnpm run tf:local-agent -- not-a-real-verb',
        'pnpm run tf:local-agent -- another-fake-verb',
      ].join('\n'),
    );
    const result = runDocTruth(tempRoot, ['bad.md']);
    assert.equal(result.status, 1, `expected exit 1, got ${result.status}`);
    assert.match(result.stdout, /Violations:\s+2/);
    assert.match(result.stdout, /bad\.md:3\s+unknown verb: not-a-real-verb/);
    assert.match(result.stdout, /bad\.md:4\s+unknown verb: another-fake-verb/);
  });

  it('soft-skips missing files without throwing', () => {
    const tempRoot = makeTempRepo();
    const result = runDocTruth(tempRoot, ['does-not-exist.md']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Scanned files: 0 \(skipped 1\)/);
  });

  it('exit 0 when no files are referenced anywhere (empty doc)', () => {
    const tempRoot = makeTempRepo();
    seed(tempRoot, 'empty.md', '# Just a heading\n\nNo CLI references here.\n');
    const result = runDocTruth(tempRoot, ['empty.md']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /References:\s+0/);
    assert.match(result.stdout, /Violations:\s+0/);
  });

  it('default scan list covers both CHANGELOG.md and FOUNDER_QUICKSTART.md', () => {
    const result = runDocTruth(repoRoot);
    assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
    assert.match(result.stdout, /Scanned files: 2 \(skipped 0\)/);
    assert.match(result.stdout, /Violations:\s+0/);
  });
});
