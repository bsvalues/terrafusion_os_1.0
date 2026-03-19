/**
 * ═══════════════════════════════════════════════════════════════
 * COUNTY ISOLATION ENFORCEMENT — CP-W5-1
 * ═══════════════════════════════════════════════════════════════
 *
 * Isolation invariant: A request authenticated to CountyId A must
 * never return data owned by CountyId B.
 *
 * This module provides:
 *   1. assertCountyContext — runtime guard that rejects empty county context
 *   2. buildCountyScopedHeaders — canonical header builder for all data requests
 *   3. validateCountyOwnership — pre-flight check before writes
 *   4. CountyIsolationAudit — structured audit record per API surface
 *
 * Every data-bearing API call MUST pass through buildCountyScopedHeaders().
 * Calls that bypass this violate the isolation invariant.
 */

import type { AuthContextValue } from '../auth/useAuthContext';
import type { Session } from '../auth/session';

// ============================================================================
// Types
// ============================================================================

/** County scoping enforcement level. */
export type EnforcementLevel =
  | 'mandatory'     // CountyId required — 403 if missing
  | 'system_only'   // System-level endpoint, no county scoping needed
  | 'stub'          // Endpoint exists but returns placeholder data
  | 'cross_county'; // Intentionally cross-county (federation/integration)

/** Audit record for a single API surface. */
export interface CountyIsolationAudit {
  /** API surface identifier (e.g., 'PropertiesController.GetProperties') */
  surface: string;
  /** Whether county filtering is enforced */
  enforced: boolean;
  /** How county context is transmitted */
  mechanism: 'header' | 'jwt_claim' | 'query_param' | 'body_field' | 'route_param' | 'none';
  /** Risk level if isolation is missing */
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  /** Enforcement level designation */
  enforcement: EnforcementLevel;
  /** Gap description if not fully enforced */
  gap?: string;
}

/** Validation result from county context assertion. */
export interface CountyContextResult {
  valid: boolean;
  countyId: string | null;
  error?: string;
}

// ============================================================================
// Runtime Guards
// ============================================================================

/**
 * Assert that a county context is present and non-empty.
 * Returns a structured result — never throws.
 */
export function assertCountyContext(
  countyId: string | null | undefined,
): CountyContextResult {
  if (!countyId || countyId.trim().length === 0) {
    return {
      valid: false,
      countyId: null,
      error: 'COUNTY_CONTEXT_MISSING',
    };
  }
  return { valid: true, countyId };
}

/**
 * Build canonical county-scoped request headers from auth context.
 *
 * Rules:
 *   - Always includes Authorization when token is present
 *   - Always includes X-County-Id when countyId is present
 *   - Always includes X-User-Id when userId is present
 *   - Returns error marker if countyId is missing (caller must decide behavior)
 */
export function buildCountyScopedHeaders(
  auth: AuthContextValue,
): { headers: Record<string, string>; isolated: boolean } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }
  if (auth.userId) {
    headers['X-User-Id'] = auth.userId;
  }

  const ctx = assertCountyContext(auth.countyId);
  if (ctx.valid && ctx.countyId) {
    headers['X-County-Id'] = ctx.countyId;
    return { headers, isolated: true };
  }

  return { headers, isolated: false };
}

/**
 * Build county-scoped headers from a dev session (Pilot subsystem variant).
 */
export function buildCountyScopedSessionHeaders(
  session: Session | null,
): { headers: Record<string, string>; isolated: boolean } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!session) {
    return { headers, isolated: false };
  }

  headers['x-user-id'] = session.userId;

  const ctx = assertCountyContext(session.countyId);
  if (ctx.valid && ctx.countyId) {
    headers['x-county-id'] = ctx.countyId;
    if (session.role) headers['x-role'] = session.role;
    if (session.mode) headers['x-mode'] = session.mode;
    return { headers, isolated: true };
  }

  return { headers, isolated: false };
}

