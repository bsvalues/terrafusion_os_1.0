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
/** Roles that can view traces from other users in the same county */
export declare const ELEVATED_TRACE_ROLES: readonly ["admin", "administrator", "compliance_officer", "auditor", "supervisor"];
export type ElevatedTraceRole = (typeof ELEVATED_TRACE_ROLES)[number];
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
/**
 * Check if principal has an elevated trace role.
 */
export declare function hasElevatedTraceRole(principal: TraceAccessPrincipal): boolean;
/**
 * Evaluate trace access for a single event.
 *
 * @param principal - The user requesting access
 * @param event - The trace event to check access to
 * @returns Access decision with reason
 */
export declare function evaluateTraceAccess(principal: TraceAccessPrincipal, event: TraceEvent): TraceAccessDecision;
/**
 * Filter a list of trace events to only those the principal can access.
 *
 * @param principal - The user requesting access
 * @param events - The trace events to filter
 * @returns Filtered events the principal can access
 */
export declare function filterVisibleTraceEvents(principal: TraceAccessPrincipal, events: TraceEvent[]): TraceEvent[];
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
export declare function canViewCorrelation(principal: TraceAccessPrincipal, events: TraceEvent[]): boolean;
/**
 * Build a standardized access denied response.
 */
export declare function buildAccessDenied(countyMismatch: boolean, userMismatch: boolean): TraceAccessDenied;
export declare function recordAccessDenied(reason: 'cross_county' | 'user_mismatch'): void;
export declare function getAccessDeniedMetrics(): {
    total: number;
    crossCounty: number;
    userMismatch: number;
};
export declare function resetAccessDeniedMetrics(): void;
