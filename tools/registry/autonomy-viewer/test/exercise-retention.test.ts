/**
 * Phase 4N47 – Retention Exercise Tests
 * ======================================
 *
 * Tests for data retention and expiration procedures:
 *   - Tier-based retention enforcement
 *   - Deletion approval requirements
 *   - Break-glass eligibility checks
 *   - Expiration workflow validation
 *
 * @module exercise-retention.test
 * @version 4N47.1
 */

import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RetentionPolicy {
  readonly tier: string;
  readonly retentionDays: number;
  readonly deletionRequiresApproval: boolean;
  readonly breakGlassEligible: boolean;
}

interface RetainedArtifact {
  readonly artifactId: string;
  readonly tier: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly deleted: boolean;
  readonly deletedAt?: string;
  readonly deletionApprovedBy?: string;
}

interface ExpirationCheck {
  readonly artifactId: string;
  readonly tier: string;
  readonly expired: boolean;
  readonly daysUntilExpiry: number | null;
  readonly canDelete: boolean;
  readonly requiresApproval: boolean;
  readonly breakGlassEligible: boolean;
}

interface DeletionRequest {
  readonly requestId: string;
  readonly artifactId: string;
  readonly reason: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly approved: boolean;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly breakGlass: boolean;
}

interface DeletionResult {
  readonly success: boolean;
  readonly artifactId: string;
  readonly deletedAt?: string;
  readonly error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

const DEFAULT_POLICIES: RetentionPolicy[] = [
  {
    tier: 'standard',
    retentionDays: 2555,
    deletionRequiresApproval: true,
    breakGlassEligible: false,
  },
  {
    tier: 'permanent',
    retentionDays: -1,
    deletionRequiresApproval: true,
    breakGlassEligible: true,
  },
  { tier: 'court', retentionDays: 3650, deletionRequiresApproval: true, breakGlassEligible: true },
  {
    tier: 'temporary',
    retentionDays: 90,
    deletionRequiresApproval: false,
    breakGlassEligible: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function loadProfileRetention(profileName: string): RetentionPolicy[] | null {
  const profilePath = path.join(PROFILES_DIR, `${profileName}.policy.json`);
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  return profile.retention ?? null;
}

function getPolicy(tier: string, policies: RetentionPolicy[]): RetentionPolicy | undefined {
  return policies.find(p => p.tier === tier);
}

function calculateExpiryDate(createdAt: Date, retentionDays: number): Date | null {
  if (retentionDays < 0) {
    return null; // Permanent, never expires
  }
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + retentionDays);
  return expiry;
}

function createRetainedArtifact(tier: string, policies: RetentionPolicy[]): RetainedArtifact {
  const policy = getPolicy(tier, policies);
  const createdAt = new Date();
  const expiresAt = policy ? calculateExpiryDate(createdAt, policy.retentionDays) : null;

  return {
    artifactId: randomUUID(),
    tier,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
    deleted: false,
  };
}

function checkExpiration(artifact: RetainedArtifact, policies: RetentionPolicy[]): ExpirationCheck {
  const policy = getPolicy(artifact.tier, policies);

  if (!policy) {
    return {
      artifactId: artifact.artifactId,
      tier: artifact.tier,
      expired: false,
      daysUntilExpiry: null,
      canDelete: false,
      requiresApproval: true,
      breakGlassEligible: false,
    };
  }

  let expired = false;
  let daysUntilExpiry: number | null = null;

  if (artifact.expiresAt) {
    const expiryDate = new Date(artifact.expiresAt);
    const now = new Date();
    const msUntilExpiry = expiryDate.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));
    expired = daysUntilExpiry <= 0;
  }

  return {
    artifactId: artifact.artifactId,
    tier: artifact.tier,
    expired,
    daysUntilExpiry,
    canDelete: expired || policy.retentionDays < 0 === false,
    requiresApproval: policy.deletionRequiresApproval,
    breakGlassEligible: policy.breakGlassEligible,
  };
}

function createDeletionRequest(
  artifact: RetainedArtifact,
  requestedBy: string,
  reason: string,
  breakGlass: boolean = false
): DeletionRequest {
  return {
    requestId: randomUUID(),
    artifactId: artifact.artifactId,
    reason,
    requestedBy,
    requestedAt: new Date().toISOString(),
    approved: false,
    breakGlass,
  };
}

