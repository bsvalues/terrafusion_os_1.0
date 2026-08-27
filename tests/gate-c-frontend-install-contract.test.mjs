import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const FRONTEND = join(ROOT, 'frontend');
const GATE_C = join(ROOT, 'ops', 'scripts', 'gate-c-core-bringup.sh');

describe('Gate C frontend dependency installation', () => {
  it('selects the canonical frontend package and fails closed on selector drift', () => {
    const frontendPackage = JSON.parse(readFileSync(join(FRONTEND, 'package.json'), 'utf8'));
    const gateScript = readFileSync(GATE_C, 'utf8');

    assert.equal(frontendPackage.name, 'terrafusion-frontend');
    assert.match(gateScript, /--filter "terrafusion-frontend\.\.\."/);
    assert.match(gateScript, /--fail-if-no-match/);
    assert.doesNotMatch(gateScript, /--filter "\.\/frontend\.\.\."/);
  });

  it('resolves the canonical selector when invoked from the frontend directory', () => {
    const selectorArgs = [
      '--dir',
      ROOT,
      '--filter',
      'terrafusion-frontend...',
      '--fail-if-no-match',
      'list',
      '--depth',
      '-1',
    ];
    const command = process.platform === 'win32' ? process.env.ComSpec : 'pnpm';
    const commandArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'pnpm', ...selectorArgs]
        : selectorArgs;
    const result = spawnSync(command, commandArgs, { cwd: FRONTEND, encoding: 'utf8' });

    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /terrafusion-frontend@/);
  });
});
