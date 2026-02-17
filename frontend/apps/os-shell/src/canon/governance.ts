/**
 * TerraCanon – Governance Barrel Export
 *
 * Stable canonical entrypoint for UI-side governance imports.
 * All UI code should import workspace governance symbols from HERE,
 * not directly from reopenPersistence.ts.
 *
 * Keep this file tiny and stable.
 *
 * @module canon/governance
 * @see Phase 41: Validator Deduplication
 * @see Phase 42: Barrel Export
 */

export { STORAGE_KEY_LAST_CLOSED, isValidWorkspace } from './reopenPersistence';
export type { Workspace } from './reopenPersistence';