function approveDeletion(request: DeletionRequest, approvedBy: string): DeletionRequest {
  return {
    ...request,
    approved: true,
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}

function executeDeletion(
  artifact: RetainedArtifact,
  request: DeletionRequest,
  policies: RetentionPolicy[]
): DeletionResult {
  const policy = getPolicy(artifact.tier, policies);

  if (!policy) {
    return {
      success: false,
      artifactId: artifact.artifactId,
      error: 'Unknown retention tier',
    };
  }

  // Check approval requirement
  if (policy.deletionRequiresApproval && !request.approved) {
    return {
      success: false,
      artifactId: artifact.artifactId,
      error: 'Deletion requires approval',
    };
  }

  // Check break-glass eligibility
  if (request.breakGlass && !policy.breakGlassEligible) {
    return {
      success: false,
      artifactId: artifact.artifactId,
      error: 'Tier not eligible for break-glass deletion',
    };
  }

  return {
    success: true,
    artifactId: artifact.artifactId,
    deletedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Retention Policy Loading
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Retention Policy Loading', () => {
  it('loads county profile retention policies', () => {
    const policies = loadProfileRetention('county');
    assert.ok(policies !== null);
    assert.ok(policies.length > 0);
  });

  it('loads state profile retention policies', () => {
    const policies = loadProfileRetention('state');
    assert.ok(policies !== null);
    assert.ok(policies.length > 0);
  });

  it('loads incident profile retention policies', () => {
    const policies = loadProfileRetention('incident');
    assert.ok(policies !== null);
    assert.ok(policies.length > 0);
  });

  it('all profiles have standard tier', () => {
    for (const profile of ['county', 'state', 'incident']) {
      const policies = loadProfileRetention(profile);
      assert.ok(
        policies?.some(p => p.tier === 'standard'),
        `${profile} should have standard tier`
      );
    }
  });

  it('all profiles have permanent tier', () => {
    for (const profile of ['county', 'state', 'incident']) {
      const policies = loadProfileRetention(profile);
      assert.ok(
        policies?.some(p => p.tier === 'permanent'),
        `${profile} should have permanent tier`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Expiration Calculation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Expiration Calculation', () => {
  it('standard tier expires after retention days', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    assert.ok(artifact.expiresAt !== null);

    const created = new Date(artifact.createdAt);
    const expires = new Date(artifact.expiresAt!);
    const daysDiff = Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    assert.strictEqual(daysDiff, 2555); // ~7 years
  });

  it('permanent tier never expires', () => {
    const artifact = createRetainedArtifact('permanent', DEFAULT_POLICIES);
    assert.strictEqual(artifact.expiresAt, null);
  });

  it('temporary tier has short expiration', () => {
    const artifact = createRetainedArtifact('temporary', DEFAULT_POLICIES);
    assert.ok(artifact.expiresAt !== null);

    const created = new Date(artifact.createdAt);
    const expires = new Date(artifact.expiresAt!);
    const daysDiff = Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    assert.strictEqual(daysDiff, 90);
  });

  it('court tier has 10-year retention', () => {
    const artifact = createRetainedArtifact('court', DEFAULT_POLICIES);
    assert.ok(artifact.expiresAt !== null);

    const created = new Date(artifact.createdAt);
    const expires = new Date(artifact.expiresAt!);
    const daysDiff = Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    assert.strictEqual(daysDiff, 3650); // 10 years
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Expiration Checking
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Expiration Checking', () => {
  it('newly created artifact is not expired', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    const check = checkExpiration(artifact, DEFAULT_POLICIES);

    assert.strictEqual(check.expired, false);
    assert.ok(check.daysUntilExpiry !== null && check.daysUntilExpiry > 0);
  });

  it('permanent artifacts have null daysUntilExpiry', () => {
    const artifact = createRetainedArtifact('permanent', DEFAULT_POLICIES);
    const check = checkExpiration(artifact, DEFAULT_POLICIES);

    assert.strictEqual(check.daysUntilExpiry, null);
    assert.strictEqual(check.expired, false);
  });

  it('check includes approval requirement', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    const check = checkExpiration(artifact, DEFAULT_POLICIES);

    assert.strictEqual(check.requiresApproval, true);
  });

  it('temporary tier does not require approval', () => {
    const artifact = createRetainedArtifact('temporary', DEFAULT_POLICIES);
    const check = checkExpiration(artifact, DEFAULT_POLICIES);

    assert.strictEqual(check.requiresApproval, false);
  });

  it('check includes break-glass eligibility', () => {
    const courtArtifact = createRetainedArtifact('court', DEFAULT_POLICIES);
    const standardArtifact = createRetainedArtifact('standard', DEFAULT_POLICIES);

    const courtCheck = checkExpiration(courtArtifact, DEFAULT_POLICIES);
    const standardCheck = checkExpiration(standardArtifact, DEFAULT_POLICIES);

    assert.strictEqual(courtCheck.breakGlassEligible, true);
    assert.strictEqual(standardCheck.breakGlassEligible, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Deletion Approval
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Deletion Approval', () => {
  it('creates deletion request', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    const request = createDeletionRequest(artifact, 'operator-1', 'Retention expired');

    assert.ok(request.requestId);
    assert.strictEqual(request.artifactId, artifact.artifactId);
    assert.strictEqual(request.approved, false);
  });

  it('approves deletion request', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    const request = createDeletionRequest(artifact, 'operator-1', 'Retention expired');
    const approved = approveDeletion(request, 'supervisor-1');

    assert.strictEqual(approved.approved, true);
    assert.strictEqual(approved.approvedBy, 'supervisor-1');
    assert.ok(approved.approvedAt);
  });

  it('deletion fails without approval for standard tier', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    const request = createDeletionRequest(artifact, 'operator-1', 'Test deletion');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('requires approval'));
  });

  it('deletion succeeds with approval', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    let request = createDeletionRequest(artifact, 'operator-1', 'Retention expired');
    request = approveDeletion(request, 'supervisor-1');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, true);
    assert.ok(result.deletedAt);
  });

  it('temporary tier deletion succeeds without approval', () => {
    const artifact = createRetainedArtifact('temporary', DEFAULT_POLICIES);
    const request = createDeletionRequest(artifact, 'operator-1', 'Cleanup');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Break-Glass Deletion
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Deletion', () => {
  it('break-glass fails on non-eligible tier', () => {
    const artifact = createRetainedArtifact('standard', DEFAULT_POLICIES);
    let request = createDeletionRequest(artifact, 'operator-1', 'Emergency', true);
    request = approveDeletion(request, 'supervisor-1');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('not eligible for break-glass'));
  });

  it('break-glass succeeds on eligible tier', () => {
    const artifact = createRetainedArtifact('court', DEFAULT_POLICIES);
    let request = createDeletionRequest(artifact, 'operator-1', 'Court order vacated', true);
    request = approveDeletion(request, 'supervisor-1');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, true);
  });

  it('permanent tier is break-glass eligible', () => {
    const artifact = createRetainedArtifact('permanent', DEFAULT_POLICIES);
    let request = createDeletionRequest(artifact, 'operator-1', 'Legal requirement', true);
    request = approveDeletion(request, 'supervisor-1');
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, true);
  });

  it('break-glass still requires approval', () => {
    const artifact = createRetainedArtifact('court', DEFAULT_POLICIES);
    const request = createDeletionRequest(artifact, 'operator-1', 'Emergency', true);
    const result = executeDeletion(artifact, request, DEFAULT_POLICIES);

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('requires approval'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Profile-Specific Retention
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Profile-Specific Retention', () => {
  it('state profile has taxroll tier', () => {
    const policies = loadProfileRetention('state');
    assert.ok(policies?.some(p => p.tier === 'taxroll'));
  });

  it('state taxroll has long retention', () => {
    const policies = loadProfileRetention('state');
    const taxroll = policies?.find(p => p.tier === 'taxroll');
    assert.ok(taxroll);
    assert.ok(taxroll.retentionDays >= 5475); // 15+ years
  });

  it('incident profile has incident tier', () => {
    const policies = loadProfileRetention('incident');
    assert.ok(policies?.some(p => p.tier === 'incident'));
  });

  it('incident tier has 1-year retention', () => {
    const policies = loadProfileRetention('incident');
    const incident = policies?.find(p => p.tier === 'incident');
    assert.ok(incident);
    assert.strictEqual(incident.retentionDays, 365);
  });
});
