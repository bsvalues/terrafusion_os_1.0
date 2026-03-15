/**
 * TFR-061: Immutable Change Receipts
 *
 * Every data modification produces a tamper-evident receipt containing
 * the before/after diff and a SHA-256 hash of the receipt payload.
 */

import { computeDiff, type FieldDiff } from '../services/terraTrace';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChangeReceipt {
  /** Unique receipt identifier. */
  id: string;
  /** ISO-8601 timestamp of when the change was recorded. */
  timestamp: string;
  /** Entity type, e.g. "parcel", "assessment". */
  entityType: string;
  /** Entity primary key. */
  entityId: string;
  /** User or system that performed the change. */
  actor: string;
  /** Field-level diffs. */
  diffs: FieldDiff[];
  /** SHA-256 hex digest of the canonical receipt payload (tamper detection). */
  hash: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateReceiptId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Compute SHA-256 hex digest of a string.
 * Uses the Web Crypto API (available in all modern browsers and Node 15+).
 * Falls back to a deterministic placeholder if crypto is unavailable
 * (e.g. unit tests without a polyfill).
 */
async function sha256(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const data = new TextEncoder().encode(input);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback for environments without Web Crypto.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return `fallback_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create an immutable change receipt from before/after snapshots.
 */
export async function createChangeReceipt(
  entityType: string,
  entityId: string,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
  actor: string,
): Promise<ChangeReceipt> {
  const id = generateReceiptId();
  const timestamp = new Date().toISOString();
  const diffs = computeDiff(before, after);

  // Canonical payload for hashing — deterministic JSON ordering.
  const payload = JSON.stringify({ id, timestamp, entityType, entityId, actor, diffs });
  const hash = await sha256(payload);

  return { id, timestamp, entityType, entityId, actor, diffs, hash };
}
