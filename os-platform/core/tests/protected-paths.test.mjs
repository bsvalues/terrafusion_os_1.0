/**
 * Advisory gate: protected-paths — self-test.
 *
 * Run: node --test os-platform/core/tests/protected-paths.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { isProtectedPath, checkProtectedPaths, PROTECTED_PATTERNS } from '../gates/check-protected-paths.mjs';

test('PP.0 has a non-empty protected pattern list', () => {
  assert.ok(Array.isArray(PROTECTED_PATTERNS) && PROTECTED_PATTERNS.length > 0);
});

test('PP.1 ARCHIVE path is protected', () => {
  assert.equal(isProtectedPath('ARCHIVE/old/thing.ts'), true);
});

test('PP.2 specialized path is protected', () => {
  assert.equal(isProtectedPath('specialized/ai-swarm/agent.cs'), true);
});

test('PP.3 normal runtime path is not protected', () => {
  assert.equal(isProtectedPath('os-platform/core/canon/canon-query.mjs'), false);
});

test('PP.4 checkProtectedPaths returns one finding per protected path', () => {
  const findings = checkProtectedPaths([
    'ARCHIVE/x.ts',
    'frontend/apps/os-shell/src/canon/CanonEditor.tsx',
    'specialized/y.cs',
  ]);
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => typeof f.path === 'string' && typeof f.pattern === 'string'));
});

test('PP.5 never throws on odd input', () => {
  assert.doesNotThrow(() => checkProtectedPaths(undefined));
  assert.doesNotThrow(() => isProtectedPath(undefined));
  assert.equal(isProtectedPath(undefined), false);
});

test('PP.6 handles Windows-style separators', () => {
  assert.equal(isProtectedPath('ARCHIVE\\nested\\file.ts'), true);
});
