/**
 * TerraFusion OS — TerraPilot RBAC + Tool Allowlist Enforcement
 * ═══════════════════════════════════════════════════════════════
 *
 * CP-W4-2: Phase 8 — Wave 4B
 *
 * Enforces the two-layer TerraPilot authorization model:
 *   Layer 1 — Tool allowlist: tool must be in ctx.enabledTools (county/license/policy scoped)
 *   Layer 2 — RBAC claims:   user must hold all requiredClaims on the ToolDescriptor
 *
 * Additionally derives the canonical RiskPolicy for any ToolRisk level.
 *
 * All functions are pure (no async, no side effects).
 * Callers are responsible for emitting permission_denied trace events on denial.
 *
 * @see contracts/pilot.ts — ToolRisk, RiskPolicy, ToolDescriptor, ToolExecutionContext
 * @see services/terraTrace.ts — emitPermissionDenied
 * @see 02_TERRAPILOT_SPEC_v3.1.md — Section 4 (Two-layer authorization)
 */

import type {
  ToolRisk,
  RiskPolicy,
  ToolDescriptor,
  ToolExecutionContext,
} from '../contracts/pilot';

// ============================================================================
// AccessDecision
// ============================================================================

/**
 * Result of an RBAC + allowlist access check.
 * `allowed` is true only when all checks pass.
 * `violations` is empty when allowed.
 */
export interface AccessDecision {
  allowed: boolean;
  /**
   * Machine-readable violation tokens. Safe for trace emission.
   * NEVER contains PII (SSN, phone, email).
   *
   * Possible values:
   *   'TOOL_NOT_ENABLED'        — tool not in ctx.enabledTools
   *   'MISSING_CLAIM:<claimId>' — user lacks a required RBAC claim
   */
  violations: string[];
  /** Derived risk policy — always present regardless of allow/deny. */
  policy: RiskPolicy;
}

// ============================================================================
// getRiskPolicy
// ============================================================================

/**
 * Derive the canonical RiskPolicy for a given ToolRisk level.
 *
 * | Risk         | Confirmation | ReasonCode | Supervisor |
 * |--------------|-------------|------------|------------|
 * | read_only    | no          | no         | no         |
 * | write_low    | no          | no         | no         |
 * | write_high   | required    | required   | no         |
 * | irreversible | required    | required   | required   |
 */
export function getRiskPolicy(risk: ToolRisk): RiskPolicy {
  switch (risk) {
    case 'read_only':
      return {
        risk,
        requiresConfirmation: false,
        requiresReasonCode: false,
        requiresSupervisor: false,
      };

    case 'write_low':
      return {
        risk,
        requiresConfirmation: false,
        requiresReasonCode: false,
        requiresSupervisor: false,
      };

    case 'write_high':
      return {
        risk,
        requiresConfirmation: true,
        requiresReasonCode: true,
        requiresSupervisor: false,
      };

    case 'irreversible':
      return {
        risk,
        requiresConfirmation: true,
        requiresReasonCode: true,
        requiresSupervisor: true,
      };
  }
}

// ============================================================================
// Allowlist check
// ============================================================================

/**
 * Returns true if the given toolId appears in the county/policy-scoped enabledTools list.
 * enabledTools is expected to be pre-fetched and pre-filtered for the current county.
 */
export function isToolEnabled(toolId: string, enabledTools: string[]): boolean {
  return enabledTools.includes(toolId);
}

// ============================================================================
// RBAC claims check
// ============================================================================

/**
 * Returns true if every required claim is present in the user's claim set.
 * An empty `required` array is always satisfied.
 */
export function hasRequiredClaims(required: string[], userClaims: string[]): boolean {
  return required.every((claim) => userClaims.includes(claim));
}

// ============================================================================
// checkToolAccess — primary enforcement entry point
// ============================================================================

/**
 * Two-layer access check: allowlist then RBAC claims.
 *
 * Usage:
 *   const decision = checkToolAccess(descriptor, ctx);
 *   if (!decision.allowed) {
 *     emitPermissionDenied({ countyId, correlationId, violations: decision.violations, ... });
 *     return;
 *   }
 *   // Proceed with tool invocation. For write_high/irreversible, enforce
 *   // decision.policy.requiresConfirmation / requiresReasonCode / requiresSupervisor.
 */
export function checkToolAccess(
  tool: ToolDescriptor,
  ctx: ToolExecutionContext,
): AccessDecision {
  const violations: string[] = [];

  // Layer 1: allowlist
  if (!isToolEnabled(tool.toolId, ctx.enabledTools)) {
    violations.push('TOOL_NOT_ENABLED');
  }

  // Layer 2: RBAC claims
  const missingClaims = tool.requiredClaims.filter((c) => !ctx.userClaims.includes(c));
  for (const claim of missingClaims) {
    violations.push(`MISSING_CLAIM:${claim}`);
  }

  return {
    allowed: violations.length === 0,
    violations,
    policy: getRiskPolicy(tool.risk),
  };
}
