/**
 * Phase 4N44e – Rollup Compaction
 * ================================
 *
 * Monthly rollups preserving hash chain continuity.
 *
 * Invariants:
 *   - Rollups contain references to ledger entries (not copies)
 *   - previousRollupSha256 maintains chain across months
 *   - Rollups are additive only - never rewritten
 *   - Verifier can validate rollup chain offline
 */

import * as crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const ROLLUP_SCHEMA = 'terrafusion.autonomy.ledger-rollup.v1';
export const ROLLUP_VERSION = '4N44.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference to a ledger entry (not the full content).
 */
export interface LedgerEntryRef {
  /** Sequence number in the ledger */
  sequenceNumber: number;
  /** SHA256 of the ledger entry */
  sha256: string;
  /** Record/run identifier */
  recordId: string;
  /** Entry timestamp */
  timestamp: string;
  /** Previous entry SHA256 (for chain verification) */
  previousSha256?: string | null;
}

/**
 * Monthly rollup of ledger entries.
 */
export interface LedgerRollup {
  /** Schema identifier */
  $schema: typeof ROLLUP_SCHEMA;
  /** Tool version */
  toolVersion: typeof ROLLUP_VERSION;
  /** Period covered (YYYY-MM) */
  period: string;
  /** Year */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Previous rollup SHA256 (chain link) */
  previousRollupSha256: string | null;
  /** Entry references (ordered by sequence) */
  entries: LedgerEntryRef[];
  /** Number of entries */
  entryCount: number;
  /** Head entry SHA256 (last entry in period) */
  headSha256: string | null;
  /** First entry SHA256 (first entry in period) */
  tailSha256: string | null;
  /** Rollup creation timestamp */
  createdAt: string;
  /** SHA256 of this rollup (computed on finalization) */
  rollupSha256: string;
}

/**
 * Chain of rollups.
 */
export interface RollupChain {
  /** Ordered list of rollups (oldest first) */
  rollups: LedgerRollup[];
  /** SHA256 of the most recent rollup */
  headSha256: string | null;
  /** SHA256 of the oldest rollup */
  tailSha256: string | null;
  /** Total entries across all rollups */
  totalEntries: number;
}

/**
 * Error codes for rollup operations.
 */
export type RollupErrorCode =
  | 'CHAIN_BROKEN'
  | 'PERIOD_GAP'
  | 'DUPLICATE_PERIOD'
  | 'HASH_MISMATCH'
  | 'INVALID_SEQUENCE';

/**
 * Rollup verification error.
 */
