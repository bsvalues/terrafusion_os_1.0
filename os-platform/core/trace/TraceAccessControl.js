// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELEVATED_TRACE_ROLES = void 0;
exports.hasElevatedTraceRole = hasElevatedTraceRole;
exports.evaluateTraceAccess = evaluateTraceAccess;
exports.filterVisibleTraceEvents = filterVisibleTraceEvents;
exports.canViewCorrelation = canViewCorrelation;
exports.buildAccessDenied = buildAccessDenied;
exports.recordAccessDenied = recordAccessDenied;
exports.getAccessDeniedMetrics = getAccessDeniedMetrics;
exports.resetAccessDeniedMetrics = resetAccessDeniedMetrics;
// ============================================================================
// Configuration
// ============================================================================
/** Roles that can view traces from other users in the same county */
exports.ELEVATED_TRACE_ROLES = [
    'admin',
    'administrator',
    'compliance_officer',
    'auditor',
    'supervisor',
];
// ============================================================================
// Access Control Logic
// ============================================================================
/**
 * Check if principal has an elevated trace role.
 */
function hasElevatedTraceRole(principal) {
    return principal.roles.some(role => exports.ELEVATED_TRACE_ROLES.includes(role.toLowerCase()));
}
/**
 * Check if two county IDs match (case-insensitive).
 */
function countyMatch(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}
/**
 * Evaluate trace access for a single event.
 *
 * @param principal - The user requesting access
 * @param event - The trace event to check access to
 * @returns Access decision with reason
 */
function evaluateTraceAccess(principal, event) {
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
function filterVisibleTraceEvents(principal, events) {
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
function canViewCorrelation(principal, events) {
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
function buildAccessDenied(countyMismatch, userMismatch) {
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
function recordAccessDenied(reason) {
    accessDeniedCount++;
    if (reason === 'cross_county') {
        crossCountyDeniedCount++;
    }
    else {
        userMismatchDeniedCount++;
    }
}
function getAccessDeniedMetrics() {
    return {
        total: accessDeniedCount,
        crossCounty: crossCountyDeniedCount,
        userMismatch: userMismatchDeniedCount,
    };
}
function resetAccessDeniedMetrics() {
    accessDeniedCount = 0;
    crossCountyDeniedCount = 0;
    userMismatchDeniedCount = 0;
}
