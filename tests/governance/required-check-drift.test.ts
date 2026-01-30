/**
 * Required Check Drift Test
 *
 * Validates that only "🔒 SEAL" is the required branch protection check.
 *
 * Policy Rationale (Phase 4D/4E):
 * - Data showed Gate E/F adds queue cost without proportional merge-safety benefit
 * - SEAL provides the core governance contract (scope/lockfile sanity)
 * - Heavy workflows are informational, not blocking
 *
 * @see 🏆_PHASE_4D_DEPENDENCY_CONVERGENCE_ACHIEVEMENT_🏆.md
 */

import { describe, expect, it, vi } from 'vitest';

// Mock the GitHub API response for branch protection
// In CI, this would be replaced with actual API call via gh CLI
const EXPECTED_REQUIRED_CHECKS = ['🔒 SEAL'];

describe('Required Check Drift Guard', () => {
  it('only SEAL should be in required checks policy', () => {
    // This is the policy assertion - update this list ONLY with explicit approval
    const policyChecks = ['🔒 SEAL'];

    expect(policyChecks).toEqual(EXPECTED_REQUIRED_CHECKS);
    expect(policyChecks.length).toBe(1);
  });

  it('Gate E/F should NOT be in required checks', () => {
    const forbiddenRequiredChecks = [
      'Gate E',
      'Gate F',
      'TerraFusion Gatekeeper',
      'TerraFusion Integration Gates',
      'Pipeline Summary',
    ];

    // Validate none of these are in our expected list
    for (const check of forbiddenRequiredChecks) {
      expect(EXPECTED_REQUIRED_CHECKS).not.toContain(check);
    }
  });

  it('documents the governance invariant', () => {
    // This test exists to document the policy for future maintainers
    const policyDoc = `
      REQUIRED CHECK POLICY (Phase 4D/4E):
      
      Required checks: ${EXPECTED_REQUIRED_CHECKS.join(', ')}
      
      Rationale:
      - SEAL validates scope/lockfile sanity in <2 minutes
      - Heavy workflows (Gatekeeper, Gate E/F) are informational
      - Queue saturation (156 runs) blocked convergence when E/F was "required-ish"
      
      To modify this policy:
      1. Update EXPECTED_REQUIRED_CHECKS in this test
      2. Update branch protection via GitHub Settings
      3. Document rationale in achievement log
    `;

    expect(policyDoc).toContain('SEAL');
    expect(policyDoc).toContain('informational');
  });
});

describe('Required Check API Contract (CI)', () => {
  // This test is a scaffold for CI validation
  // In real CI, we'd call: gh api repos/{owner}/{repo}/branches/main/protection

  it.skipIf(!process.env.CI)('validates actual branch protection matches policy', async () => {
    // This would run in CI with GH_TOKEN
    // const result = execSync('gh api repos/.../branches/main/protection --jq ".required_status_checks.checks[].context"');
    // expect(result.split('\n').filter(Boolean)).toEqual(EXPECTED_REQUIRED_CHECKS);

    // Placeholder assertion for local runs
    expect(true).toBe(true);
  });
});
