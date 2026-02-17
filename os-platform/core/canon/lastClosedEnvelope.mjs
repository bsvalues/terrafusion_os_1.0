/**
 * TerraCanon – LastClosed Envelope v2 (Canonical Specification)
 *
 * Defines the versioned envelope for persisted last-closed workspace state.
 * The v2 envelope wraps a strict Workspace inside a version + timestamp
 * container, enabling safe upgrade paths and fail-closed behavior.
 *
 * Pure ESM module — no React, no browser APIs.
 *
 * @module os-platform/core/canon/lastClosedEnvelope
 * @see Phase 47: TerraCanon Operational Hardening
 */

import { isValidWorkspace } from './reopenPersistence.mjs';

/**
 * LastClosed envelope v2 shape:
 *   { v: 2, workspace: { id: string, name: string }, ts: number }
 *
 * Rules:
 *   - v MUST be exactly 2 (number)
 *   - workspace MUST pass isValidWorkspace() (strict 2-key shape)
 *   - ts MUST be a positive finite number (unix ms)
 *   - Envelope MUST have exactly 3 keys (strict shape)
 */

/**
 * Validate a parsed envelope object.
 * Returns true IFF it matches the v2 shape exactly.
 *
 * @param {unknown} data - Value to validate.
 * @returns {boolean}
 */
export function isValidEnvelopeV2(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data);
  if (keys.length !== 3) return false;
  if (data.v !== 2) return false;
  if (typeof data.ts !== 'number' || !Number.isFinite(data.ts) || data.ts <= 0) {
    return false;
  }
  return isValidWorkspace(data.workspace);
}

/**
 * Parse a raw JSON string into a validated envelope.
 * Returns the workspace if valid, null otherwise (fail-closed).
 *
 * @param {string} raw - Raw JSON string from localStorage.
 * @returns {{ workspace: { id: string, name: string }, ts: number } | null}
 */
export function parseLastClosedV2(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!isValidEnvelopeV2(parsed)) return null;
    return { workspace: parsed.workspace, ts: parsed.ts };
  } catch {
    return null;
  }
}

/**
 * Serialize a workspace into a v2 envelope JSON string.
 *
 * @param {{ id: string, name: string }} workspace - Must pass isValidWorkspace.
 * @returns {string} JSON string of the envelope.
 * @throws {Error} If workspace is invalid.
 */
export function serializeLastClosedV2(workspace) {
  if (!isValidWorkspace(workspace)) {
    throw new Error('Cannot serialize invalid workspace into v2 envelope');
  }
  return JSON.stringify({
    v: 2,
    workspace: { id: workspace.id, name: workspace.name },
    ts: Date.now(),
  });
}

/** The envelope version number for v2. */
export const ENVELOPE_VERSION = 2;
