/**
 * TerraCanon – Persisted Reopen Contract (Canonical Specification)
 *
 * Governance source-of-truth for the persisted reopen contract.
 * The frontend implementation (CanonHome.tsx) MUST conform to these
 * constants and validators. Tripwire tests in the core lane enforce
 * that the contract shape never drifts.
 *
 * Pure ESM module — no React, no browser APIs.
 *
 * @module os-platform/core/canon/reopenPersistence
 * @see Phase 39: TerraCanon Persisted Reopen Contract
 * @see Phase 40: TerraCanon Persisted Reopen Tripwire Tests
 */

/** localStorage key for the last-closed workspace (v1 schema). */
export const STORAGE_KEY_LAST_CLOSED_V1 = 'tf.canon.lastClosed.v1';

/**
 * Strict workspace shape validator.
 *
 * Returns true IFF data is an object with EXACTLY two string properties
 * `id` and `name`, both non-empty. Extra keys are rejected — this is a
 * strict shape contract, not a duck-type check.
 *
 * @param {unknown} data - Value to validate.
 * @returns {boolean} true if data matches the Workspace shape exactly.
 */
export function isValidWorkspace(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data);
  if (keys.length !== 2) return false;
  return (
    typeof data.id === 'string' &&
    data.id.length > 0 &&
    typeof data.name === 'string' &&
    data.name.length > 0
  );
}
