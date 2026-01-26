/**
 * Contract tests for changed files classifier
 * Validates docs-only detection for fast-path CI optimization
 *
 * Run: node --test scripts/ci/changed_files_classifier.contract.test.mjs
 *
 * @fileoverview TDD contract test - validates classifier behavior
 */

import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const classifierPath = join(__dirname, 'changed_files_classifier.mjs');

test('Classifier script exists', () => {
  assert.ok(existsSync(classifierPath), 'changed_files_classifier.mjs should exist');
});

test('Classifier supports --json flag and outputs valid JSON', () => {
  // Run with --help or --json to verify script is executable
  // Using --test flag for dry-run with fixtures
  const result = execSync(`node "${classifierPath}" --json --test`, {
    encoding: 'utf8',
    cwd: __dirname,
  });

  let parsed;
  try {
    parsed = JSON.parse(result.trim());
  } catch {
    assert.fail(`Expected valid JSON output, got: ${result}`);
  }

  assert.ok('docsOnly' in parsed, 'Output should have docsOnly field');
  assert.ok('changedFiles' in parsed, 'Output should have changedFiles field');
  assert.ok('reason' in parsed, 'Output should have reason field');
});

test('Classifier returns docsOnly=true for markdown-only changes', () => {
  // Test with fixture of docs-only files
  const testFiles = ['README.md', 'docs/guide.md', 'CHANGELOG.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.docsOnly, true, 'Should be docs-only for markdown files');
  assert.ok(
    parsed.reason.includes('docs') || parsed.reason.includes('all'),
    'Reason should mention docs pattern'
  );
});

test('Classifier returns docsOnly=false for code changes', () => {
  // Test with fixture including code files
  const testFiles = ['README.md', 'src/index.ts', 'docs/guide.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.docsOnly, false, 'Should NOT be docs-only when code files changed');
  assert.ok(parsed.reason.includes('src/index.ts'), 'Reason should mention first non-doc file');
});

test('Classifier returns docsOnly=false for workflow changes', () => {
  // Workflow YAML changes are NOT docs-only (they affect CI behavior)
  const testFiles = ['README.md', '.github/workflows/ci.yml'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(
    parsed.docsOnly,
    false,
    'Workflow YAML changes should NOT be docs-only (they affect CI)'
  );
});

test('Classifier handles .github markdown files as docs', () => {
  // .github/*.md files (like CONTRIBUTING.md) ARE docs
  const testFiles = ['.github/CONTRIBUTING.md', '.github/ISSUE_TEMPLATE.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.docsOnly, true, '.github/*.md files should be docs-only');
});

test('Classifier handles LICENSE and NOTICE as docs', () => {
  const testFiles = ['LICENSE', 'NOTICE', 'LICENSE.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.docsOnly, true, 'LICENSE/NOTICE files should be docs-only');
});
