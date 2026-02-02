/**
 * Phase 4N46 – Policy Profile Contract Tests
 * ==========================================
 *
 * TDD-first tests for deployment profile validation:
 *   - Profiles exist (county, state, incident)
 *   - Required fields present
 *   - No conflicting ACLs/limits
 *   - Defaults are sensible
 *
 * @module policy-profile.test
 * @version 4N46.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TierACL {
  readonly audience: 'internal' | 'county' | 'state' | 'public';
  readonly canRead: boolean;
  readonly canRedact: boolean;
  readonly canDelete: boolean;
  readonly requiresApproval: boolean;
}

interface RetentionPolicy {
  readonly tier: string;
  readonly retentionDays: number;
  readonly deletionRequiresApproval: boolean;
  readonly breakGlassEligible: boolean;
}

interface TelemetrySink {
  readonly type: 'file' | 'stdout' | 'memory' | 'remote';
  readonly path?: string;
  readonly endpoint?: string;
  readonly enabled: boolean;
}

interface PolicyProfile {
  readonly $schema: string;
  readonly profileId: string;
  readonly profileName: string;
  readonly version: string;
  readonly description: string;
  readonly tierACLs: readonly TierACL[];
  readonly retention: readonly RetentionPolicy[];
  readonly sizeLimits: {
    readonly maxCasefileSizeBytes: number;
    readonly maxChunkSizeBytes: number;
    readonly maxRollupEntries: number;
  };
  readonly chunkingThresholds: {
    readonly enableChunkingAboveBytes: number;
    readonly targetChunkSizeBytes: number;
  };
  readonly telemetrySinks: readonly TelemetrySink[];
  readonly keyRotation: {
    readonly cadenceDays: number;
    readonly notifyBeforeDays: number;
    readonly autoRotate: boolean;
  };
  readonly auditSettings?: {
    readonly requireExternalVerification: boolean;
    readonly verificationCadenceDays: number;
    readonly auditPacketAutoGenerate: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

const REQUIRED_PROFILES = ['county.policy.json', 'state.policy.json', 'incident.policy.json'] as const;

const REQUIRED_PROFILE_FIELDS = [
  '$schema',
  'profileId',
  'profileName',
  'version',
  'description',
  'tierACLs',
  'retention',
  'sizeLimits',
  'chunkingThresholds',
  'telemetrySinks',
  'keyRotation',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function loadProfile(filename: string): PolicyProfile | null {
  const fullPath = path.join(PROFILES_DIR, filename);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as PolicyProfile;
  } catch {
    return null;
  }
}

function validateACLs(acls: readonly TierACL[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const audiences = new Set<string>();

  for (const acl of acls) {
    // Check for duplicate audiences
    if (audiences.has(acl.audience)) {
      errors.push(`Duplicate ACL for audience: ${acl.audience}`);
    }
    audiences.add(acl.audience);

    // Check for conflicting permissions
    if (acl.canDelete && !acl.requiresApproval) {
      errors.push(`Delete without approval for audience: ${acl.audience}`);
    }

    // Public should never have write permissions
    if (acl.audience === 'public' && (acl.canRedact || acl.canDelete)) {
      errors.push(`Public audience has write permissions`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateRetention(policies: readonly RetentionPolicy[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tiers = new Set<string>();

  for (const policy of policies) {
    // Check for duplicate tiers
    if (tiers.has(policy.tier)) {
      errors.push(`Duplicate retention policy for tier: ${policy.tier}`);
    }
    tiers.add(policy.tier);

    // Retention must be positive OR -1 (infinite)
    if (policy.retentionDays <= 0 && policy.retentionDays !== -1) {
      errors.push(`Invalid retention days for tier ${policy.tier}: ${policy.retentionDays}`);
    }

    // Court-martial records need longer retention (unless infinite)
    if (policy.tier === 'court' && policy.retentionDays !== -1 && policy.retentionDays < 2555) {
      errors.push(`Court records retention too short: ${policy.retentionDays} days`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateSizeLimits(limits: PolicyProfile['sizeLimits']): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (limits.maxCasefileSizeBytes <= 0) {
    errors.push('maxCasefileSizeBytes must be positive');
  }

  if (limits.maxChunkSizeBytes <= 0) {
    errors.push('maxChunkSizeBytes must be positive');
  }

  if (limits.maxChunkSizeBytes > limits.maxCasefileSizeBytes) {
    errors.push('maxChunkSizeBytes cannot exceed maxCasefileSizeBytes');
  }

  if (limits.maxRollupEntries <= 0) {
    errors.push('maxRollupEntries must be positive');
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Profile Existence
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Profile Existence', () => {
  it('county.policy.json exists', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null, 'county.policy.json should exist');
  });

  it('state.policy.json exists', () => {
    const profile = loadProfile('state.policy.json');
    assert.ok(profile !== null, 'state.policy.json should exist');
  });

  it('incident.policy.json exists', () => {
    const profile = loadProfile('incident.policy.json');
    assert.ok(profile !== null, 'incident.policy.json should exist');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Required Fields
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Required Fields', () => {
  it('county profile has all required fields', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    for (const field of REQUIRED_PROFILE_FIELDS) {
      assert.ok(field in profile, `Missing field: ${field}`);
    }
  });

  it('state profile has all required fields', () => {
    const profile = loadProfile('state.policy.json');
    assert.ok(profile !== null);

    for (const field of REQUIRED_PROFILE_FIELDS) {
      assert.ok(field in profile, `Missing field: ${field}`);
    }
  });

  it('incident profile has all required fields', () => {
    const profile = loadProfile('incident.policy.json');
    assert.ok(profile !== null);

    for (const field of REQUIRED_PROFILE_FIELDS) {
      assert.ok(field in profile, `Missing field: ${field}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – ACL Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – ACL Validation', () => {
  it('county profile ACLs are valid', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    const result = validateACLs(profile.tierACLs);
    assert.ok(result.valid, `ACL errors: ${result.errors.join(', ')}`);
  });

  it('state profile ACLs are valid', () => {
    const profile = loadProfile('state.policy.json');
    assert.ok(profile !== null);

    const result = validateACLs(profile.tierACLs);
    assert.ok(result.valid, `ACL errors: ${result.errors.join(', ')}`);
  });

  it('incident profile ACLs are valid', () => {
    const profile = loadProfile('incident.policy.json');
    assert.ok(profile !== null);

    const result = validateACLs(profile.tierACLs);
    assert.ok(result.valid, `ACL errors: ${result.errors.join(', ')}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Retention Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Retention Validation', () => {
  it('county profile retention is valid', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    const result = validateRetention(profile.retention);
    assert.ok(result.valid, `Retention errors: ${result.errors.join(', ')}`);
  });

  it('state profile retention is valid', () => {
    const profile = loadProfile('state.policy.json');
    assert.ok(profile !== null);

    const result = validateRetention(profile.retention);
    assert.ok(result.valid, `Retention errors: ${result.errors.join(', ')}`);
  });

  it('profiles have minimum 7-year retention for permanent records', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    const permanentPolicy = profile.retention.find(r => r.tier === 'permanent');
    if (permanentPolicy) {
      // -1 means infinite retention (meets 7-year requirement)
      assert.ok(permanentPolicy.retentionDays === -1 || permanentPolicy.retentionDays >= 2555, 'Permanent records need 7+ year retention');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Size Limits Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Size Limits Validation', () => {
  it('county profile size limits are valid', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    const result = validateSizeLimits(profile.sizeLimits);
    assert.ok(result.valid, `Size limit errors: ${result.errors.join(', ')}`);
  });

  it('state profile has larger limits than county', () => {
    const county = loadProfile('county.policy.json');
    const state = loadProfile('state.policy.json');
    assert.ok(county !== null && state !== null);

    assert.ok(
      state.sizeLimits.maxCasefileSizeBytes >= county.sizeLimits.maxCasefileSizeBytes,
      'State should allow at least as large casefiles as county'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Telemetry Sinks
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Telemetry Sinks', () => {
  it('county profile has at least one enabled sink', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    const enabledSinks = profile.telemetrySinks.filter(s => s.enabled);
    assert.ok(enabledSinks.length >= 1, 'Should have at least one enabled telemetry sink');
  });

  it('incident profile has file sink for audit trail', () => {
    const profile = loadProfile('incident.policy.json');
    assert.ok(profile !== null);

    const fileSink = profile.telemetrySinks.find(s => s.type === 'file' && s.enabled);
    assert.ok(fileSink !== undefined, 'Incident profile should have file sink for audit trail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Key Rotation Settings
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Key Rotation Settings', () => {
  it('county profile has sensible rotation cadence', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    assert.ok(profile.keyRotation.cadenceDays >= 30, 'Rotation cadence should be at least 30 days');
    assert.ok(profile.keyRotation.cadenceDays <= 365, 'Rotation cadence should be at most 365 days');
  });

  it('notification is before rotation', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    assert.ok(
      profile.keyRotation.notifyBeforeDays < profile.keyRotation.cadenceDays,
      'Notification should come before rotation'
    );
    assert.ok(profile.keyRotation.notifyBeforeDays >= 7, 'Should notify at least 7 days before');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Profile Schema Version
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Profile Schema Version', () => {
  it('all profiles use same schema version', () => {
    const county = loadProfile('county.policy.json');
    const state = loadProfile('state.policy.json');
    const incident = loadProfile('incident.policy.json');
    assert.ok(county && state && incident);

    assert.strictEqual(county.$schema, state.$schema);
    assert.strictEqual(state.$schema, incident.$schema);
  });

  it('profiles have valid version strings', () => {
    const profile = loadProfile('county.policy.json');
    assert.ok(profile !== null);

    assert.ok(/^\d+\.\d+\.\d+$/.test(profile.version), 'Version should be semver format');
  });
});
