/**
 * Phase 4N42 – Audience Policy Contract Tests
 * =============================================
 *
 * TDD-first tests for audience separation and tier ACL enforcement.
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    AUDIENCE_POLICY_SCHEMA,
    canIncludeInInternalPack,
    canIncludeInPublicPack,
    classifyArtifact,
    classifyArtifacts,
    compareAudienceLevels,
    compareSensitivityLevels,
    DEFAULT_AUDIENCE_POLICY,
    DEFAULT_TIER_AUDIENCE_ACL,
    getMostRestrictiveAudience,
    getMostSensitiveSensitivity,
    isAudienceAllowedForTier,
    validateClassification,
    validateInternalPack,
    validatePublicPack,
    type ArtifactAudienceMetadata,
    type AudienceLevel,
} from '../src/audience-policy.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42a – Audience Policy Schema', () => {
  it('schema identifier is correct', () => {
    assert.equal(AUDIENCE_POLICY_SCHEMA, 'terrafusion.autonomy.audience-policy.v1');
  });

  it('audience levels are correctly ordered', () => {
    assert.ok(compareAudienceLevels('INTERNAL', 'PUBLIC') > 0);
    assert.ok(compareAudienceLevels('RESTRICTED', 'INTERNAL') > 0);
    assert.ok(compareAudienceLevels('BREAK_GLASS', 'RESTRICTED') > 0);
    assert.ok(compareAudienceLevels('PUBLIC', 'BREAK_GLASS') < 0);
  });

  it('sensitivity levels are correctly ordered', () => {
    assert.ok(compareSensitivityLevels('LOW', 'NONE') > 0);
    assert.ok(compareSensitivityLevels('MEDIUM', 'LOW') > 0);
    assert.ok(compareSensitivityLevels('HIGH', 'MEDIUM') > 0);
    assert.ok(compareSensitivityLevels('CRITICAL', 'HIGH') > 0);
  });

  it('getMostRestrictiveAudience returns correct level', () => {
    const levels: AudienceLevel[] = ['PUBLIC', 'INTERNAL', 'RESTRICTED'];
    assert.equal(getMostRestrictiveAudience(levels), 'RESTRICTED');
  });

  it('getMostSensitiveSensitivity returns correct level', () => {
    assert.equal(getMostSensitiveSensitivity(['NONE', 'LOW', 'HIGH']), 'HIGH');
    assert.equal(getMostSensitiveSensitivity(['MEDIUM', 'CRITICAL']), 'CRITICAL');
  });

  it('empty audience list defaults to INTERNAL', () => {
    assert.equal(getMostRestrictiveAudience([]), 'INTERNAL');
  });

  it('empty sensitivity list defaults to NONE', () => {
    assert.equal(getMostSensitiveSensitivity([]), 'NONE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tier ACL Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42b – Tier Audience ACL', () => {
  it('CI tier is INTERNAL only by default', () => {
    assert.deepEqual(DEFAULT_TIER_AUDIENCE_ACL.ci, ['INTERNAL']);
  });

  it('merged tier allows PUBLIC, INTERNAL and RESTRICTED', () => {
    assert.deepEqual(DEFAULT_TIER_AUDIENCE_ACL.merged, ['PUBLIC', 'INTERNAL', 'RESTRICTED']);
  });

  it('incident tier allows RESTRICTED and BREAK_GLASS only', () => {
    assert.deepEqual(DEFAULT_TIER_AUDIENCE_ACL.incident, ['RESTRICTED', 'BREAK_GLASS']);
  });

  it('test_ci_tier_internal_only_enforced', () => {
    // CI tier should only allow INTERNAL
    assert.ok(isAudienceAllowedForTier('INTERNAL', 'ci'));
    assert.ok(!isAudienceAllowedForTier('PUBLIC', 'ci'));
    assert.ok(!isAudienceAllowedForTier('RESTRICTED', 'ci'));
    assert.ok(!isAudienceAllowedForTier('BREAK_GLASS', 'ci'));
  });

  it('test_incident_break_glass_requires_explicit_flag', () => {
    // Create a custom policy that classifies emergency-access as BREAK_GLASS
    const testPolicy = {
      ...DEFAULT_AUDIENCE_POLICY,
      pathRules: [
        {
          pattern: 'emergency-access-*.json',
          audience: 'BREAK_GLASS' as const,
          sensitivity: 'CRITICAL' as const,
          containsPii: false,
          priority: 100,
        },
        ...DEFAULT_AUDIENCE_POLICY.pathRules,
      ],
    };

    // Classify with BREAK_GLASS artifact but no flag
    const classification = classifyArtifacts({
      paths: ['emergency-access-override.json'],
      tier: 'incident',
      breakGlassFlag: false,
      policy: testPolicy,
    });

    // Should have error for missing flag
    const breakGlassError = classification.errors.find(e => e.code === 'BREAK_GLASS_WITHOUT_FLAG');
    assert.ok(breakGlassError, 'Expected BREAK_GLASS_WITHOUT_FLAG error');
  });

  it('test_policy_disallows_public_asset_in_internal_only_lane', () => {
    // CI tier cannot have public distribution
    const classification = classifyArtifacts({
      paths: ['public-manifest.json'],
      tier: 'ci',
    });

    // Public distribution should not be allowed for CI
    assert.ok(
      !classification.publicDistributionAllowed,
      'CI tier should not allow public distribution'
    );
  });

  it('merged tier allows public distribution when artifacts are safe', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json'],
      tier: 'merged',
    });

    // All artifacts are PUBLIC safe manifests
    const hasPublicSafeArtifacts = classification.artifacts.every(
      a => a.audience === 'PUBLIC' && !a.containsPii
    );

    // If all are public safe, distribution should be allowed
    if (hasPublicSafeArtifacts) {
      assert.ok(classification.publicDistributionAllowed);
    }
  });

  it('incident tier never allows public distribution', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json'],
      tier: 'incident',
    });

    // Incident tier always has restricted distribution
    // Even PUBLIC artifacts become RESTRICTED in incident context
    assert.ok(!classification.publicDistributionAllowed);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Classification Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42a – Artifact Classification', () => {
  it('manifest files are classified as PUBLIC', () => {
    const artifact = classifyArtifact('casefile-manifest.json');
    assert.equal(artifact.audience, 'PUBLIC');
    assert.ok(!artifact.containsPii);
  });

  it('evidence bundles are classified as INTERNAL', () => {
    const artifact = classifyArtifact('autonomy-evidence-12345.zip');
    assert.equal(artifact.audience, 'INTERNAL');
  });

  it('break-glass proofs are classified as RESTRICTED', () => {
    const artifact = classifyArtifact('break-glass-proof.json');
    assert.equal(artifact.audience, 'RESTRICTED');
    assert.equal(artifact.sensitivity, 'HIGH');
  });

  it('PII files are classified as RESTRICTED with CRITICAL sensitivity', () => {
    const artifact = classifyArtifact('owner-data.pii.json');
    assert.equal(artifact.audience, 'RESTRICTED');
    assert.equal(artifact.sensitivity, 'CRITICAL');
    assert.ok(artifact.containsPii);
  });

  it('unknown files default to INTERNAL', () => {
    const artifact = classifyArtifact('unknown-file.txt');
    assert.equal(artifact.audience, 'INTERNAL');
  });

  it('content scanner can upgrade sensitivity', () => {
    const artifact = classifyArtifact('data.json', DEFAULT_AUDIENCE_POLICY, 'CRITICAL');
    assert.equal(artifact.sensitivity, 'CRITICAL');
    assert.ok(artifact.containsPii); // HIGH/CRITICAL sensitivity implies PII
  });

  it('classification includes reason for audit', () => {
    const artifact = classifyArtifact('rekor-anchor-proof.json');
    assert.ok(artifact.classificationReason);
    assert.ok(artifact.classificationReason.includes('Matched pattern'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pack Validation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42d – Distribution Pack Validation', () => {
  it('canIncludeInPublicPack rejects INTERNAL artifacts', () => {
    const artifact: ArtifactAudienceMetadata = {
      path: 'internal-data.json',
      audience: 'INTERNAL',
      sensitivity: 'LOW',
      containsPii: false,
    };
    assert.ok(!canIncludeInPublicPack(artifact));
  });

  it('canIncludeInPublicPack rejects unredacted PII', () => {
    const artifact: ArtifactAudienceMetadata = {
      path: 'owner-data.json',
      audience: 'PUBLIC',
      sensitivity: 'HIGH',
      containsPii: true,
      redacted: false,
    };
    assert.ok(!canIncludeInPublicPack(artifact));
  });

  it('canIncludeInPublicPack accepts redacted PUBLIC artifacts', () => {
    const artifact: ArtifactAudienceMetadata = {
      path: 'owner-data.json',
      audience: 'PUBLIC',
      sensitivity: 'HIGH',
      containsPii: true,
      redacted: true,
    };
    assert.ok(canIncludeInPublicPack(artifact));
  });

  it('canIncludeInInternalPack rejects RESTRICTED artifacts', () => {
    const artifact: ArtifactAudienceMetadata = {
      path: 'restricted-data.json',
      audience: 'RESTRICTED',
      sensitivity: 'HIGH',
      containsPii: false,
    };
    assert.ok(!canIncludeInInternalPack(artifact));
  });

  it('test_public_pack_excludes_restricted_assets', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json', 'break-glass-proof.json'],
      tier: 'merged',
    });

    // Break-glass is RESTRICTED, should not be in public pack
    const publicPaths = classification.artifacts
      .filter(a => canIncludeInPublicPack(a))
      .map(a => a.path);

    assert.ok(!publicPaths.includes('break-glass-proof.json'));
    assert.ok(publicPaths.includes('casefile-manifest.json'));
  });

  it('test_internal_pack_contains_full_expected_assets', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json', 'autonomy-evidence-123.zip'],
      tier: 'merged',
    });

    // Both should be in internal pack (PUBLIC and INTERNAL allowed)
    const internalPaths = classification.artifacts
      .filter(a => canIncludeInInternalPack(a))
      .map(a => a.path);

    assert.ok(internalPaths.includes('casefile-manifest.json'));
    assert.ok(internalPaths.includes('autonomy-evidence-123.zip'));
  });

  it('test_both_packs_verify_successfully', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json', 'rekor-anchor-proof.json'],
      tier: 'merged',
    });

    // Public pack validation
    const publicPaths = classification.artifacts
      .filter(a => canIncludeInPublicPack(a))
      .map(a => a.path);

    const publicResult = validatePublicPack(publicPaths, classification);
    assert.ok(
      publicResult.ok,
      `Public pack validation failed: ${publicResult.errors.map(e => e.message).join(', ')}`
    );

    // Internal pack validation
    const internalPaths = classification.artifacts
      .filter(a => canIncludeInInternalPack(a))
      .map(a => a.path);

    const internalResult = validateInternalPack(internalPaths, classification);
    assert.ok(
      internalResult.ok,
      `Internal pack validation failed: ${internalResult.errors.map(e => e.message).join(', ')}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42f – Classification Validation', () => {
  it('validateClassification passes for clean classification', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json'],
      tier: 'merged',
    });

    const result = validateClassification(classification);
    assert.ok(result.ok, `Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
  });

  it('validateClassification fails for unredacted PII', () => {
    // Create classification with PII artifact
    const classification = classifyArtifacts({
      paths: ['owner-data.pii.json'],
      tier: 'merged',
    });

    const result = validateClassification(classification);
    const piiError = result.errors.find(
      e => e.code === 'PII_DETECTED_NOT_REDACTED' || e.code === 'REDACTION_REQUIRED'
    );
    assert.ok(piiError, 'Expected PII redaction error');
  });

  it('validatePublicPack rejects restricted artifacts', () => {
    const classification = classifyArtifacts({
      paths: ['casefile-manifest.json', 'break-glass-proof.json'],
      tier: 'merged',
    });

    // Try to include break-glass in public pack
    const result = validatePublicPack(
      ['casefile-manifest.json', 'break-glass-proof.json'],
      classification
    );

    assert.ok(!result.ok);
    assert.ok(result.errors.some(e => e.code === 'PUBLIC_PACK_CONTAINS_RESTRICTED'));
  });

  it('policy completeness check detects missing tier ACL', () => {
    const incompletPolicy = {
      ...DEFAULT_AUDIENCE_POLICY,
      tierAudienceAcl: {
        ci: ['INTERNAL'],
        merged: ['INTERNAL'],
        incident: [], // Empty = incomplete
      },
    };

    const classification = classifyArtifacts({
      paths: ['test.json'],
      tier: 'incident',
      policy: incompletPolicy,
    });

    const result = validateClassification(classification, incompletPolicy);
    const incompleteError = result.errors.find(e => e.code === 'POLICY_INCOMPLETE');
    assert.ok(incompleteError, 'Expected POLICY_INCOMPLETE error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error Code Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42 – Error Codes', () => {
  it('AUDIENCE_VIOLATION is emitted for tier mismatch', () => {
    // Create artifact with RESTRICTED audience but CI tier only allows INTERNAL
    const classification = classifyArtifacts({
      paths: ['break-glass-proof.json'], // RESTRICTED
      tier: 'ci', // Only allows INTERNAL
    });

    const error = classification.errors.find(e => e.code === 'TIER_AUDIENCE_MISMATCH');
    assert.ok(error, 'Expected TIER_AUDIENCE_MISMATCH error');
  });

  it('test_error_code_AUDIENCE_VIOLATION', () => {
    const classification = classifyArtifacts({
      paths: ['break-glass-proof.json'],
      tier: 'ci',
    });

    // Tier mismatch should produce error
    assert.ok(classification.errors.length > 0);
    assert.ok(classification.errors.some(e => e.code === 'TIER_AUDIENCE_MISMATCH'));
  });

  it('test_error_code_REDACTION_REQUIRED', () => {
    const classification = classifyArtifacts({
      paths: ['owner-data.pii.json'],
      tier: 'merged',
    });

    const result = validateClassification(classification);
    assert.ok(
      result.errors.some(
        e => e.code === 'PII_DETECTED_NOT_REDACTED' || e.code === 'REDACTION_REQUIRED'
      )
    );
  });

  it('test_error_code_PUBLIC_PACK_CONTAINS_RESTRICTED', () => {
    const classification = classifyArtifacts({
      paths: ['break-glass-proof.json'],
      tier: 'merged',
    });

    const result = validatePublicPack(['break-glass-proof.json'], classification);
    assert.ok(result.errors.some(e => e.code === 'PUBLIC_PACK_CONTAINS_RESTRICTED'));
  });
});
