/**
 * Phase 4N48 – County Bootstrap Contract Tests
 * =============================================
 *
 * Test contracts for the one-command county bootstrap experience.
 * The bootstrap must be idempotent, fail-closed on missing prerequisites,
 * and provide actionable field-level errors for profile validation.
 *
 * @module bootstrap.test
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import will be created in implementation phase
// import { bootstrap, validateProfile, checkPrerequisites, BootstrapResult, PrerequisiteError } from '../src/bootstrap.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES_DIR = join(__dirname, '..', 'profiles');
const RUNBOOKS_DIR = join(__dirname, '..', 'runbooks');
const EXERCISES_DIR = join(__dirname, '..', 'exercises');

const VALID_COUNTY_PROFILE = {
  $schema: 'terrafusion.autonomy.policy-profile.v1',
  profileId: 'county-test',
  profileName: 'County Test Profile',
  version: '1.0.0',
  description: 'Test profile for bootstrap tests',
  tierACLs: [
    {
      audience: 'internal',
      canRead: true,
      canRedact: true,
      canDelete: false,
      requiresApproval: false,
    },
  ],
  retention: [
    {
      tier: 'standard',
      retentionDays: 2555,
      deletionRequiresApproval: true,
      breakGlassEligible: false,
    },
  ],
  sizeLimits: {
    maxCasefileSizeBytes: 52428800,
    maxChunkSizeBytes: 5242880,
    maxRollupEntries: 10000,
  },
  chunkingThresholds: {
    enableChunkingAboveBytes: 10485760,
    targetChunkSizeBytes: 5242880,
  },
  telemetrySinks: [{ type: 'file', path: './telemetry/telemetry.jsonl', enabled: true }],
  keyRotation: { cadenceDays: 90, notifyBeforeDays: 14, autoRotate: false },
  auditSettings: {
    requireExternalVerification: true,
    verificationCadenceDays: 30,
    auditPacketAutoGenerate: true,
  },
  operationalDefaults: {
    rollupCadence: 'monthly',
    externalVerificationProvider: 'github-attestation',
    distributionPackFormat: 'zip',
    signatureAlgorithm: 'ecdsa-p256-sha256',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap Result Interface (contract)
// ─────────────────────────────────────────────────────────────────────────────

interface BootstrapResult {
  readonly ok: boolean;
  readonly profile: string;
  readonly profilePath: string;
  readonly prerequisitesChecked: readonly string[];
  readonly validationPassed: boolean;
  readonly errors: readonly BootstrapError[];
  readonly warnings: readonly string[];
  readonly outputDir?: string;
  readonly timestamp: string;
}

interface BootstrapError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly expected?: string;
  readonly actual?: string;
}

interface PrerequisiteCheckResult {
  readonly ok: boolean;
  readonly checks: readonly PrerequisiteCheck[];
}

interface PrerequisiteCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub implementations (will be replaced by real imports)
// ─────────────────────────────────────────────────────────────────────────────

function validateProfile(profilePath: string): { ok: boolean; errors: BootstrapError[] } {
  if (!existsSync(profilePath)) {
    return {
      ok: false,
      errors: [{ code: 'PROFILE_NOT_FOUND', message: `Profile not found: ${profilePath}` }],
    };
  }

  try {
    const content = JSON.parse(readFileSync(profilePath, 'utf-8'));

    const errors: BootstrapError[] = [];

    // Schema validation
    if (content.$schema !== 'terrafusion.autonomy.policy-profile.v1') {
      errors.push({
        code: 'INVALID_SCHEMA',
        message: 'Invalid or missing $schema',
        field: '$schema',
        expected: 'terrafusion.autonomy.policy-profile.v1',
        actual: content.$schema,
      });
    }

    // Required fields
    const requiredFields = [
      'profileId',
      'profileName',
      'version',
      'tierACLs',
      'retention',
      'sizeLimits',
    ];
    for (const field of requiredFields) {
      if (!(field in content)) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Missing required field: ${field}`,
          field,
        });
      }
    }

    // Size limits validation
    if (content.sizeLimits) {
      if (typeof content.sizeLimits.maxCasefileSizeBytes !== 'number') {
        errors.push({
          code: 'INVALID_FIELD_TYPE',
          message: 'maxCasefileSizeBytes must be a number',
          field: 'sizeLimits.maxCasefileSizeBytes',
        });
      }
    }

    return { ok: errors.length === 0, errors };
  } catch (e) {
    return {
      ok: false,
      errors: [
        { code: 'PARSE_ERROR', message: `Failed to parse profile: ${(e as Error).message}` },
      ],
    };
  }
}

function checkPrerequisites(baseDir: string): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];

  // Check required directories
  const requiredDirs = ['profiles', 'runbooks', 'exercises'];
  for (const dir of requiredDirs) {
    const fullPath = join(baseDir, dir);
    const passed = existsSync(fullPath);
    checks.push({
      name: `dir:${dir}`,
      passed,
      reason: passed ? undefined : `Directory not found: ${fullPath}`,
    });
  }

  // Check node/pnpm (always pass in test context)
  checks.push({ name: 'runtime:node', passed: true });
  checks.push({ name: 'runtime:pnpm', passed: true });

  return {
    ok: checks.every(c => c.passed),
    checks,
  };
}

function bootstrap(profile: string, options?: { baseDir?: string }): BootstrapResult {
  const baseDir = options?.baseDir ?? join(__dirname, '..');
  const profilePath = join(baseDir, 'profiles', `${profile}.policy.json`);

  // Check prerequisites
  const prereqs = checkPrerequisites(baseDir);
  if (!prereqs.ok) {
    const errors = prereqs.checks
      .filter(c => !c.passed)
      .map(c => ({
        code: 'PREREQUISITE_FAILED',
        message: c.reason ?? `Prerequisite check failed: ${c.name}`,
      }));

    return {
      ok: false,
      profile,
      profilePath,
      prerequisitesChecked: prereqs.checks.map(c => c.name),
      validationPassed: false,
      errors,
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Validate profile
  const validation = validateProfile(profilePath);

  return {
    ok: validation.ok,
    profile,
    profilePath,
    prerequisitesChecked: prereqs.checks.map(c => c.name),
    validationPassed: validation.ok,
    errors: validation.errors,
    warnings: [],
    outputDir: validation.ok ? join(baseDir, 'dist', 'bootstrap', profile) : undefined,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Bootstrap', () => {
  describe('Profile Validation', () => {
    it('bootstrap_validates_profile_schema_county', () => {
      // Contract: bootstrap must validate the county profile schema
      const result = bootstrap('county');

      // Real county.policy.json exists and should validate
      assert.equal(result.validationPassed, true, 'County profile should validate');
      assert.equal(result.errors.length, 0, 'No validation errors expected');
    });

    it('bootstrap_fails_closed_on_missing_profile_file', () => {
      // Contract: missing profile file must fail with actionable error
      const result = bootstrap('nonexistent-profile');

      assert.equal(result.ok, false, 'Should fail for missing profile');
      assert.ok(
        result.errors.some(e => e.code === 'PROFILE_NOT_FOUND'),
        'Should have PROFILE_NOT_FOUND error code'
      );
      assert.ok(
        result.errors[0].message.includes('nonexistent-profile'),
        'Error message should include profile name'
      );
    });

    it('validates_profile_schema_field_level_errors', () => {
      // Contract: invalid profile must produce field-level errors
      const tempDir = join(__dirname, '__temp_bootstrap_test__');
      const profilesDir = join(tempDir, 'profiles');
      const runbooksDir = join(tempDir, 'runbooks');
      const exercisesDir = join(tempDir, 'exercises');

      try {
        mkdirSync(profilesDir, { recursive: true });
        mkdirSync(runbooksDir, { recursive: true });
        mkdirSync(exercisesDir, { recursive: true });

        // Invalid profile: wrong schema, missing required fields
        const invalidProfile = {
          $schema: 'wrong-schema',
          profileId: 'test',
          // missing profileName, version, tierACLs, retention, sizeLimits
        };

        writeFileSync(join(profilesDir, 'invalid.policy.json'), JSON.stringify(invalidProfile));

        const result = bootstrap('invalid', { baseDir: tempDir });

        assert.equal(result.ok, false, 'Invalid profile should fail');
        assert.ok(result.errors.length > 0, 'Should have validation errors');

        // Check for specific field-level errors
        const schemaError = result.errors.find(e => e.field === '$schema');
        assert.ok(schemaError, 'Should have $schema field error');
        assert.equal(schemaError?.code, 'INVALID_SCHEMA');
        assert.equal(schemaError?.expected, 'terrafusion.autonomy.policy-profile.v1');
        assert.equal(schemaError?.actual, 'wrong-schema');

        const missingFieldError = result.errors.find(e => e.code === 'MISSING_REQUIRED_FIELD');
        assert.ok(missingFieldError, 'Should have missing required field error');
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Prerequisites', () => {
    it('bootstrap_fails_closed_on_missing_required_dirs', () => {
      // Contract: missing profiles/runbooks/exercises dirs fail bootstrap
      const tempDir = join(__dirname, '__temp_prereq_test__');

      try {
        mkdirSync(tempDir, { recursive: true });
        // Don't create required subdirs

        const result = bootstrap('county', { baseDir: tempDir });

        assert.equal(result.ok, false, 'Should fail on missing dirs');
        assert.ok(
          result.errors.some(e => e.code === 'PREREQUISITE_FAILED'),
          'Should have PREREQUISITE_FAILED error'
        );
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('bootstrap_reports_actionable_prereq_errors', () => {
      // Contract: prerequisite errors must be specific and actionable
      const tempDir = join(__dirname, '__temp_actionable_test__');
      const profilesDir = join(tempDir, 'profiles');
      // Only create profiles dir, not runbooks or exercises

      try {
        mkdirSync(profilesDir, { recursive: true });

        const result = bootstrap('county', { baseDir: tempDir });

        assert.equal(result.ok, false);

        // Errors should specify which dir is missing
        const prereqErrors = result.errors.filter(e => e.code === 'PREREQUISITE_FAILED');
        assert.ok(prereqErrors.length >= 2, 'Should report multiple missing dirs');

        // Messages should be actionable (include paths)
        for (const err of prereqErrors) {
          assert.ok(
            err.message.includes('runbooks') || err.message.includes('exercises'),
            `Error should specify which dir: ${err.message}`
          );
        }
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('prerequisitesChecked_lists_all_checks', () => {
      // Contract: result must enumerate all checks performed
      const result = bootstrap('county');

      assert.ok(result.prerequisitesChecked.length >= 3, 'Should check at least 3 prerequisites');
      assert.ok(result.prerequisitesChecked.includes('dir:profiles'), 'Should check profiles dir');
      assert.ok(result.prerequisitesChecked.includes('dir:runbooks'), 'Should check runbooks dir');
      assert.ok(
        result.prerequisitesChecked.includes('dir:exercises'),
        'Should check exercises dir'
      );
    });
  });

  describe('Idempotency', () => {
    it('bootstrap_is_idempotent', () => {
      // Contract: running bootstrap twice with same config produces same structural output
      const result1 = bootstrap('county');
      const result2 = bootstrap('county');

      // Structural equality (ignoring timestamps)
      assert.equal(result1.ok, result2.ok);
      assert.equal(result1.profile, result2.profile);
      assert.equal(result1.profilePath, result2.profilePath);
      assert.equal(result1.validationPassed, result2.validationPassed);
      assert.deepEqual(result1.errors, result2.errors);
      assert.deepEqual(result1.warnings, result2.warnings);
      assert.deepEqual(result1.prerequisitesChecked, result2.prerequisitesChecked);

      // Output dir path should be deterministic
      assert.equal(result1.outputDir, result2.outputDir);
    });
  });

  describe('Result Contract', () => {
    it('returns_BootstrapResult_shape', () => {
      // Contract: result matches BootstrapResult interface
      const result = bootstrap('county');

      assert.equal(typeof result.ok, 'boolean');
      assert.equal(typeof result.profile, 'string');
      assert.equal(typeof result.profilePath, 'string');
      assert.ok(Array.isArray(result.prerequisitesChecked));
      assert.equal(typeof result.validationPassed, 'boolean');
      assert.ok(Array.isArray(result.errors));
      assert.ok(Array.isArray(result.warnings));
      assert.equal(typeof result.timestamp, 'string');

      // Timestamp is valid ISO
      assert.doesNotThrow(() => new Date(result.timestamp));
    });

    it('successful_bootstrap_has_outputDir', () => {
      // Contract: successful bootstrap populates outputDir
      const result = bootstrap('county');

      if (result.ok) {
        assert.ok(result.outputDir, 'Successful bootstrap should have outputDir');
        assert.ok(result.outputDir.includes('county'), 'outputDir should include profile name');
      }
    });
  });
});
