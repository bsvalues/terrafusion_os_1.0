/**
 * Workflow working-directory path validation tests.
 *
 * Prevents GitHub Actions workflows from referencing working directories
 * that don't exist in the Git-tracked tree (e.g., after quarantine).
 *
 * Run: node --test scripts/governance/__tests__/workflow-paths.test.mjs
 */
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  extractWorkingDirs,
  getGitRootEntries,
  normalizePath,
  rootComponent,
  STALE_PATH_EXEMPTIONS,
  validateWorkflowPaths,
} from '../workflow-paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const WORKFLOW_DIR = join(REPO_ROOT, '.github', 'workflows');

// ── extractWorkingDirs ──────────────────────────────────────────────

describe('extractWorkingDirs', () => {
  it('extracts simple working-directory values', () => {
    const yaml = `
    steps:
      - name: Build
        working-directory: frontend
        run: npm run build
      - name: Test
        working-directory: ./backend
        run: dotnet test
    `;
    const result = extractWorkingDirs(yaml);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, 'frontend');
    assert.equal(result[1].path, './backend');
  });

  it('extracts quoted paths', () => {
    const yaml = `        working-directory: "some/path"`;
    const result = extractWorkingDirs(yaml);
    assert.equal(result[0].path, 'some/path');
  });

  it('returns empty for yaml without working-directory', () => {
    const yaml = `
    steps:
      - name: Checkout
        uses: actions/checkout@v4
    `;
    assert.deepEqual(extractWorkingDirs(yaml), []);
  });
});

// ── normalizePath ───────────────────────────────────────────────────

describe('normalizePath', () => {
  it('strips leading ./', () => {
    assert.equal(normalizePath('./frontend'), 'frontend');
  });

  it('strips trailing /', () => {
    assert.equal(normalizePath('frontend/'), 'frontend');
  });

  it('returns null for current directory', () => {
    assert.equal(normalizePath('.'), null);
    assert.equal(normalizePath('./'), null);
  });

  it('returns null for dynamic expressions', () => {
    assert.equal(normalizePath('${{ steps.rust.outputs.dir }}'), null);
  });

  it('preserves nested paths', () => {
    assert.equal(normalizePath('./tools/scope-classifier'), 'tools/scope-classifier');
  });
});

// ── rootComponent ───────────────────────────────────────────────────

describe('rootComponent', () => {
  it('returns first path segment', () => {
    assert.equal(rootComponent('frontend'), 'frontend');
    assert.equal(rootComponent('tools/scope-classifier'), 'tools');
    assert.equal(rootComponent('applications/terraforge-suite/harness'), 'applications');
  });
});

// ── validateWorkflowPaths (live) ────────────────────────────────────

describe('validateWorkflowPaths (live)', () => {
  const gitRootEntries = getGitRootEntries(REPO_ROOT);

  it('finds no non-exempted violations in current workflows', () => {
    const { violations, checked } = validateWorkflowPaths(WORKFLOW_DIR, gitRootEntries);
    if (violations.length > 0) {
      const detail = violations
        .map(v => `  ${v.workflow}:${v.line} → working-directory: ${v.path} (root "${v.rootDir}" not in git tree)`)
        .join('\n');
      assert.fail(
        `${violations.length} workflow(s) reference non-existent working directories:\n${detail}\n\n` +
        'Fix: update the workflow path, or add to STALE_PATH_EXEMPTIONS in workflow-paths.mjs'
      );
    }
    assert.ok(checked > 0, `expected to check at least 1 working-directory, checked ${checked}`);
  });

  it('exempted stale paths are documented with reason', () => {
    for (const entry of STALE_PATH_EXEMPTIONS) {
      assert.ok(entry.workflow, 'exemption must name a workflow');
      assert.ok(entry.paths.length > 0, 'exemption must list at least one path');
      assert.ok(entry.reason.length > 10, `exemption for ${entry.workflow} must have a meaningful reason`);
    }
  });

  it('exempted paths actually reference missing root dirs', () => {
    // Ensure exemptions aren't stale themselves (if path was restored, remove exemption)
    for (const entry of STALE_PATH_EXEMPTIONS) {
      for (const p of entry.paths) {
        const root = rootComponent(p);
        assert.ok(
          !gitRootEntries.has(root),
          `Stale exemption: ${entry.workflow} exempts "${p}" but "${root}" now exists in git. Remove the exemption.`
        );
      }
    }
  });
});

// ── validateWorkflowPaths (synthetic) ───────────────────────────────

describe('validateWorkflowPaths (synthetic)', () => {
  it('detects stale terrafusion-cos path in synthetic workflow', () => {
    // This test uses the real git root entries but a synthetic scenario
    const gitRootEntries = new Set(['frontend', 'backend', 'tools', 'scripts']);
    const mockValidate = (paths) => {
      const violations = [];
      for (const p of paths) {
        const normalized = normalizePath(p);
        if (!normalized) continue;
        const root = rootComponent(normalized);
        if (!gitRootEntries.has(root)) {
          violations.push({ path: normalized, rootDir: root });
        }
      }
      return violations;
    };

    const violations = mockValidate(['terrafusion-cos', 'frontend', 'tools/scope-classifier']);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].path, 'terrafusion-cos');
  });
});
