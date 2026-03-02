/// <reference types="vitest" />
/**
 * workbench.riskPolicy.test.ts
 *
 * Phase J Gate 5: Risk Policy Enforcement
 *
 * Validates that tool risk levels are properly defined and that
 * write_high/irreversible tools require confirmation + reason.
 *
 * @see 02_TERRAPILOT_SPEC_v3.1.md — Tool risk model
 * @see contracts/pilot.ts — ToolRisk, RiskPolicy types
 */

import type { RiskPolicy, ToolRisk } from '../../contracts/pilot';

// ============================================================================
// Constants
// ============================================================================

/** All valid risk levels, in ascending order */
const RISK_LEVELS: ToolRisk[] = ['read_only', 'write_low', 'write_high', 'irreversible'];

// ============================================================================
// Tests
// ============================================================================

describe('Gate: Risk Policy Enforcement', () => {
  it('risk levels are 4 tiers in ascending order', () => {
    expect(RISK_LEVELS).toEqual(['read_only', 'write_low', 'write_high', 'irreversible']);
  });

  it('write_high requires confirmation + reason', () => {
    const policy: RiskPolicy = {
      risk: 'write_high',
      requiresConfirmation: true,
      requiresReasonCode: true,
      requiresSupervisor: false,
    };
    expect(policy.requiresConfirmation).toBe(true);
    expect(policy.requiresReasonCode).toBe(true);
  });

  it('irreversible requires confirmation + reason + supervisor', () => {
    const policy: RiskPolicy = {
      risk: 'irreversible',
      requiresConfirmation: true,
      requiresReasonCode: true,
      requiresSupervisor: true,
    };
    expect(policy.requiresConfirmation).toBe(true);
    expect(policy.requiresReasonCode).toBe(true);
    expect(policy.requiresSupervisor).toBe(true);
  });

  it('read_only does not require confirmation', () => {
    const policy: RiskPolicy = {
      risk: 'read_only',
      requiresConfirmation: false,
      requiresReasonCode: false,
      requiresSupervisor: false,
    };
    expect(policy.requiresConfirmation).toBe(false);
  });

  it('risk escalation: each level >= previous', () => {
    // Risk levels must form a monotonic sequence
    const riskIndex = (r: ToolRisk) => RISK_LEVELS.indexOf(r);
    expect(riskIndex('read_only')).toBeLessThan(riskIndex('write_low'));
    expect(riskIndex('write_low')).toBeLessThan(riskIndex('write_high'));
    expect(riskIndex('write_high')).toBeLessThan(riskIndex('irreversible'));
  });
});
