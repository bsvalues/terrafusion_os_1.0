/**
 * Workflow Inventory — integration tests (thin I/O).
 *
 * Validates git-truth inventory scanning against the real repo.
 * Uses actual git ls-tree + file reads but no external services.
 *
 * Zero dependencies — Node built-in test runner.
 */
import { strict as assert } from 'node:assert';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';

import {
  buildInventory,
  parseTriggers,
  REQUIRED_WORKFLOW_FILES,
} from '../workflow-inventory-core.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');
const WORKFLOWS_DIR = join(REPO_ROOT, '.github', 'workflows');

// ────────────────────────────────────────────────────────────────────────────
// Suite 1: Git-truth enumeration
// ────────────────────────────────────────────────────────────────────────────

describe('git-truth inventory scan', () => {
  it('enumerates_workflows_from_git_tree', () => {
    // Must use git ls-tree, not readdirSync
    const gitOutput = execSync('git ls-tree --name-only HEAD .github/workflows/', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    const gitFiles = gitOutput
      .trim()
      .split('\n')
      .map(f => f.replace('.github/workflows/', ''))
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    assert.ok(gitFiles.length > 0, 'should find at least one workflow');
    assert.ok(gitFiles.includes('seal-gate-fast.yml'), 'should include SEAL gate');
  });

  it('parseTriggers_extracts_real_workflow_triggers', () => {
    const content = readFileSync(join(WORKFLOWS_DIR, 'seal-gate-fast.yml'), 'utf8');
    const triggers = parseTriggers(content);

    assert.equal(triggers.push, true, 'seal-gate-fast has push');
    assert.equal(triggers.pull_request, true, 'seal-gate-fast has pull_request');
    assert.equal(triggers.workflow_dispatch, true, 'seal-gate-fast has workflow_dispatch');
  });

  it('buildInventory_produces_valid_counts', () => {
    const inventory = buildInventory(REPO_ROOT);

    // Total must match git-tracked workflow count
    const gitOutput = execSync('git ls-tree --name-only HEAD .github/workflows/', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    const gitFiles = gitOutput
      .trim()
      .split('\n')
      .map(f => f.replace('.github/workflows/', ''))
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    assert.equal(inventory.total, gitFiles.length, 'total matches git file count');

    // Sum of class counts must equal total
    const classTotal = Object.values(inventory.classes).reduce((sum, arr) => sum + arr.length, 0);
    assert.equal(classTotal, inventory.total, 'class counts sum to total');

    // Required workflows must be classified as REQUIRED
    for (const req of REQUIRED_WORKFLOW_FILES) {
      assert.ok(inventory.classes.REQUIRED.includes(req), `${req} should be REQUIRED`);
    }
  });

  it('buildInventory_classes_are_mutually_exclusive', () => {
    const inventory = buildInventory(REPO_ROOT);
    const allFiles = Object.values(inventory.classes).flat();
    const uniqueFiles = new Set(allFiles);
    assert.equal(allFiles.length, uniqueFiles.size, 'no file appears in multiple classes');
  });

  it('every_class_key_is_valid', () => {
    const inventory = buildInventory(REPO_ROOT);
    const validClasses = new Set([
      'REQUIRED',
      'PUSH-OPTIONAL',
      'SCHEDULED',
      'MANUAL',
      'DEPRECATED',
    ]);
    for (const cls of Object.keys(inventory.classes)) {
      assert.ok(validClasses.has(cls), `${cls} is a valid class`);
    }
  });
});
