/**
 * Air-Gap Bundle Tests
 * ====================
 * Phase II: Distribution Hardening
 *
 * Tests for air-gap bundle generation including:
 * - Bundle structure (all required files present)
 * - Checksum correctness
 * - Verification script generation
 * - Fail-closed semantics
 */

import assert from 'node:assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { generateAccreditationPacket } from '../src/accreditation-packet.ts';
import {
    AIRGAP_BUNDLE_SCHEMA,
    AIRGAP_BUNDLE_VERSION,
    generateAirgapBundle,
} from '../src/airgap-bundle.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_OUT_DIR = join(__dirname, '../dist/test-airgap');

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

before(() => {
  // Clean test output directory
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_OUT_DIR, { recursive: true });

  // Generate a source accreditation packet
  const sourceDir = join(TEST_OUT_DIR, 'source-packet');
  generateAccreditationPacket({
    profile: 'county',
    outDir: sourceDir,
    accreditationInfo: {
      countyName: 'Test County',
      jurisdiction: 'WA',
    },
  });
});

after(() => {
  // Cleanup
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Schema', () => {
  test('schema_id_is_correct', () => {
    assert.strictEqual(AIRGAP_BUNDLE_SCHEMA, 'terrafusion.autonomy.airgap-bundle.v1');
  });

  test('schema_version_is_4N51.1', () => {
    assert.strictEqual(AIRGAP_BUNDLE_VERSION, '4N51.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Input Validation', () => {
  test('fails_with_nonexistent_source', () => {
    const result = generateAirgapBundle({
      sourceDir: '/nonexistent/path',
      outDir: join(TEST_OUT_DIR, 'fail-source'),
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'AIRGAP_SOURCE_NOT_FOUND');
  });

  test('fails_with_missing_manifest', () => {
    // Create an empty directory
    const emptyDir = join(TEST_OUT_DIR, 'empty-source');
    mkdirSync(emptyDir, { recursive: true });

    const result = generateAirgapBundle({
      sourceDir: emptyDir,
      outDir: join(TEST_OUT_DIR, 'fail-manifest'),
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'AIRGAP_MANIFEST_NOT_FOUND');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Successful Generation
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Success Cases', () => {
  test('generates_bundle_successfully', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const result = generateAirgapBundle({
      sourceDir,
      outDir: join(TEST_OUT_DIR, 'success'),
      bundleName: 'test-bundle',
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.bundleName, 'test-bundle');
    assert.ok(result.files.length > 0);
    assert.ok(result.totalBytes > 0);
  });

  test('bundle_contains_required_files', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'structure-check');
    const bundleName = 'structure-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const bundleDir = join(outDir, bundleName);

    // Check required files exist
    assert.ok(existsSync(join(bundleDir, 'checksums.sha256')), 'checksums.sha256 should exist');
    assert.ok(existsSync(join(bundleDir, 'verify.sh')), 'verify.sh should exist');
    assert.ok(existsSync(join(bundleDir, 'verify.ps1')), 'verify.ps1 should exist');
    assert.ok(existsSync(join(bundleDir, 'README.txt')), 'README.txt should exist');
    assert.ok(
      existsSync(join(bundleDir, 'bundle-manifest.json')),
      'bundle-manifest.json should exist'
    );
    assert.ok(existsSync(join(bundleDir, 'artifacts')), 'artifacts/ directory should exist');
  });

  test('bundle_manifest_has_correct_schema', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'manifest-check');
    const bundleName = 'manifest-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const manifestPath = join(outDir, bundleName, 'bundle-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

    assert.strictEqual(manifest.$schema, AIRGAP_BUNDLE_SCHEMA);
    assert.strictEqual(manifest.version, AIRGAP_BUNDLE_VERSION);
    assert.ok(manifest.generatedAt);
    assert.strictEqual(manifest.bundleName, bundleName);
    assert.ok(Array.isArray(manifest.files));
    assert.ok(typeof manifest.totalBytes === 'number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Checksum Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Checksums', () => {
  test('checksums_file_format_is_correct', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'checksum-format');
    const bundleName = 'checksum-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const checksumPath = join(outDir, bundleName, 'checksums.sha256');
    const content = readFileSync(checksumPath, 'utf-8');

    // Each line should be: sha256  path
    const lines = content.trim().split('\n');
    assert.ok(lines.length > 0, 'Should have at least one checksum');

    for (const line of lines) {
      const match = line.match(/^([a-f0-9]{64})  (.+)$/);
      assert.ok(match, `Line should match format: "${line}"`);
    }
  });

  test('checksums_are_sorted_by_path', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'checksum-sorted');
    const bundleName = 'sorted-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const checksumPath = join(outDir, bundleName, 'checksums.sha256');
    const content = readFileSync(checksumPath, 'utf-8');

    const lines = content.trim().split('\n');
    const paths = lines.map(line => line.split('  ')[1]);

    const sortedPaths = [...paths].sort();
    assert.deepStrictEqual(paths, sortedPaths, 'Paths should be sorted alphabetically');
  });

  test('checksums_file_ends_with_newline', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'checksum-newline');
    const bundleName = 'newline-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const checksumPath = join(outDir, bundleName, 'checksums.sha256');
    const content = readFileSync(checksumPath, 'utf-8');

    assert.ok(content.endsWith('\n'), 'Checksums file should end with newline');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification Scripts
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Verification Scripts', () => {
  test('bash_script_is_executable_format', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'bash-check');
    const bundleName = 'bash-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const scriptPath = join(outDir, bundleName, 'verify.sh');
    const content = readFileSync(scriptPath, 'utf-8');

    assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should have bash shebang');
    assert.ok(content.includes('sha256sum'), 'Should use sha256sum');
    assert.ok(content.includes('checksums.sha256'), 'Should reference checksums file');
  });

  test('powershell_script_uses_correct_commands', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const outDir = join(TEST_OUT_DIR, 'ps-check');
    const bundleName = 'ps-bundle';

    generateAirgapBundle({
      sourceDir,
      outDir,
      bundleName,
    });

    const scriptPath = join(outDir, bundleName, 'verify.ps1');
    const content = readFileSync(scriptPath, 'utf-8');

    assert.ok(content.includes('Get-FileHash'), 'Should use Get-FileHash');
    assert.ok(content.includes('SHA256'), 'Should use SHA256 algorithm');
    assert.ok(content.includes('checksums.sha256'), 'Should reference checksums file');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reference Lock Inclusion
// ─────────────────────────────────────────────────────────────────────────────

describe('Air-Gap Bundle — Reference Lock', () => {
  test('includes_reference_lock_by_default', () => {
    // Create a source with a lock file
    const lockSourceDir = join(TEST_OUT_DIR, 'lock-source');
    const lockPacketDir = join(lockSourceDir, 'packet');

    mkdirSync(lockPacketDir, { recursive: true });

    // Create mock manifest
    writeFileSync(
      join(lockPacketDir, 'manifest.json'),
      JSON.stringify({ files: [], fileCount: 0 })
    );

    // Create mock lock file
    writeFileSync(
      join(lockSourceDir, 'ACCREDITATION_REFERENCE.lock.json'),
      JSON.stringify({ lockVersion: '1.0.0' })
    );

    const result = generateAirgapBundle({
      sourceDir: lockPacketDir,
      outDir: join(TEST_OUT_DIR, 'lock-include'),
      bundleName: 'lock-bundle',
      includeLock: true,
    });

    assert.strictEqual(result.ok, true);

    // Check lock file is in the checksums
    const hasLock = result.files.some(f => f.path.includes('ACCREDITATION_REFERENCE'));
    assert.ok(hasLock, 'Should include reference lock file');
  });

  test('excludes_reference_lock_when_disabled', () => {
    const sourceDir = join(TEST_OUT_DIR, 'source-packet');
    const result = generateAirgapBundle({
      sourceDir,
      outDir: join(TEST_OUT_DIR, 'no-lock'),
      bundleName: 'no-lock-bundle',
      includeLock: false,
    });

    assert.strictEqual(result.ok, true);

    // Check lock file is not in the checksums
    const hasLock = result.files.some(f => f.path.includes('ACCREDITATION_REFERENCE'));
    assert.ok(!hasLock, 'Should not include reference lock file');
  });
});