/**
 * Validate that a resource belongs to the caller's county before write.
 * Returns false if counties don't match — caller must reject the write.
 */
export function validateCountyOwnership(
  callerCountyId: string,
  resourceCountyId: string,
): boolean {
  if (!callerCountyId || !resourceCountyId) return false;
  return callerCountyId.toLowerCase() === resourceCountyId.toLowerCase();
}

// ============================================================================
// API Surface Audit Registry
// ============================================================================

/**
 * Canonical audit of all backend API surfaces and their county isolation status.
 *
 * This registry captures the current enforcement state of every data-returning
 * controller in TerraFusion.API. It serves as both documentation and a contract
 * that can be tested against.
 *
 * LAST AUDITED: Phase 9 (CP-W5-1)
 */
export const COUNTY_ISOLATION_AUDIT: readonly CountyIsolationAudit[] = [
  // ── Strong enforcement ──────────────────────────────────────────────
  {
    surface: 'CostForgeController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'PropertyValuationController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'DossierController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'AtlasController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'ClerkController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'AuditController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },
  {
    surface: 'LevyCalculationController',
    enforced: true,
    mechanism: 'jwt_claim',
    riskLevel: 'none',
    enforcement: 'mandatory',
  },

  // ── Gaps requiring remediation ──────────────────────────────────────
  {
    surface: 'PropertiesController.GetProperties',
    enforced: false,
    mechanism: 'query_param',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'countyId is optional query parameter — omitting returns cross-county data',
  },
  {
    surface: 'PropertiesController.GetPropertyByParcel',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'No county filtering — parcel lookup crosses county boundaries',
  },
  {
    surface: 'PropertiesController.GetPropertyValuations',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'No county check on valuation retrieval by property ID',
  },
  {
    surface: 'PropertiesController.CreateValuation',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'No county verification before write — cross-county write possible',
  },
  {
    surface: 'GisController',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'medium',
    enforcement: 'mandatory',
    gap: 'Spatial/parcel queries return data from any county',
  },
  {
    surface: 'AtlasGisController',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'medium',
    enforcement: 'mandatory',
    gap: 'Spatial queries by bounding box return cross-county features',
  },
  {
    surface: 'DaisController.Certification',
    enforced: false,
    mechanism: 'jwt_claim',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'Falls back to sentinel GUID 00000000-0000-0000-0000-000000000001 when claim is missing',
  },
  {
    surface: 'DaisController.Notice',
    enforced: false,
    mechanism: 'jwt_claim',
    riskLevel: 'high',
    enforcement: 'mandatory',
    gap: 'Falls back to sentinel GUID when claim is missing',
  },
  {
    surface: 'ValuationController',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'low',
    enforcement: 'stub',
    gap: 'Stub controller — no county scoping infrastructure for future implementation',
  },
  {
    surface: 'PropertyAssessmentController',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'low',
    enforcement: 'stub',
    gap: 'Stub controller — no county scoping infrastructure',
  },

  // ── Intentionally cross-county ─────────────────────────────────────
  {
    surface: 'MultiCountyFederationController',
    enforced: false,
    mechanism: 'none',
    riskLevel: 'none',
    enforcement: 'cross_county',
  },
  {
    surface: 'MultiCountyIntegrationController',
    enforced: false,
    mechanism: 'route_param',
    riskLevel: 'none',
    enforcement: 'cross_county',
  },
] as const;

/**
 * Get all surfaces with isolation gaps.
 */
export function getIsolationGaps(): readonly CountyIsolationAudit[] {
  return COUNTY_ISOLATION_AUDIT.filter(
    (a) => a.enforcement === 'mandatory' && !a.enforced,
  );
}

/**
 * Get all surfaces with strong enforcement.
 */
export function getEnforcedSurfaces(): readonly CountyIsolationAudit[] {
  return COUNTY_ISOLATION_AUDIT.filter((a) => a.enforced);
}
