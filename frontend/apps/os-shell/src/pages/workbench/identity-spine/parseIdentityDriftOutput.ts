// WORKBENCH-V0.3 SLICE-L: Identity drift output parser.
//
// Ports the parseIdentityDrift() and idEffectiveVerdict() logic from
// tools/sync/workbench/panel/app.js into the OS Shell frontend.
//
// Key design rules:
//   • SQL OVERALL is stored as sqlOverall — raw display only. NOT used as panel verdict.
//   • Panel overall is computed from per-row effective verdicts (worst-of).
//   • Any non-deferred row with dangling > 0 → FAIL (hard gate).
//   • null_ref is never alarmed — shown grey, not contributing to verdict.
//
// Per docs/sync/workbench/SLICE_L_OS_SHELL_IDENTITY_SPINE_CONTRACT.md.

// ── Known deferred tables ─────────────────────────────────────────────────────
// Tables expected to have dangling FK refs in current Benton steady state.
// SQL verdict is FAIL when dangling > 0, but effective panel verdict is WARN.
// Do not add tables here without a formal deferred-lane decision.
// F2 (2026-06-09): tf_parcel_owner_link was removed after debris cleanup cleared
// all 1,397,252 dangling refs. The set is intentionally empty.
export const KNOWN_DRIFT_DEFERRED = new Set<string>();

// ── Types ─────────────────────────────────────────────────────────────────────

export type Verdict = 'PASS' | 'WARN' | 'FAIL';

export interface IdentityTableRow {
  laneTable: string;
  total: number;
  live: number;
  dangling: number;
  nullRef: number;
  sqlVerdict: 'PASS' | 'FAIL';
  effectiveVerdict: Verdict;
  isDeferred: boolean;
}

export interface IdentityGroup {
  label: string;
  tables: string[];
  rows: IdentityTableRow[];
  verdict: Verdict;
}

export interface ParsedIdentityOutput {
  rows: IdentityTableRow[];
  groups: IdentityGroup[];
  /** Raw OVERALL line from the SQL. NOT used as panel overall — for raw output display only. */
  sqlOverall: string;
  /** Computed from per-row effective verdicts. This is the authoritative panel verdict. */
  overall: Verdict;
}

// ── Display groups (canonical order) ─────────────────────────────────────────

// Mirrors IDENTITY_GROUPS in tools/sync/workbench/panel/app.js.
export const IDENTITY_GROUPS: ReadonlyArray<{ label: string; tables: ReadonlyArray<string> }> = [
  {
    label: 'F1 Family',
    tables: [
      'canonical_tf.tf_land',
      'canonical_tf.tf_improvement',
      'gis_tf.tf_parcel_geom',
    ],
  },
  {
    label: 'Valuation · Jurisdiction · Exemption',
    tables: [
      'canonical_tf.tf_assessment',
      'canonical_tf.tf_parcel_tax_area',
      'canonical_tf.tf_exemption',
    ],
  },
  {
    label: 'Revenue',
    tables: [
      'canonical_tf.tf_tax_bill_line',
      'canonical_tf.tf_tax_bill_current',
      'canonical_tf.tf_assessment_bill_line',
      'canonical_tf.tf_assessment_bill_current',
    ],
  },
  {
    label: 'Owner Link',
    tables: ['canonical_tf.tf_parcel_owner_link'],
  },
] as const;

// ── Verdict helpers ───────────────────────────────────────────────────────────

/** Effective verdict for a single table row, applying deferred-lane override. */
export function effectiveVerdictForRow(dangling: number, isDeferred: boolean): Verdict {
  if (dangling === 0) return 'PASS';
  if (isDeferred) return 'WARN';
  return 'FAIL';
}

/** Worst-of verdict across a list of verdicts. */
export function worstVerdict(verdicts: Verdict[]): Verdict {
  if (verdicts.includes('FAIL')) return 'FAIL';
  if (verdicts.includes('WARN')) return 'WARN';
  return 'PASS';
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse raw stdout from identity-runner.mjs / identity-drift-detector.sql.
 *
 * Statement 1 — per-table rows (6 pipe-delimited columns):
 *   lane_table|total|live|dangling|null_ref|verdict
 *
 * Statement 2 — overall (single line, no pipe):
 *   OVERALL: PASS — no identity drift
 *   OVERALL: FAIL — identity drift detected
 *
 * The SQL OVERALL reflects any dangling > 0 regardless of deferred status.
 * This function computes the authoritative panel overall from per-row effective verdicts.
 */
export function parseIdentityDriftOutput(raw: string): ParsedIdentityOutput {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const tableRows: IdentityTableRow[] = [];
  let sqlOverall = '';

  for (const line of lines) {
    if (line.startsWith('OVERALL:')) {
      sqlOverall = line;
      continue;
    }

    const parts = line.split('|');
    if (parts.length < 6) continue;

    const laneTable = parts[0].trim();
    const total = parseInt(parts[1], 10) || 0;
    const live = parseInt(parts[2], 10) || 0;
    const dangling = parseInt(parts[3], 10) || 0;
    const nullRef = parseInt(parts[4], 10) || 0;
    const sqlVerdict = parts[5].trim() === 'FAIL' ? 'FAIL' : 'PASS';
    const isDeferred = KNOWN_DRIFT_DEFERRED.has(laneTable);
    const effectiveVerdict = effectiveVerdictForRow(dangling, isDeferred);

    tableRows.push({
      laneTable,
      total,
      live,
      dangling,
      nullRef,
      sqlVerdict,
      effectiveVerdict,
      isDeferred,
    });
  }

  // Build groups with matched rows and worst-of group verdict.
  const rowByTable = new Map(tableRows.map((r) => [r.laneTable, r]));
  const groups: IdentityGroup[] = IDENTITY_GROUPS.map(({ label, tables }) => {
    const rows = (tables as string[])
      .map((t) => rowByTable.get(t))
      .filter((r): r is IdentityTableRow => r !== undefined);
    const verdict = worstVerdict(rows.map((r) => r.effectiveVerdict));
    return { label, tables: tables as string[], rows, verdict };
  });

  // Authoritative panel overall = worst-of all row effective verdicts.
  const overall = worstVerdict(tableRows.map((r) => r.effectiveVerdict));

  return { rows: tableRows, groups, sqlOverall, overall };
}
