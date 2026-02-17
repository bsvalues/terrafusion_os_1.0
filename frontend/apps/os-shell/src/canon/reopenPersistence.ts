/**
 * TerraCanon – Workspace Governance (UI-Side Canonical Source)
 *
 * THE ONLY file in the frontend that may define workspace validators.
 * All other UI code MUST import from here — never redefine locally.
 *
 * Contract alignment:
 *   os-platform/core/canon/reopenPersistence.mjs = governance spec (core lane)
 *   canon-reopen.contract.test.mjs              = 17 tripwire tests pinning shape
 *   THIS FILE                                    = UI-side single source
 *
 * If you change the validator logic here, the core-lane tripwire tests
 * will catch any divergence from the canonical contract.
 *
 * @module canon/reopenPersistence
 * @see Phase 40: TerraCanon Persisted Reopen Tripwire Tests
 * @see Phase 41: Validator Deduplication
 */

export interface Workspace {
  id: string;
  name: string;
}

/** localStorage key for the last-closed workspace (v1 schema). */
export const STORAGE_KEY_LAST_CLOSED = 'tf.canon.lastClosed.v1';

/**
 * Strict workspace shape validator.
 *
 * Returns true IFF data is a plain object with EXACTLY two string properties
 * `id` and `name`, both non-empty. Extra keys are rejected — strict shape
 * contract, not a duck-type check.
 */
export function isValidWorkspace(data: unknown): data is Workspace {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  if (Object.keys(data as Record<string, unknown>).length !== 2) return false;
  return (
    typeof (data as Workspace).id === 'string' &&
    (data as Workspace).id.length > 0 &&
    typeof (data as Workspace).name === 'string' &&
    (data as Workspace).name.length > 0
  );
}
