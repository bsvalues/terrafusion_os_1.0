/**
 * tf canon CLI — self-test.
 *
 * Thin headless command rail over the read-only Canon runtime. runCli(argv) is
 * pure (returns {code, lines}); the CLI main guard prints + exits.
 * Run: node --test os-platform/core/tests/tf-canon.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { runCli } from '../canon/tf-canon.mjs';

const json = (r) => JSON.parse(r.lines.join('\n'));

test('CLI.1 query <path> reports owner and risk (text)', () => {
  const r = runCli(['query', 'frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx']);
  assert.equal(r.code, 0);
  const out = r.lines.join('\n');
  assert.match(out, /os-shell/);
  assert.match(out, /high/);
});

test('CLI.2 query --json emits structured owner/risk/gates/rules', () => {
  const r = runCli(['query', 'os-platform/core/canon/canon-loader.mjs', '--json']);
  assert.equal(r.code, 0);
  const o = json(r);
  assert.equal(o.owner, 'canon-runtime');
  assert.ok(o.risk && typeof o.risk.level === 'string');
  assert.ok(Array.isArray(o.requiredGates));
  assert.ok(Array.isArray(o.rules));
});

test('CLI.3 risk <path> --json returns level', () => {
  const r = runCli(['risk', 'docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md', '--json']);
  assert.equal(r.code, 0);
  assert.equal(json(r).level, 'low');
});

test('CLI.4 rules --task matches os-canon surface rules', () => {
  const r = runCli(['rules', '--task', 'fix os-canon shell launch drift', '--json']);
  assert.equal(r.code, 0);
  const rules = json(r);
  assert.ok(rules.some((x) => x.ruleId === 'surface.os-canon.in-shell'));
});

test('CLI.5 gates --strict on a protected path exits non-zero', () => {
  const r = runCli(['gates', '--strict', 'ARCHIVE/old.ts']);
  assert.equal(r.code, 1);
});

test('CLI.6 gates (advisory) on a protected path exits 0', () => {
  const r = runCli(['gates', 'ARCHIVE/old.ts']);
  assert.equal(r.code, 0);
});

test('CLI.7 help exits 0 with usage', () => {
  const r = runCli(['help']);
  assert.equal(r.code, 0);
  assert.match(r.lines.join('\n'), /usage/i);
});

test('CLI.8 no args prints usage (code 0)', () => {
  const r = runCli([]);
  assert.equal(r.code, 0);
  assert.match(r.lines.join('\n'), /usage/i);
});

test('CLI.9 unknown command exits 2', () => {
  const r = runCli(['frobnicate']);
  assert.equal(r.code, 2);
});

test('CLI.10 query without a path exits 2', () => {
  const r = runCli(['query']);
  assert.equal(r.code, 2);
});

test('CLI.11 runCli never throws on odd input', () => {
  assert.doesNotThrow(() => runCli(undefined));
});
