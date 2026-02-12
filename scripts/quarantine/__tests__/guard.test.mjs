/**
 * Guard tests — Hard allowlist enforcement + SEAL coupling
 *
 * Run: node --test scripts/quarantine/__tests__/guard.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkSealAllowlist, checkShape } from '../../repo-shape-guard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keepList = JSON.parse(readFileSync(join(__dirname, '..', 'keep-list.json'), 'utf8'));

// ── checkShape ──────────────────────────────────────────────────────

describe('checkShape', () => {
  it('passes with exact allowlist shape', () => {
    const rootEntries = [
      ...keepList.dirs,
      ...keepList.files,
      '.git',
      '.github',
      '.gitignore',
      '.husky', // hidden — auto-ignored
      'node_modules', // ignored
      'QUARANTINE', // ignored
    ];
    const result = checkShape(rootEntries, keepList);
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.missingDirs, []);
    assert.deepEqual(result.missingFiles, []);
  });

  it('fails when non-allowlisted root entries exist', () => {
    const rootEntries = [...keepList.dirs, ...keepList.files, 'extra-dir', 'stale-artifact.txt'];
    const result = checkShape(rootEntries, keepList);
    assert.ok(result.violations.includes('extra-dir'), 'expected extra-dir in violations');
    assert.ok(
      result.violations.includes('stale-artifact.txt'),
      'expected stale-artifact.txt in violations'
    );
    assert.equal(result.violations.length, 2);
  });

  it('detects missing keep-list dirs (soft warning)', () => {
    const rootEntries = [...keepList.dirs.filter(d => d !== 'backend'), ...keepList.files];
    const result = checkShape(rootEntries, keepList);
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.missingDirs, ['backend']);
    assert.deepEqual(result.missingFiles, []);
  });

  it('detects missing keep-list files (hard fail)', () => {
    const rootEntries = [...keepList.dirs, ...keepList.files.filter(f => f !== 'package.json')];
    const result = checkShape(rootEntries, keepList);
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.missingDirs, []);
    assert.deepEqual(result.missingFiles, ['package.json']);
  });

  it('ignores hidden entries, node_modules, and QUARANTINE', () => {
    const rootEntries = [
      ...keepList.dirs,
      ...keepList.files,
      '.hidden-dir',
      '.env',
      '.claude',
      'QUARANTINE',
      'node_modules',
    ];
    const result = checkShape(rootEntries, keepList);
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.missingDirs, []);
    assert.deepEqual(result.missingFiles, []);
  });
});

// ── checkSealAllowlist ──────────────────────────────────────────────

describe('checkSealAllowlist', () => {
  it('passes when all required patterns present', () => {
    const content = [
      'grep -v -E "',
      'frontend/Dockerfile',
      '|frontend/nginx\\.conf',
      '|frontend/pnpm-lock\\.yaml',
      '|frontend/\\.dockerignore',
      '"',
    ].join('');
    const missing = checkSealAllowlist(content);
    assert.deepEqual(missing, []);
  });

  it('detects missing SEAL allowlist entries', () => {
    const content = 'grep -v -E "frontend/Dockerfile|frontend/nginx\\.conf"';
    const missing = checkSealAllowlist(content);
    assert.ok(missing.includes('frontend/pnpm-lock\\.yaml'));
    assert.ok(missing.includes('frontend/\\.dockerignore'));
    assert.equal(missing.length, 2);
  });
});
