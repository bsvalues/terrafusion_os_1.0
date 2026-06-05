/**
 * Canon Trace Seal (Core)
 *
 * Tamper-evident sealing for Canon evidence bundles. The seal is a SHA-256 over
 * the bundle's CONTENT (excluding the seal fields themselves), so any later edit
 * to content invalidates verification. Deterministic and read-only — the caller
 * supplies the sealedAt timestamp (no wall-clock here).
 *
 * Fail-loud: a bundle with a failed gate cannot be sealed — you do not seal
 * proof over a failure.
 *
 * @module canon/canon-trace-seal
 */

import { createHash } from 'node:crypto';
import { canonicalize } from './canon-evidence.mjs';

/** Seal-only fields excluded from the content hash. */
const SEAL_FIELDS = new Set(['sealed', 'sealedAt', 'traceHash']);

/**
 * Compute the content hash of a bundle (excludes seal fields). Never throws on
 * a well-formed object.
 * @param {Record<string, unknown>} bundle
 * @returns {string} `sha256-<64 hex>`
 */
export function computeContentHash(bundle) {
  /** @type {Record<string, unknown>} */
  const content = {};
  for (const k of Object.keys(bundle || {})) {
    if (!SEAL_FIELDS.has(k)) content[k] = /** @type {Record<string, unknown>} */ (bundle)[k];
  }
  const hex = createHash('sha256').update(canonicalize(content)).digest('hex');
  return `sha256-${hex}`;
}

/**
 * Seal an evidence bundle: returns a NEW frozen bundle with sealed=true, the
 * caller-supplied sealedAt, and a content traceHash. Refuses to seal if any gate
 * failed.
 * @param {Record<string, unknown>} bundle
 * @param {string} sealedAt ISO timestamp supplied by the caller
 * @returns {Readonly<Record<string, unknown>>}
 */
export function sealEvidenceBundle(bundle, sealedAt) {
  if (!bundle || typeof bundle !== 'object') throw new Error('Trace seal: bundle must be an object');
  if (typeof sealedAt !== 'string' || sealedAt.length === 0) {
    throw new Error('Trace seal: sealedAt must be a non-empty ISO timestamp string');
  }
  const gateResults = Array.isArray(bundle.gateResults) ? bundle.gateResults : [];
  const failed = gateResults.filter((g) => g && typeof g === 'object' && g.status === 'fail');
  if (failed.length > 0) {
    const ids = failed.map((g) => g.gateId || '?').join(', ');
    throw new Error(`Trace seal: cannot seal — ${failed.length} gate(s) failed: ${ids}`);
  }
  const traceHash = computeContentHash(bundle);
  return Object.freeze({ ...bundle, sealed: true, sealedAt, traceHash });
}

/**
 * Verify a sealed bundle: true only if it claims sealed, carries a traceHash,
 * and that hash matches the recomputed content hash. Never throws.
 * @param {Record<string, unknown>} bundle
 * @returns {boolean}
 */
export function verifyTraceSeal(bundle) {
  if (!bundle || typeof bundle !== 'object') return false;
  if (bundle.sealed !== true) return false;
  if (typeof bundle.traceHash !== 'string' || bundle.traceHash.length === 0) return false;
  return computeContentHash(bundle) === bundle.traceHash;
}
