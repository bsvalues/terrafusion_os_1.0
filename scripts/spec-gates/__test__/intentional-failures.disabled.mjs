/**
 * INTENTIONAL FAILURE TEST FILE
 *
 * Purpose: Validate that spec-gates correctly detect violations
 *
 * This file contains intentional violations that SHOULD trigger CI failures.
 * If the gates are working correctly, this file will fail:
 *   - Gate 1: Naming Lint (forbidden "Tara" and space variants)
 *   - Gate 3: Trace Immutability (TraceService.update call)
 *
 * HOW TO USE:
 * 1. Rename this file to remove ".disabled" suffix
 * 2. Run: node scripts/spec-gates/naming-lint.mjs
 * 3. Expect failure with violations reported
 * 4. Rename back to .disabled after validation
 *
 * DO NOT COMMIT THIS FILE WITHOUT THE .disabled SUFFIX
 */

// === GATE 1 VIOLATION: Naming Lint ===

// Forbidden: Tara misspelling
const TaraFusion = 'This should be TerraFusion';

// Forbidden: Space variant
const terraPilotName = 'Terra Pilot is wrong, should be TerraPilot';

// Forbidden: Lowercase mode names
const modeInfo = 'pilot mode should be Pilot Mode, muse mode should be Muse Mode';

// === GATE 3 VIOLATION: Trace Immutability ===

// Forbidden: In-place update
async function badTraceUpdate() {
  // This violates append-only rule
  await TraceService.update(eventId, { data: newData });
}

// Forbidden: DELETE on trace
const deleteQuery = 'DELETE FROM trace_events WHERE id = :id';

console.log('This file intentionally contains spec violations for testing.');
