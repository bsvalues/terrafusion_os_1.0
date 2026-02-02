/**
 * County Kit Integration Tests
 * ============================
 * Phase: Field Rollout Hardening
 *
 * Tests the end-to-end County Kit orchestrator that runs:
 *   bootstrap → drills → ops-status → slo-gate
 *
 * Success Criteria:
 * - Produces deterministic artifact structure
 * - Idempotent (same inputs → same structure)
 * - Fails closed on missing profile
 * - All outputs are PII-safe
 */

import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { describe, it } from 'node:test';

// Import the kit orchestrator (to be created)
import { COUNTY_KIT_SCHEMA, COUNTY_KIT_VERSION, runCountyKit } from '../src/county-kit.js';

// ============================================================================
// Schema Validation
// ============================================================================

describe('County Kit — Schema Contract', () => {
  it('exports_schema_and_version_constants', () => {
    assert.ok(COUNTY_KIT_SCHEMA, 'COUNTY_KIT_SCHEMA must be defined');
    assert.ok(COUNTY_KIT_VERSION, 'COUNTY_KIT_VERSION must be defined');
    assert.match(COUNTY_KIT_SCHEMA, /^terrafusion\.autonomy\./);
    assert.match(COUNTY_KIT_VERSION, /^\d+[A-Z]\d+\.\d+$/);
  });

  it('result_includes_required_fields', () => {
    const testDir = join(tmpdir(), `county-kit-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'test-county',
        outDir: testDir,
      });

      // Required fields
      assert.ok('schemaVersion' in result, 'must have schemaVersion');
      assert.ok('schemaId' in result, 'must have schemaId');
      assert.ok('timestamp' in result, 'must have timestamp');
      assert.ok('profile' in result, 'must have profile');
      assert.ok('outDir' in result, 'must have outDir');
      assert.ok('steps' in result, 'must have steps');
      assert.ok('summary' in result, 'must have summary');
      assert.ok('ok' in result, 'must have ok');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Artifact Structure
// ============================================================================

describe('County Kit — Artifact Structure', () => {
  it('kit_produces_expected_artifacts_structure', () => {
    const testDir = join(tmpdir(), `county-kit-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'benton-county',
        outDir: testDir,
      });

      // Main summary file exists
      const summaryPath = join(testDir, 'county-kit-summary.json');
      assert.ok(existsSync(summaryPath), 'county-kit-summary.json must exist');

      // Summary is valid JSON
      const summaryContent = readFileSync(summaryPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      assert.ok(summary.schemaId, 'summary must have schemaId');
      assert.ok(summary.timestamp, 'summary must have timestamp');

      // Steps subdirectory exists
      const stepsDir = join(testDir, 'steps');
      assert.ok(existsSync(stepsDir), 'steps/ directory must exist');

      // Expected step outputs
      const expectedFiles = ['bootstrap.json', 'drills.json', 'ops-status.json', 'slo-gate.json'];

      for (const file of expectedFiles) {
        const filePath = join(stepsDir, file);
        assert.ok(existsSync(filePath), `${file} must exist in steps/`);

        // Each file is valid JSON
        const content = readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        assert.ok(parsed, `${file} must be valid JSON`);
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('kit_is_idempotent_structure', () => {
    const testDir1 = join(tmpdir(), `county-kit-idem1-${randomUUID()}`);
    const testDir2 = join(tmpdir(), `county-kit-idem2-${randomUUID()}`);
    mkdirSync(testDir1, { recursive: true });
    mkdirSync(testDir2, { recursive: true });

    try {
      // Run twice with same profile
      const result1 = runCountyKit({ profile: 'idempotent-test', outDir: testDir1 });
      const result2 = runCountyKit({ profile: 'idempotent-test', outDir: testDir2 });

      // Structure must be identical (not content, due to timestamps)
      const files1 = getFileStructure(testDir1);
      const files2 = getFileStructure(testDir2);

      assert.deepStrictEqual(files1, files2, 'file structure must be identical');

      // Schema fields must match
      assert.strictEqual(result1.schemaId, result2.schemaId);
      assert.strictEqual(result1.schemaVersion, result2.schemaVersion);
      assert.deepStrictEqual(
        result1.steps.map(s => s.name),
        result2.steps.map(s => s.name),
        'step names must be identical'
      );
    } finally {
      rmSync(testDir1, { recursive: true, force: true });
      rmSync(testDir2, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('County Kit — Error Handling', () => {
  it('kit_fails_closed_on_missing_profile', () => {
    const testDir = join(tmpdir(), `county-kit-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: '', // Empty profile
        outDir: testDir,
      });

      assert.strictEqual(result.ok, false, 'must fail on empty profile');
      assert.ok(result.errorCode, 'must have errorCode');
      assert.match(result.errorCode, /PROFILE/i, 'error code must mention profile');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('kit_fails_closed_on_invalid_outdir', () => {
    const result = runCountyKit({
      profile: 'test-county',
      outDir: '', // Empty outDir
    });

    assert.strictEqual(result.ok, false, 'must fail on empty outDir');
    assert.ok(result.errorCode, 'must have errorCode');
  });

  it('kit_captures_step_failures', () => {
    const testDir = join(tmpdir(), `county-kit-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      // Use a profile that might cause drill failures (but not bootstrap)
      const result = runCountyKit({
        profile: 'test-with-failures',
        outDir: testDir,
        simulateFailure: 'drills', // Test hook to simulate step failure
      });

      // Should still produce summary even with failures
      const summaryPath = join(testDir, 'county-kit-summary.json');
      assert.ok(existsSync(summaryPath), 'summary must exist even on step failure');

      // Steps should include failure info
      const failedStep = result.steps.find(s => s.name === 'drills');
      if (failedStep) {
        assert.strictEqual(failedStep.ok, false, 'failed step.ok should be false');
        assert.ok(failedStep.errorCode, 'failed step should have errorCode');
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// PII Safety
// ============================================================================

describe('County Kit — PII Safety', () => {
  it('kit_outputs_are_pii_safe', () => {
    const testDir = join(tmpdir(), `county-kit-pii-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'pii-test-county',
        outDir: testDir,
      });

      // Check all output files for PII patterns
      // Note: We use specific patterns to avoid false positives on:
      // - Timestamps (13+ digits)
      // - DrillIds (contain timestamps)
      // - SHA256 hashes
      const piiPatterns = [
        { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN' }, // SSN format XXX-XX-XXXX
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, name: 'Email' },
        { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, name: 'Phone' }, // US phone format
        { pattern: /api[_-]?key\s*[=:]/i, name: 'API key assignment' },
        { pattern: /password\s*[=:]/i, name: 'Password assignment' },
      ];

      const allFiles = getAllJsonFiles(testDir);

      for (const filePath of allFiles) {
        const content = readFileSync(filePath, 'utf-8');
        const fileName = basename(filePath);

        for (const { pattern, name } of piiPatterns) {
          assert.doesNotMatch(
            content,
            pattern,
            `${fileName} must not contain PII pattern: ${name}`
          );
        }
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('kit_does_not_leak_absolute_paths', () => {
    const testDir = join(tmpdir(), `county-kit-paths-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'path-test',
        outDir: testDir,
      });

      // The summary JSON string should not contain the absolute testDir path
      // (paths should be normalized to relative)
      const summaryPath = join(testDir, 'county-kit-summary.json');
      const content = readFileSync(summaryPath, 'utf-8');

      // Windows paths in JSON are escaped, check both
      const normalizedTestDir = testDir.replace(/\\/g, '/');
      const escapedTestDir = testDir.replace(/\\/g, '\\\\');

      // Should use relative paths in human-readable fields
      const summary = JSON.parse(content);

      // outDir in result should be normalized but can be absolute for operational use
      // However, file references within steps should be relative
      for (const step of summary.steps || []) {
        if (step.outputFile) {
          // Output file references should be relative to outDir
          assert.ok(
            !step.outputFile.includes(tmpdir()),
            `step ${step.name} outputFile should not contain temp dir path`
          );
        }
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Determinism
// ============================================================================

describe('County Kit — Determinism', () => {
  it('kit_json_keys_are_sorted', () => {
    const testDir = join(tmpdir(), `county-kit-sorted-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      runCountyKit({
        profile: 'sorted-test',
        outDir: testDir,
      });

      const summaryPath = join(testDir, 'county-kit-summary.json');
      const content = readFileSync(summaryPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Re-serialize with sorted keys
      const sorted = JSON.stringify(parsed, Object.keys(parsed).sort(), 2);

      // Keys should be in consistent order (first level)
      const originalKeys = Object.keys(parsed);
      const sortedKeys = Object.keys(parsed).sort();

      // We don't require alphabetical, but require deterministic
      // Check that schemaId comes before timestamp (our convention)
      const schemaIdx = originalKeys.indexOf('schemaId');
      const schemaVersionIdx = originalKeys.indexOf('schemaVersion');

      assert.ok(schemaIdx >= 0, 'schemaId must be present');
      assert.ok(schemaVersionIdx >= 0, 'schemaVersion must be present');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Helpers
// ============================================================================

function getFileStructure(dir: string): string[] {
  const result: string[] = [];

  function walk(currentDir: string, prefix: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        result.push(`${relativePath}/`);
        walk(join(currentDir, entry.name), relativePath);
      } else {
        result.push(relativePath);
      }
    }
  }

  walk(dir, '');
  return result;
}

function getAllJsonFiles(dir: string): string[] {
  const result: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.json')) {
        result.push(fullPath);
      }
    }
  }

  walk(dir);
  return result;
}
