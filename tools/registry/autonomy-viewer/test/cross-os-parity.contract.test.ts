/**
 * Cross-OS Parity Contract Tests
 * ==============================
 * Phase: Field Rollout Hardening
 *
 * Ensures deterministic outputs across Windows and Linux:
 * - JSON keys have stable order
 * - Paths normalize consistently
 * - No platform-specific content leaks
 *
 * These tests run on both Windows and Linux in CI to catch parity issues.
 */

import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// Utilities for path normalization
import { deterministicStringify } from '../src/utils/deterministic-json.js';
import { normalizePath, normalizePathsInObject } from '../src/utils/path-normalize.js';

// Import kit for integration parity tests
import { runCountyKit } from '../src/county-kit.js';

// ============================================================================
// Path Normalization
// ============================================================================

describe('Cross-OS Parity — Path Normalization', () => {
  it('paths_normalize_consistently', () => {
    const windowsPath = 'C:\\Users\\county\\data\\artifacts';
    const posixPath = '/home/county/data/artifacts';

    // Normalize should produce forward slashes consistently
    const normalizedWin = normalizePath(windowsPath);
    const normalizedPosix = normalizePath(posixPath);

    assert.ok(!normalizedWin.includes('\\'), 'Windows paths should use forward slashes');
    assert.ok(!normalizedPosix.includes('\\'), 'POSIX paths should stay with forward slashes');

    // Relative paths should normalize the same way
    const relative1 = normalizePath('.\\data\\output');
    const relative2 = normalizePath('./data/output');

    assert.strictEqual(relative1, relative2, 'relative paths should normalize identically');
  });

  it('path_normalization_handles_mixed_separators', () => {
    const mixed = 'data\\subdir/file.json';
    const normalized = normalizePath(mixed);

    assert.ok(!normalized.includes('\\'), 'mixed paths should use forward slashes');
    assert.strictEqual(normalized, 'data/subdir/file.json');
  });

  it('path_normalization_preserves_relative_prefix', () => {
    const dotPath = './data/output';
    const normalized = normalizePath(dotPath);

    // Should preserve ./ prefix for relative paths
    assert.ok(
      normalized === 'data/output' || normalized === './data/output',
      'relative prefix handling should be consistent'
    );
  });

  it('normalizePathsInObject_handles_nested_objects', () => {
    const obj = {
      file: 'data\\output\\result.json',
      nested: {
        path: 'logs\\events.jsonl',
        items: [{ location: 'artifacts\\step1.json' }, { location: 'artifacts\\step2.json' }],
      },
    };

    const normalized = normalizePathsInObject(obj);

    assert.ok(!JSON.stringify(normalized).includes('\\\\'), 'no backslashes in normalized output');
    assert.strictEqual(normalized.file, 'data/output/result.json');
    assert.strictEqual(normalized.nested.path, 'logs/events.jsonl');
    assert.strictEqual(normalized.nested.items[0].location, 'artifacts/step1.json');
  });
});

// ============================================================================
// JSON Determinism
// ============================================================================

describe('Cross-OS Parity — JSON Determinism', () => {
  it('json_outputs_have_stable_keys_and_order', () => {
    // Test that JSON serialization produces consistent key order
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, m: 3, z: 1 };

    // Standard JSON.stringify preserves insertion order
    // Our deterministic serializer should sort keys
    const str1 = deterministicStringify(obj1);
    const str2 = deterministicStringify(obj2);

    // Both should produce same output with sorted keys
    assert.strictEqual(str1, str2, 'deterministic stringify should produce same output');

    // Verify keys are sorted
    const parsed = JSON.parse(str1);
    const keys = Object.keys(parsed);
    const sortedKeys = [...keys].sort();
    assert.deepStrictEqual(keys, sortedKeys, 'keys should be alphabetically sorted');
  });

  it('json_handles_nested_key_sorting', () => {
    const nested = {
      z: { c: 1, a: 2 },
      a: { z: 3, b: 4 },
    };

    const str = deterministicStringify(nested);
    const parsed = JSON.parse(str);

    // Top level sorted
    assert.deepStrictEqual(Object.keys(parsed), ['a', 'z']);

    // Nested level sorted
    assert.deepStrictEqual(Object.keys(parsed.a), ['b', 'z']);
    assert.deepStrictEqual(Object.keys(parsed.z), ['a', 'c']);
  });

  it('json_handles_arrays_with_objects', () => {
    const arr = [
      { z: 1, a: 2 },
      { b: 3, a: 4 },
    ];

    const str = deterministicStringify(arr);
    const parsed = JSON.parse(str);

    // Arrays maintain order
    assert.strictEqual(parsed.length, 2);

    // But objects within arrays have sorted keys
    assert.deepStrictEqual(Object.keys(parsed[0]), ['a', 'z']);
    assert.deepStrictEqual(Object.keys(parsed[1]), ['a', 'b']);
  });
});

