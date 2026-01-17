// scripts/ci/tests/governanceSentinel.test.ts
import { describe, expect, it } from 'vitest';
import { loadContract, validate } from '../governanceSentinel.js';

// Inline types for the JS module
interface GovernanceContract {
  branch: string;
  repository: string;
  expected: {
    required_status_checks: string[];
    strict: boolean;
    enforce_admins: boolean;
  };
}

interface GitHubProtection {
  required_status_checks?: {
    contexts: string[];
    strict: boolean;
  };
  enforce_admins?: {
    enabled: boolean;
  };
}

describe('governanceSentinel', () => {
  const validContract: GovernanceContract = {
    branch: 'main',
    repository: 'bsvalues/terrafusion_os_1.0',
    expected: {
      required_status_checks: ['scope-drift-guard'],
      strict: true,
      enforce_admins: false,
    },
  };

  describe('validate()', () => {
    it('returns OK when protection matches contract', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['scope-drift-guard'],
          strict: true,
        },
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('OK');
      expect(result.reasons).toHaveLength(0);
      expect(result.snapshot).toBeDefined();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('returns DRIFT when branch is not protected (null)', () => {
      const result = validate(validContract, null);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons).toContain('BRANCH_NOT_PROTECTED: main branch has no protection rules');
    });

    it('returns DRIFT when required check is missing', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['some-other-check'],
          strict: true,
        },
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      // Check for generic missing check error (new set-based format)
      expect(result.reasons.some(r => r.includes('MISSING_REQUIRED_CHECKS'))).toBe(true);
      expect(result.reasons.some(r => r.includes('scope-drift-guard'))).toBe(true);
    });

    it("returns DRIFT with correct message when 'scope-drift-guard' specifically is missing", () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['other-check'],
          strict: true,
        },
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons).toContain(
        'MISSING_REQUIRED_CHECKS: Missing [scope-drift-guard]. Actual: [other-check]'
      );
    });

    it('returns DRIFT when strict is false but expected true', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['scope-drift-guard'],
          strict: false, // Expected: true
        },
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons.some(r => r.includes('STRICT_MISMATCH'))).toBe(true);
    });

    it('returns DRIFT when enforce_admins is true but expected false', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['scope-drift-guard'],
          strict: true,
        },
        enforce_admins: {
          enabled: true, // Expected: false
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons.some(r => r.includes('ENFORCE_ADMINS_MISMATCH'))).toBe(true);
    });

    it('returns multiple reasons when multiple drifts detected', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['wrong-check'],
          strict: false,
        },
        enforce_admins: {
          enabled: true,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons.length).toBeGreaterThanOrEqual(3);
      expect(result.reasons.some(r => r.includes('MISSING_REQUIRED_CHECKS'))).toBe(true);
      expect(result.reasons.some(r => r.includes('STRICT_MISMATCH'))).toBe(true);
      expect(result.reasons.some(r => r.includes('ENFORCE_ADMINS_MISMATCH'))).toBe(true);
    });

    it('handles missing required_status_checks object gracefully', () => {
      const protection: GitHubProtection = {
        // No required_status_checks at all
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.status).toBe('DRIFT');
      expect(result.reasons.some(r => r.includes('MISSING_REQUIRED_CHECKS'))).toBe(true);
    });

    it('includes snapshot with both contract and actual values', () => {
      const protection: GitHubProtection = {
        required_status_checks: {
          contexts: ['scope-drift-guard'],
          strict: true,
        },
        enforce_admins: {
          enabled: false,
        },
      };

      const result = validate(validContract, protection);

      expect(result.snapshot).toHaveProperty('contract');
      expect(result.snapshot).toHaveProperty('actual');
    });
  });

  describe('loadContract()', () => {
    it('throws GOVERNANCE_CONTRACT_MISSING for invalid path', () => {
      expect(() => loadContract('/nonexistent/path')).toThrow(/GOVERNANCE_CONTRACT_MISSING/);
    });
  });
});
