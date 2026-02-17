/**
 * TerraCanon – LastClosed Envelope v2 (UI-Side Implementation)
 *
 * Versioned envelope for persisted last-closed workspace state.
 * Wraps a strict Workspace inside { v: 2, workspace, ts } for
 * safe upgrade paths and fail-closed behavior.
 *
 * Contract alignment:
 *   os-platform/core/canon/lastClosedEnvelope.mjs = governance spec (core lane)
 *   reopenPersistence.envelope.contract.test.mjs  = 33 contract tests
 *   canon-reopen.cross-tab.contract.test.mjs      = 12 cross-tab tests
 *   THIS FILE                                      = UI-side implementation
 *
 * @module canon/lastClosedEnvelope
 * @see Phase 47: TerraCanon Operational Hardening
 */

import { isValidWorkspace, type Workspace } from './reopenPersistence';

/** LastClosed envelope v2 shape. */
export interface LastClosedEnvelopeV2 {
  v: 2;
  workspace: Workspace;
  ts: number;
}

/** The envelope version number for v2. */
export const ENVELOPE_VERSION = 2;

/**
 * Validate a parsed envelope object.
 * Returns true IFF it matches the v2 shape exactly:
 *   - v === 2 (number)
 *   - workspace passes isValidWorkspace() (strict 2-key shape)
 *   - ts is a positive finite number (unix ms)
 *   - Exactly 3 keys at envelope level (strict shape)
 */
export function isValidEnvelopeV2(data: unknown): data is LastClosedEnvelopeV2 {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data as Record<string, unknown>);
  if (keys.length !== 3) return false;
  const obj = data as Record<string, unknown>;
  if (obj.v !== 2) return false;
  if (typeof obj.ts !== 'number' || !Number.isFinite(obj.ts) || (obj.ts as number) <= 0) {
    return false;
  }
  return isValidWorkspace(obj.workspace);
}

/**
 * Parse a raw JSON string into a validated envelope.
 * Returns the workspace + timestamp if valid, null otherwise (fail-closed).
 */
export function parseLastClosedV2(raw: string): { workspace: Workspace; ts: number } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidEnvelopeV2(parsed)) return null;
    return { workspace: parsed.workspace, ts: parsed.ts };
  } catch {
    return null;
  }
}

/**
 * Serialize a workspace into a v2 envelope JSON string.
 * Throws if workspace is invalid.
 */
export function serializeLastClosedV2(workspace: Workspace): string {
  if (!isValidWorkspace(workspace)) {
    throw new Error('Cannot serialize invalid workspace into v2 envelope');
  }
  return JSON.stringify({
    v: ENVELOPE_VERSION,
    workspace: { id: workspace.id, name: workspace.name },
    ts: Date.now(),
  });
}