export interface RollupError {
  code: RollupErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result of rollup chain verification.
 */
export interface RollupVerificationResult {
  ok: boolean;
  errors: RollupError[];
  /** Total entries verified */
  entriesVerified: number;
  /** Periods covered */
  periodsCovered: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SHA256 of a string.
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Format period string from year and month.
 */
function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Parse period string into year and month.
 */
function parsePeriod(period: string): { year: number; month: number } {
  const [yearStr, monthStr] = period.split('-');
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
}

/**
 * Get next period after the given one.
 */
function nextPeriod(period: string): string {
  const { year, month } = parsePeriod(period);
  if (month === 12) {
    return formatPeriod(year + 1, 1);
  }
  return formatPeriod(year, month + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollup Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for creating a monthly rollup.
 */
export interface CreateRollupOptions {
  year: number;
  month: number;
  previousRollupSha256?: string | null;
}

/**
 * Create a new monthly rollup.
 */
export function createMonthlyRollup(options: CreateRollupOptions): LedgerRollup {
  return {
    $schema: ROLLUP_SCHEMA,
    toolVersion: ROLLUP_VERSION,
    period: formatPeriod(options.year, options.month),
    year: options.year,
    month: options.month,
    previousRollupSha256: options.previousRollupSha256 ?? null,
    entries: [],
    entryCount: 0,
    headSha256: null,
    tailSha256: null,
    createdAt: new Date().toISOString(),
    rollupSha256: '', // Computed on finalization
  };
}

/**
 * Add an entry reference to a rollup.
 *
 * Returns a new rollup (immutable).
 */
export function addEntryToRollup(rollup: LedgerRollup, entry: LedgerEntryRef): LedgerRollup {
  return {
    ...rollup,
    entries: [...rollup.entries, entry],
    entryCount: rollup.entryCount + 1,
  };
}

/**
 * Finalize a rollup (sort entries, compute hash).
 */
export function finalizeRollup(rollup: LedgerRollup): LedgerRollup {
  // Sort entries by sequence number
  const sortedEntries = [...rollup.entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const tailSha256 = sortedEntries.length > 0 ? sortedEntries[0].sha256 : null;
  const headSha256 =
    sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].sha256 : null;

  // Create finalized rollup structure (without hash yet)
  const finalized: LedgerRollup = {
    ...rollup,
    entries: sortedEntries,
    entryCount: sortedEntries.length,
    headSha256,
    tailSha256,
    rollupSha256: '', // Placeholder
  };

  // Compute rollup hash over canonical content
  const hashContent = JSON.stringify({
    period: finalized.period,
    previousRollupSha256: finalized.previousRollupSha256,
    entries: finalized.entries.map(e => ({
      sequenceNumber: e.sequenceNumber,
      sha256: e.sha256,
    })),
    entryCount: finalized.entryCount,
  });

  finalized.rollupSha256 = sha256(hashContent);

  return finalized;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Link rollups into a chain.
 */
export function linkRollups(rollups: LedgerRollup[]): RollupChain {
  if (rollups.length === 0) {
    return {
      rollups: [],
      headSha256: null,
      tailSha256: null,
      totalEntries: 0,
    };
  }

  // Sort by period
  const sorted = [...rollups].sort((a, b) => a.period.localeCompare(b.period));

  const totalEntries = sorted.reduce((sum, r) => sum + r.entryCount, 0);

  return {
    rollups: sorted,
    headSha256: sorted[sorted.length - 1].rollupSha256,
    tailSha256: sorted[0].rollupSha256,
    totalEntries,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a rollup chain for integrity.
 */
export function verifyRollupChain(chain: RollupChain): RollupVerificationResult {
  const errors: RollupError[] = [];
  let entriesVerified = 0;
  const periodsCovered: string[] = [];

  if (chain.rollups.length === 0) {
    return {
      ok: true,
      errors: [],
      entriesVerified: 0,
      periodsCovered: [],
    };
  }

  // Verify chain linkage
  for (let i = 1; i < chain.rollups.length; i++) {
    const prev = chain.rollups[i - 1];
    const curr = chain.rollups[i];

    // Check previousRollupSha256 points to previous rollup
    if (curr.previousRollupSha256 !== prev.rollupSha256) {
      errors.push({
        code: 'CHAIN_BROKEN',
        message: `Rollup ${curr.period} has previousRollupSha256 ${curr.previousRollupSha256?.substring(0, 16)}... but expected ${prev.rollupSha256.substring(0, 16)}...`,
        details: {
          period: curr.period,
          expected: prev.rollupSha256,
          actual: curr.previousRollupSha256,
        },
      });
    }

    // Check periods are consecutive
    const expectedPeriod = nextPeriod(prev.period);
    if (curr.period !== expectedPeriod) {
      errors.push({
        code: 'PERIOD_GAP',
        message: `Period gap: expected ${expectedPeriod} after ${prev.period}, got ${curr.period}`,
        details: {
          expected: expectedPeriod,
          actual: curr.period,
          previous: prev.period,
        },
      });
    }
  }

  // Count entries and periods
  for (const rollup of chain.rollups) {
    entriesVerified += rollup.entryCount;
    periodsCovered.push(rollup.period);
  }

  return {
    ok: errors.length === 0,
    errors,
    entriesVerified,
    periodsCovered,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollup Query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find entries in a rollup chain by record ID.
 */
export function findEntriesInChain(chain: RollupChain, recordId: string): LedgerEntryRef[] {
  const results: LedgerEntryRef[] = [];

  for (const rollup of chain.rollups) {
    for (const entry of rollup.entries) {
      if (entry.recordId === recordId) {
        results.push(entry);
      }
    }
  }

  return results;
}

/**
 * Get rollup for a specific period.
 */
export function getRollupForPeriod(chain: RollupChain, period: string): LedgerRollup | null {
  return chain.rollups.find(r => r.period === period) ?? null;
}
