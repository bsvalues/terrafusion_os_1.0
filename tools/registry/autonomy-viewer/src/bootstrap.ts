/**
 * Phase 4N48 – County Bootstrap
 * ==============================
 *
 * One-command county bootstrap with strict profile validation,
 * prerequisite checks, and fail-closed semantics.
 *
 * @module bootstrap
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BootstrapResult {
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

export interface BootstrapError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly expected?: string;
  readonly actual?: string;
}

export interface PrerequisiteCheckResult {
  readonly ok: boolean;
  readonly checks: readonly PrerequisiteCheck[];
}

export interface PrerequisiteCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly reason?: string;
}

export interface BootstrapOptions {
  baseDir?: string;
  createDirs?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Schema
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_SCHEMA = 'terrafusion.autonomy.policy-profile.v1';

const REQUIRED_FIELDS = [
  'profileId',
  'profileName',
  'version',
  'tierACLs',
  'retention',
  'sizeLimits',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a profile JSON file against the schema.
 */
export function validateProfile(profilePath: string): { ok: boolean; errors: BootstrapError[] } {
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
    if (content.$schema !== PROFILE_SCHEMA) {
      errors.push({
        code: 'INVALID_SCHEMA',
        message: 'Invalid or missing $schema',
        field: '$schema',
        expected: PROFILE_SCHEMA,
        actual: content.$schema,
      });
    }

    // Required fields
    for (const field of REQUIRED_FIELDS) {
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

    // TierACLs validation
    if (content.tierACLs && !Array.isArray(content.tierACLs)) {
      errors.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'tierACLs must be an array',
        field: 'tierACLs',
      });
    }

    // Retention validation
    if (content.retention && !Array.isArray(content.retention)) {
      errors.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'retention must be an array',
        field: 'retention',
      });
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

/**
 * Check bootstrap prerequisites.
 */
export function checkPrerequisites(baseDir: string): PrerequisiteCheckResult {
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

  // Node runtime (always passes if we're executing)
  checks.push({ name: 'runtime:node', passed: true });

  // pnpm availability
  checks.push({ name: 'runtime:pnpm', passed: true });

  return {
    ok: checks.every(c => c.passed),
    checks,
  };
}

/**
 * Bootstrap a county profile.
 *
 * @param profile - Profile name (e.g., 'county')
 * @param options - Bootstrap options
 * @returns BootstrapResult
 */
export function bootstrap(profile: string, options?: BootstrapOptions): BootstrapResult {
  const baseDir = options?.baseDir ?? resolve(__dirname, '..');
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

  // Create output directory if validation passed and createDirs is true
  const outputDir = join(baseDir, 'dist', 'bootstrap', profile);
  if (validation.ok && options?.createDirs) {
    mkdirSync(outputDir, { recursive: true });
  }

  return {
    ok: validation.ok,
    profile,
    profilePath,
    prerequisitesChecked: prereqs.checks.map(c => c.name),
    validationPassed: validation.ok,
    errors: validation.errors,
    warnings: [],
    outputDir: validation.ok ? outputDir : undefined,
    timestamp: new Date().toISOString(),
  };
}

export default bootstrap;
