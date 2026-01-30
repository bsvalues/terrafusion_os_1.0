/**
 * TerraFusion OS - Trace Access Control
 * Phase 7.1: Multi-user safety - Trace visibility rules
 *
 * RULES:
 *   1. Default: user can only query traces where actor.userId === me
 *   2. Elevated roles (admin, compliance_officer): can query any trace in same countyId
 *   3. Always deny cross-county trace access
 *   4. Never leak trace existence to unauthorized users (return 403, not 404)
 *
 * Government. Transcended.
 */

import type { TraceEvent } from '../types/index.js';

// ============================================================================
// Configuration
// ============================================================================

/** Roles that can view traces from other users in the same county */
export const ELEVATED_TRACE_ROLES = [
  'admin',
  'administrator',
  'compliance_officer',
  'auditor',
  'supervisor',
] as const;

export type ElevatedTraceRole = (typeof ELEVATED_TRACE_ROLES)[number];

// ============================================================================
// Types
// ============================================================================

export interface TraceAccessPrincipal {
  userId: string;
  roles: string[];
  countyId: string;
}

export interface TraceAccessDecision {
  allowed: boolean;
  reason: string;
  elevatedAccess?: boolean;
}

export interface TraceAccessDenied {
  code: 'TRACE_ACCESS_DENIED';
  message: string;
  countyMismatch?: boolean;
  userMismatch?: boolean;
}

// ============================================================================
// Access Control Logic
// ============================================================================

/**
 * Check if principal has an elevated trace role.
 */
export function hasElevatedTraceRole(principal: TraceAccessPrincipal): boolean {
  return principal.roles.some(role =>
    (ELEVATED_TRACE_ROLES as readonly string[]).includes(role.toLowerCase())
  );
}

/**
 * Check if two county IDs match (case-insensitive).
 */
function countyMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Evaluate trace access for a single event.
 *
 * @param principal - The user requesting access
 * @param event - The trace event to check access to
 * @returns Access decision with reason
 */
export function evaluateTraceAccess(
  principal: TraceAccessPrincipal,
  event: TraceEvent
): TraceAccessDecision {
  const eventCounty = event.context.countyId;
  const eventUser = event.context.userId;

  // Rule 3: Always deny cross-county
  if (!countyMatch(principal.countyId, eventCounty)) {
    return {
      allowed: false,
      reason: `Cross-county trace access denied: principal=${principal.countyId}, event=${eventCounty}`,
    };
  }

  // Rule 1: Same user can always view their own traces
  if (principal.userId === eventUser) {
    return {
      allowed: true,
      reason: 'User owns trace (actor.userId match)',
    };
  }

  // Rule 2: Elevated roles can view any trace in same county
  if (hasElevatedTraceRole(principal)) {
    return {
      allowed: true,
      reason: `Elevated trace access: role in [${principal.roles.join(',')}]`,
      elevatedAccess: true,
    };
  }

  // Default: deny
  return {
    allowed: false,
    reason: `User ${principal.userId} cannot view traces owned by ${eventUser}`,
  };
}

/**
 * Filter a list of trace events to only those the principal can access.
 *
 * @param principal - The user requesting access
 * @param events - The trace events to filter
 * @returns Filtered events the principal can access
 */
export function filterVisibleTraceEvents(
  principal: TraceAccessPrincipal,
  events: TraceEvent[]
): TraceEvent[] {
  return events.filter(event => evaluateTraceAccess(principal, event).allowed);
}

/**
 * Check if principal can view ANY event in a correlation batch.
 * This is used to decide whether to return 403 (no access) or empty array (no events found).
 *
 * If the principal has no access to any event, we return 403 to avoid leaking existence.
 *
 * @param principal - The user requesting access
 * @param events - All events for a correlation ID
 * @returns True if at least one event is visible
 */
export function canViewCorrelation(principal: TraceAccessPrincipal, events: TraceEvent[]): boolean {
  // If no events exist, we'll return empty (not 403) since there's nothing to hide
  if (events.length === 0) {
    return true;
  }

  // Check if principal can view at least one event
  return events.some(event => evaluateTraceAccess(principal, event).allowed);
}

/**
 * Build a standardized access denied response.
 */
export function buildAccessDenied(
  countyMismatch: boolean,
  userMismatch: boolean
): TraceAccessDenied {
  return {
    code: 'TRACE_ACCESS_DENIED',
    message: 'You do not have permission to view this trace',
    countyMismatch,
    userMismatch,
  };
}

// ============================================================================
// Metrics (for dashboard)
// ============================================================================

let accessDeniedCount = 0;
let crossCountyDeniedCount = 0;
let userMismatchDeniedCount = 0;

export function recordAccessDenied(reason: 'cross_county' | 'user_mismatch'): void {
  accessDeniedCount++;
  if (reason === 'cross_county') {
    crossCountyDeniedCount++;
  } else {
    userMismatchDeniedCount++;
  }
}

export function getAccessDeniedMetrics(): {
  total: number;
  crossCounty: number;
  userMismatch: number;
} {
  return {
    total: accessDeniedCount,
    crossCounty: crossCountyDeniedCount,
    userMismatch: userMismatchDeniedCount,
  };
}

export function resetAccessDeniedMetrics(): void {
  accessDeniedCount = 0;
  crossCountyDeniedCount = 0;
  userMismatchDeniedCount = 0;
}
