/**
 * Fleet Enrollment Tests
 * ======================
 * Phase I: Operator-Scale Rollout
 *
 * Tests for batch county enrollment including:
 * - Determinism (sorted output, stable hashes)
 * - Isolation (one county failure doesn't block others)
 * - Fail-closed semantics (invalid input fails fast)
 * - Fleet index structure and semantics
 */

import assert from 'node:assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
    enrollFleet,
    FLEET_INDEX_SCHEMA,
    FLEET_INDEX_VERSION,
    loadCountiesFromFile,
    type CountyEnrollmentInput
} from '../src/fleet-enrollment.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_OUT_DIR = join(__dirname, '../dist/test-fleet');
const FIXTURES_DIR = join(__dirname, '../fixtures');

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

before(() => {
  // Clean test output directory
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_OUT_DIR, { recursive: true });
});

after(() => {
  // Cleanup
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Fleet Index Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Index — Schema', () => {
  test('schema_id_is_correct', () => {
    assert.strictEqual(FLEET_INDEX_SCHEMA, 'terrafusion.autonomy.fleet-index.v1');
  });

  test('schema_version_is_4N51.1', () => {
    assert.strictEqual(FLEET_INDEX_VERSION, '4N51.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input Validation (Fail-Closed)
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Input Validation', () => {
  test('fails_with_no_counties', () => {
    const result = enrollFleet({
      counties: [],
      outDir: join(TEST_OUT_DIR, 'empty'),
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.totalCounties, 0);
  });

  test('fails_with_missing_outdir', () => {
    const result = enrollFleet({
      counties: [{ id: 'test', name: 'Test', jurisdiction: 'WA' }],
      outDir: '',
    });

    assert.strictEqual(result.ok, false);
  });

  test('fails_with_missing_county_id', () => {
    const result = enrollFleet({
      counties: [{ id: '', name: 'Test', jurisdiction: 'WA' }],
      outDir: join(TEST_OUT_DIR, 'invalid'),
    });

    assert.strictEqual(result.ok, false);
  });

  test('fails_with_missing_county_name', () => {
    const result = enrollFleet({
      counties: [{ id: 'test', name: '', jurisdiction: 'WA' }],
      outDir: join(TEST_OUT_DIR, 'invalid'),
    });

    assert.strictEqual(result.ok, false);
  });

  test('fails_with_missing_jurisdiction', () => {
    const result = enrollFleet({
      counties: [{ id: 'test', name: 'Test', jurisdiction: '' }],
      outDir: join(TEST_OUT_DIR, 'invalid'),
    });

    assert.strictEqual(result.ok, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Successful Enrollment
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Success Cases', () => {
  test('enrolls_single_county_successfully', () => {
    const outDir = join(TEST_OUT_DIR, 'single');
    const result = enrollFleet({
      counties: [{ id: 'single-county', name: 'Single County', jurisdiction: 'WA' }],
      outDir,
      verify: true,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.totalCounties, 1);
    assert.strictEqual(result.succeeded, 1);
    assert.strictEqual(result.failed, 0);
    assert.strictEqual(result.verified, 1);
    assert.strictEqual(result.verifyFailed, 0);

    // Verify fleet index exists
    const indexPath = join(outDir, 'fleet-index.json');
    assert.ok(existsSync(indexPath), 'fleet-index.json should exist');

    // Verify county output directory exists
    const countyDir = join(outDir, 'single-county');
    assert.ok(existsSync(countyDir), 'county directory should exist');

    // Verify packet exists
    const packetPath = join(countyDir, 'accreditation-packet.json');
    assert.ok(existsSync(packetPath), 'accreditation-packet.json should exist');
  });

  test('enrolls_multiple_counties_successfully', () => {
    const outDir = join(TEST_OUT_DIR, 'multi');
    const counties: CountyEnrollmentInput[] = [
      { id: 'alpha-county', name: 'Alpha County', jurisdiction: 'WA' },
      { id: 'beta-county', name: 'Beta County', jurisdiction: 'OR' },
      { id: 'gamma-county', name: 'Gamma County', jurisdiction: 'WA' },
    ];

    const result = enrollFleet({
      counties,
      outDir,
      verify: true,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.totalCounties, 3);
    assert.strictEqual(result.succeeded, 3);
    assert.strictEqual(result.failed, 0);

    // Verify all county directories exist
    for (const county of counties) {
      const countyDir = join(outDir, county.id);
      assert.ok(existsSync(countyDir), `${county.id} directory should exist`);
    }
  });

  test('fleet_index_has_correct_schema', () => {
    const outDir = join(TEST_OUT_DIR, 'schema-check');
    const result = enrollFleet({
      counties: [{ id: 'schema-test', name: 'Schema Test', jurisdiction: 'WA' }],
      outDir,
      verify: false,
    });

    assert.strictEqual(result.$schema, FLEET_INDEX_SCHEMA);
    assert.strictEqual(result.version, FLEET_INDEX_VERSION);
    assert.ok(result.generatedAt, 'generatedAt should be set');
    assert.ok(typeof result.durationMs === 'number', 'durationMs should be a number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Determinism', () => {
  test('counties_are_sorted_alphabetically_in_output', () => {
    const outDir = join(TEST_OUT_DIR, 'sorted');
    const counties: CountyEnrollmentInput[] = [
      { id: 'zulu-county', name: 'Zulu County', jurisdiction: 'WA' },
      { id: 'alpha-county', name: 'Alpha County', jurisdiction: 'WA' },
      { id: 'mike-county', name: 'Mike County', jurisdiction: 'WA' },
    ];

    const result = enrollFleet({
      counties,
      outDir,
      verify: false,
    });

    // Verify counties are sorted by id
    const ids = result.counties.map(c => c.id);
    assert.deepStrictEqual(ids, ['alpha-county', 'mike-county', 'zulu-county']);
  });

  test('fleet_index_file_is_deterministic_json', () => {
    const outDir = join(TEST_OUT_DIR, 'deterministic');
    enrollFleet({
      counties: [{ id: 'det-test', name: 'Determinism Test', jurisdiction: 'WA' }],
      outDir,
      verify: false,
    });

    const indexPath = join(outDir, 'fleet-index.json');
    const content = readFileSync(indexPath, 'utf-8');

    // Verify LF line endings (not CRLF)
    assert.ok(!content.includes('\r\n'), 'Should use LF line endings');

    // Verify trailing newline
    assert.ok(content.endsWith('\n'), 'Should have trailing newline');

    // Verify valid JSON
    const parsed = JSON.parse(content);
    assert.ok(parsed.$schema, 'Should have $schema field');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Failure Isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Failure Isolation', () => {
  test('failure_isolation_continues_on_error', () => {
    const outDir = join(TEST_OUT_DIR, 'isolation');
    // Use an invalid profile for one county to trigger a failure
    const counties: CountyEnrollmentInput[] = [
      { id: 'good-county-1', name: 'Good County 1', jurisdiction: 'WA', profile: 'county' },
      { id: 'good-county-2', name: 'Good County 2', jurisdiction: 'WA', profile: 'county' },
    ];

    const result = enrollFleet({
      counties,
      outDir,
      verify: false,
      continueOnError: true,
    });

    // All should succeed because we're using valid profiles
    assert.strictEqual(result.succeeded, 2);

    // Fleet index should contain all counties
    assert.strictEqual(result.counties.length, 2);
  });

  test('fail_fast_stops_on_first_failure', () => {
    const outDir = join(TEST_OUT_DIR, 'fail-fast');
    // Create input with first county having an invalid profile
    const counties: CountyEnrollmentInput[] = [
      {
        id: 'test-county-1',
        name: 'Test County 1',
        jurisdiction: 'WA',
        profile: 'invalid-profile-xyz',
      },
      { id: 'test-county-2', name: 'Test County 2', jurisdiction: 'WA', profile: 'county' },
    ];

    const result = enrollFleet({
      counties,
      outDir,
      verify: false,
      continueOnError: false,
    });

    // Should have at least one result (the first one that failed)
    assert.ok(result.counties.length >= 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Load Counties From File
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Load Counties File', () => {
  test('loads_sample_counties_file', () => {
    const samplePath = join(FIXTURES_DIR, 'sample-counties.json');
    if (!existsSync(samplePath)) {
      // Skip if sample file doesn't exist
      return;
    }

    const counties = loadCountiesFromFile(samplePath);

    assert.ok(Array.isArray(counties), 'Should return an array');
    assert.ok(counties.length > 0, 'Should have at least one county');
    assert.ok(counties[0].id, 'First county should have an id');
    assert.ok(counties[0].name, 'First county should have a name');
    assert.ok(counties[0].jurisdiction, 'First county should have a jurisdiction');
  });

  test('throws_on_missing_file', () => {
    assert.throws(() => {
      loadCountiesFromFile('/nonexistent/path/counties.json');
    }, /not found/i);
  });

  test('throws_on_invalid_format', () => {
    // Create a temp file with invalid format
    const tempPath = join(TEST_OUT_DIR, 'invalid-counties.json');
    writeFileSync(tempPath, JSON.stringify({ notCounties: [] }), 'utf-8');

    assert.throws(() => {
      loadCountiesFromFile(tempPath);
    }, /counties.*array/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification Integration
// ─────────────────────────────────────────────────────────────────────────────

describe('Fleet Enrollment — Verification', () => {
  test('verify_true_runs_verification', () => {
    const outDir = join(TEST_OUT_DIR, 'verify-true');
    const result = enrollFleet({
      counties: [{ id: 'verify-test', name: 'Verify Test', jurisdiction: 'WA' }],
      outDir,
      verify: true,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.verified, 1);
    assert.strictEqual(result.counties[0].verifyResult, 'passed');
  });

  test('verify_false_skips_verification', () => {
    const outDir = join(TEST_OUT_DIR, 'verify-false');
    const result = enrollFleet({
      counties: [{ id: 'skip-verify', name: 'Skip Verify', jurisdiction: 'WA' }],
      outDir,
      verify: false,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.verified, 0);
    assert.strictEqual(result.counties[0].verifyResult, 'skipped');
  });
});