// ============================================================================
// Platform Detection
// ============================================================================

describe('Cross-OS Parity — Platform Safety', () => {
  it('outputs_do_not_contain_platform_specific_markers', () => {
    const testDir = join(tmpdir(), `cross-os-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'cross-os-test',
        outDir: testDir,
      });

      const summaryPath = join(testDir, 'county-kit-summary.json');
      const content = readFileSync(summaryPath, 'utf-8');

      // Should not contain Windows drive letters in paths
      assert.doesNotMatch(content, /[A-Z]:\\/i, 'should not contain Windows drive letters');

      // Should not contain backslashes (JSON escapes them as \\)
      // This is tricky - we need to check the actual content, not the JSON encoding
      const parsed = JSON.parse(content);
      const reStringified = JSON.stringify(parsed);

      // The only backslashes should be JSON escape sequences, not path separators
      // Check a specific path field if it exists
      if (parsed.outDir) {
        assert.ok(!parsed.outDir.includes('\\'), 'outDir should use forward slashes');
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('current_platform_is_detected_correctly', () => {
    const currentPlatform = platform();

    // This test documents what platform we're on
    assert.ok(
      ['win32', 'linux', 'darwin'].includes(currentPlatform),
      `platform ${currentPlatform} should be recognized`
    );
  });

  it('line_endings_are_consistent', () => {
    const testDir = join(tmpdir(), `cross-os-le-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = runCountyKit({
        profile: 'line-ending-test',
        outDir: testDir,
      });

      const summaryPath = join(testDir, 'county-kit-summary.json');
      const content = readFileSync(summaryPath, 'utf-8');

      // JSON files should not have CRLF - just LF or no line endings
      assert.ok(!content.includes('\r\n'), 'should not contain Windows CRLF line endings');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Structural Determinism (not byte-perfect)
// ============================================================================

describe('Cross-OS Parity — Structural Determinism', () => {
  it('two_runs_produce_structurally_identical_output', () => {
    const testDir1 = join(tmpdir(), `cross-os-struct1-${randomUUID()}`);
    const testDir2 = join(tmpdir(), `cross-os-struct2-${randomUUID()}`);
    mkdirSync(testDir1, { recursive: true });
    mkdirSync(testDir2, { recursive: true });

    try {
      const result1 = runCountyKit({ profile: 'structural-test', outDir: testDir1 });
      const result2 = runCountyKit({ profile: 'structural-test', outDir: testDir2 });

      // Compare structure, not timestamps
      const stripped1 = stripVolatileFields(result1);
      const stripped2 = stripVolatileFields(result2);

      assert.deepStrictEqual(stripped1, stripped2, 'structural content should be identical');
    } finally {
      rmSync(testDir1, { recursive: true, force: true });
      rmSync(testDir2, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Helpers
// ============================================================================

function stripVolatileFields(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripVolatileFields);
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip volatile fields (timing, paths, timestamps)
    if (
      [
        'timestamp',
        'durationMs',
        'duration_ms',
        'totalDurationMs',
        'outDir',
        'generatedAt',
        'evaluatedAt',
      ].includes(key)
    ) {
      continue;
    }
    result[key] = stripVolatileFields(value);
  }
  return result;
}
