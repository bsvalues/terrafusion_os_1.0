/// <reference types="vitest" />
/**
 * pilot.rbac.contract.test.ts
 *
 * CP-W4-2 Proof Wall — TerraPilot RBAC + Tool Allowlist Enforcement
 * ═══════════════════════════════════════════════════════════════════
 *
 * 12-gate proof wall for the two-layer TerraPilot authorization model.
 *
 * GATE  1: read_only policy — no confirmation, no reason, no supervisor
 * GATE  2: write_low policy — no confirmation, no reason, no supervisor
 * GATE  3: write_high policy — confirmation=true, reason=true, supervisor=false
 * GATE  4: irreversible policy — confirmation=true, reason=true, supervisor=true
 * GATE  5: Tool not in allowlist → denied, TOOL_NOT_ENABLED violation
 * GATE  6: Empty allowlist → any tool denied
 * GATE  7: User missing claims → denied, MISSING_CLAIM:<claimId> violation
 * GATE  8: Tool enabled + claims present → allowed, zero violations
 * GATE  9: Both violations simultaneously (not enabled + missing claims)
 * GATE 10: County-scoped isolation (county A allowed, county B denied)
 * GATE 11: write_high access grant → policy.requiresConfirmation + requiresReasonCode
 * GATE 12: PII rule — violations never contain SSN / phone / email patterns
 *
 * @see services/pilotRbac.ts
 * @see contracts/pilot.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getRiskPolicy,
  isToolEnabled,
  hasRequiredClaims,
  checkToolAccess,
} from '../../services/pilotRbac';
import type { ToolDescriptor, ToolExecutionContext } from '../../contracts/pilot';

// ============================================================================
// Fixtures
// ============================================================================

const BASE_READ_TOOL: ToolDescriptor = {
  toolId: 'parcel.view',
  title: 'View Parcel',
  mode: 'both',
  risk: 'read_only',
  suiteOwner: 'forge',
  requiredClaims: ['parcel:read'],
  writesTo: [],
};

const WRITE_HIGH_TOOL: ToolDescriptor = {
  toolId: 'valuation.override',
  title: 'Override Valuation',
  mode: 'pilot',
  risk: 'write_high',
  suiteOwner: 'forge',
  requiredClaims: ['valuation:write', 'supervisor:approve'],
  writesTo: ['forge'],
};

const IRREVERSIBLE_TOOL: ToolDescriptor = {
  toolId: 'roll.certify',
  title: 'Certify Roll',
  mode: 'pilot',
  risk: 'irreversible',
  suiteOwner: 'dais',
  requiredClaims: ['roll:certify', 'supervisor:approve'],
  writesTo: ['dais'],
};

function makeCtx(overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext {
  return {
    countyId: 'county-benton',
    userId: 'user-001',
    userClaims: ['parcel:read'],
    enabledTools: ['parcel.view'],
    currentMode: 'pilot',
    correlationId: 'cid_test_001',
    ...overrides,
  };
}

// ============================================================================
// GATE 1: read_only policy
// ============================================================================

describe('GATE 1: read_only policy — no confirmation, reason, or supervisor', () => {
  it('requiresConfirmation is false', () => {
    const p = getRiskPolicy('read_only');
    expect(p.requiresConfirmation).toBe(false);
  });

  it('requiresReasonCode is false', () => {
    const p = getRiskPolicy('read_only');
    expect(p.requiresReasonCode).toBe(false);
  });

  it('requiresSupervisor is false', () => {
    const p = getRiskPolicy('read_only');
    expect(p.requiresSupervisor).toBe(false);
  });
});

// ============================================================================
// GATE 2: write_low policy
// ============================================================================

describe('GATE 2: write_low policy — no confirmation, reason, or supervisor', () => {
  it('requiresConfirmation is false', () => {
    const p = getRiskPolicy('write_low');
    expect(p.requiresConfirmation).toBe(false);
  });

  it('requiresReasonCode is false', () => {
    const p = getRiskPolicy('write_low');
    expect(p.requiresReasonCode).toBe(false);
  });

  it('requiresSupervisor is false', () => {
    const p = getRiskPolicy('write_low');
    expect(p.requiresSupervisor).toBe(false);
  });
});

// ============================================================================
// GATE 3: write_high policy
// ============================================================================

describe('GATE 3: write_high policy — confirmation + reason required, no supervisor', () => {
  it('requiresConfirmation is true', () => {
    const p = getRiskPolicy('write_high');
    expect(p.requiresConfirmation).toBe(true);
  });

  it('requiresReasonCode is true', () => {
    const p = getRiskPolicy('write_high');
    expect(p.requiresReasonCode).toBe(true);
  });

  it('requiresSupervisor is false', () => {
    const p = getRiskPolicy('write_high');
    expect(p.requiresSupervisor).toBe(false);
  });
});

// ============================================================================
// GATE 4: irreversible policy
// ============================================================================

describe('GATE 4: irreversible policy — all three required', () => {
  it('requiresConfirmation is true', () => {
    const p = getRiskPolicy('irreversible');
    expect(p.requiresConfirmation).toBe(true);
  });

  it('requiresReasonCode is true', () => {
    const p = getRiskPolicy('irreversible');
    expect(p.requiresReasonCode).toBe(true);
  });

  it('requiresSupervisor is true', () => {
    const p = getRiskPolicy('irreversible');
    expect(p.requiresSupervisor).toBe(true);
  });
});

// ============================================================================
// GATE 5: Tool not in allowlist → denied
// ============================================================================

describe('GATE 5: tool not in allowlist → TOOL_NOT_ENABLED violation', () => {
  it('returns allowed=false when tool is absent from enabledTools', () => {
    const ctx = makeCtx({ enabledTools: ['other.tool'], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.allowed).toBe(false);
  });

  it('violation list contains TOOL_NOT_ENABLED', () => {
    const ctx = makeCtx({ enabledTools: ['other.tool'], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.violations).toContain('TOOL_NOT_ENABLED');
  });
});

// ============================================================================
// GATE 6: Empty allowlist → all tools denied
// ============================================================================

describe('GATE 6: empty enabledTools → any tool denied', () => {
  it('returns allowed=false with empty allowlist', () => {
    const ctx = makeCtx({ enabledTools: [], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.allowed).toBe(false);
  });

  it('TOOL_NOT_ENABLED is in violations', () => {
    const ctx = makeCtx({ enabledTools: [], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.violations).toContain('TOOL_NOT_ENABLED');
  });
});

// ============================================================================
// GATE 7: Missing RBAC claims → denied
// ============================================================================

describe('GATE 7: user missing required claim → MISSING_CLAIM violation', () => {
  it('returns allowed=false when claim is absent', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['parcel:read'], // missing 'valuation:write' and 'supervisor:approve'
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.allowed).toBe(false);
  });

  it('violation contains MISSING_CLAIM:valuation:write', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['parcel:read'],
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.violations).toContain('MISSING_CLAIM:valuation:write');
  });

  it('violation contains MISSING_CLAIM:supervisor:approve', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['parcel:read'],
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.violations).toContain('MISSING_CLAIM:supervisor:approve');
  });

  it('hasRequiredClaims returns false when claim absent', () => {
    expect(hasRequiredClaims(['valuation:write'], ['parcel:read'])).toBe(false);
  });

  it('hasRequiredClaims returns true when all claims present', () => {
    expect(hasRequiredClaims(['valuation:write'], ['parcel:read', 'valuation:write'])).toBe(true);
  });
});

// ============================================================================
// GATE 8: Tool enabled + claims present → allowed
// ============================================================================

describe('GATE 8: tool enabled and claims present → allowed', () => {
  it('returns allowed=true', () => {
    const ctx = makeCtx({ enabledTools: ['parcel.view'], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.allowed).toBe(true);
  });

  it('violations array is empty', () => {
    const ctx = makeCtx({ enabledTools: ['parcel.view'], userClaims: ['parcel:read'] });
    const decision = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(decision.violations).toHaveLength(0);
  });

  it('isToolEnabled returns true when tool is in list', () => {
    expect(isToolEnabled('parcel.view', ['parcel.view', 'other.tool'])).toBe(true);
  });

  it('isToolEnabled returns false when tool is absent', () => {
    expect(isToolEnabled('parcel.view', ['other.tool'])).toBe(false);
  });
});

// ============================================================================
// GATE 9: Both violations simultaneously
// ============================================================================

describe('GATE 9: not enabled AND missing claims → both violations present', () => {
  it('returns both TOOL_NOT_ENABLED and MISSING_CLAIM violations', () => {
    const ctx = makeCtx({
      enabledTools: [], // tool not enabled
      userClaims: [],   // no claims
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.violations).toContain('TOOL_NOT_ENABLED');
    expect(decision.violations).toContain('MISSING_CLAIM:valuation:write');
    expect(decision.violations).toContain('MISSING_CLAIM:supervisor:approve');
    expect(decision.allowed).toBe(false);
  });
});

// ============================================================================
// GATE 10: County-scoped isolation
// ============================================================================

describe('GATE 10: county-scoped isolation', () => {
  it('county A with tool enabled → allowed', () => {
    const ctxA = makeCtx({
      countyId: 'county-benton',
      enabledTools: ['parcel.view'],
      userClaims: ['parcel:read'],
    });
    const decision = checkToolAccess(BASE_READ_TOOL, ctxA);
    expect(decision.allowed).toBe(true);
  });

  it('county B without tool enabled → denied', () => {
    const ctxB = makeCtx({
      countyId: 'county-yakima',
      enabledTools: [], // Yakima hasn't enabled this tool
      userClaims: ['parcel:read'],
    });
    const decision = checkToolAccess(BASE_READ_TOOL, ctxB);
    expect(decision.allowed).toBe(false);
    expect(decision.violations).toContain('TOOL_NOT_ENABLED');
  });

  it('same tool, different counties → independent decisions', () => {
    const ctxA = makeCtx({ countyId: 'county-benton', enabledTools: ['parcel.view'], userClaims: ['parcel:read'] });
    const ctxB = makeCtx({ countyId: 'county-yakima', enabledTools: [], userClaims: ['parcel:read'] });
    const decisionA = checkToolAccess(BASE_READ_TOOL, ctxA);
    const decisionB = checkToolAccess(BASE_READ_TOOL, ctxB);
    expect(decisionA.allowed).toBe(true);
    expect(decisionB.allowed).toBe(false);
  });
});

// ============================================================================
// GATE 11: write_high access grant enforces confirmation + reason policy
// ============================================================================

describe('GATE 11: write_high grant → policy.requiresConfirmation + requiresReasonCode', () => {
  it('allowed=true for user with full write_high claims', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['valuation:write', 'supervisor:approve'],
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.allowed).toBe(true);
  });

  it('policy.requiresConfirmation is true', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['valuation:write', 'supervisor:approve'],
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.policy.requiresConfirmation).toBe(true);
  });

  it('policy.requiresReasonCode is true', () => {
    const ctx = makeCtx({
      enabledTools: ['valuation.override'],
      userClaims: ['valuation:write', 'supervisor:approve'],
    });
    const decision = checkToolAccess(WRITE_HIGH_TOOL, ctx);
    expect(decision.policy.requiresReasonCode).toBe(true);
  });

  it('irreversible grant → policy.requiresSupervisor is true', () => {
    const ctx = makeCtx({
      enabledTools: ['roll.certify'],
      userClaims: ['roll:certify', 'supervisor:approve'],
    });
    const decision = checkToolAccess(IRREVERSIBLE_TOOL, ctx);
    expect(decision.allowed).toBe(true);
    expect(decision.policy.requiresSupervisor).toBe(true);
  });
});

// ============================================================================
// GATE 12: PII rule — violations never contain SSN/phone/email
// ============================================================================

describe('GATE 12: PII rule — violations are safe for trace emission', () => {
  const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/;
  const PHONE_PATTERN = /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/;
  const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  function assertNoPii(violations: string[]): void {
    const joined = violations.join('\n');
    expect(SSN_PATTERN.test(joined)).toBe(false);
    expect(PHONE_PATTERN.test(joined)).toBe(false);
    expect(EMAIL_PATTERN.test(joined)).toBe(false);
  }

  it('TOOL_NOT_ENABLED violation contains no PII', () => {
    const ctx = makeCtx({ enabledTools: [], userClaims: [] });
    const { violations } = checkToolAccess(BASE_READ_TOOL, ctx);
    assertNoPii(violations);
  });

  it('MISSING_CLAIM violation contains no PII', () => {
    const ctx = makeCtx({ enabledTools: ['parcel.view'], userClaims: [] });
    const { violations } = checkToolAccess(BASE_READ_TOOL, ctx);
    assertNoPii(violations);
  });

  it('simultaneous violations contain no PII', () => {
    const ctx = makeCtx({ enabledTools: [], userClaims: [] });
    const { violations } = checkToolAccess(IRREVERSIBLE_TOOL, ctx);
    assertNoPii(violations);
  });

  it('allowed decision has empty violations (no PII possible)', () => {
    const ctx = makeCtx({ enabledTools: ['parcel.view'], userClaims: ['parcel:read'] });
    const { violations } = checkToolAccess(BASE_READ_TOOL, ctx);
    expect(violations).toHaveLength(0);
    assertNoPii(violations);
  });
});
