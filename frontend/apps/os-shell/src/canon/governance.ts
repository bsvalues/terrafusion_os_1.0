/**
 * TerraCanon – Governance Barrel Export
 *
 * Stable canonical entrypoint for UI-side governance imports.
 * All UI code should import workspace governance symbols from HERE,
 * not directly from reopenPersistence.ts or lastClosedEnvelope.ts.
 *
 * Keep this file tiny and stable.
 *
 * @module canon/governance
 * @see Phase 41: Validator Deduplication
 * @see Phase 42: Barrel Export
 * @see Phase 47: Operational Hardening (envelope v2)
 */

export { STORAGE_KEY_LAST_CLOSED, isValidWorkspace } from './reopenPersistence';
export type { Workspace } from './reopenPersistence';
export {
  ENVELOPE_VERSION,
  isValidEnvelopeV2,
  parseLastClosedV2,
  serializeLastClosedV2,
} from './lastClosedEnvelope';
export type { LastClosedEnvelopeV2 } from './lastClosedEnvelope';
