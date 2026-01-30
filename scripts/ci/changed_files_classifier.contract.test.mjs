/**
 * Contract tests for changed files classifier
 * Validates docs-only detection and classification for fast-path CI optimization
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
  assert.ok('classification' in parsed, 'Output should have classification field');
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
  assert.strictEqual(parsed.classification, 'docs_only', 'Classification should be docs_only');
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
  assert.strictEqual(parsed.classification, 'docs_only');
});

test('Classifier handles LICENSE and NOTICE as docs', () => {
  const testFiles = ['LICENSE', 'NOTICE', 'LICENSE.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.docsOnly, true, 'LICENSE/NOTICE files should be docs-only');
  assert.strictEqual(parsed.classification, 'docs_only');
});

// ============================================================================
// Classification tests (2D)
// ============================================================================

test('Classifier returns classification=frontend_only for frontend changes', () => {
  const testFiles = ['frontend/src/App.tsx', 'frontend/components/Button.tsx'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'frontend_only', 'Should classify as frontend_only');
  assert.strictEqual(parsed.docsOnly, false);
});

test('Classifier returns classification=backend_only for backend changes', () => {
  const testFiles = ['backend/src/TerraFusion.API/Program.cs', 'backend/TerraFusion.sln'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'backend_only', 'Should classify as backend_only');
  assert.strictEqual(parsed.docsOnly, false);
});

test('Classifier returns classification=ci_only for CI changes', () => {
  const testFiles = ['.github/workflows/ci.yml', 'scripts/ci/ci_telemetry.mjs'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'ci_only', 'Should classify as ci_only');
  assert.strictEqual(parsed.docsOnly, false);
});

test('Classifier returns classification=mixed for lockfile changes (guardrail)', () => {
  const testFiles = ['pnpm-lock.yaml', 'README.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'mixed', 'Lockfile changes should force mixed');
  assert.ok(parsed.reason.includes('pnpm-lock.yaml'), 'Reason should mention lockfile');
});

test('Classifier returns classification=mixed for package.json changes (guardrail)', () => {
  const testFiles = ['package.json', 'README.md'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'mixed', 'package.json changes should force mixed');
  assert.ok(parsed.reason.includes('package.json'), 'Reason should mention package.json');
});

test('Classifier returns classification=mixed for frontend+backend changes', () => {
  const testFiles = ['frontend/src/App.tsx', 'backend/Program.cs'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'mixed', 'frontend+backend should be mixed');
  assert.ok(parsed.reason.includes('Multiple'), 'Reason should mention multiple areas');
});

test('Classifier returns classification=mixed for unknown file types', () => {
  const testFiles = ['some/random/file.xyz'];
  const result = execSync(
    `node "${classifierPath}" --json --test --files="${testFiles.join(',')}"`,
    { encoding: 'utf8', cwd: __dirname }
  );

  const parsed = JSON.parse(result.trim());
  assert.strictEqual(parsed.classification, 'mixed', 'Unknown files should fallback to mixed');
  assert.ok(parsed.reason.includes('Unknown'), 'Reason should mention unknown');
});
