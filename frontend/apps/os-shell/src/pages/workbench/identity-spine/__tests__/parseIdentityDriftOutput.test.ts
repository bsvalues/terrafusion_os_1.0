/**
 * WORKBENCH-V0.3 SLICE-L — parseIdentityDriftOutput unit tests.
 *
 * Validates:
 *   1.  All-PASS output → overall=PASS, sqlOverall stored correctly.
 *   2.  owner-link dangling (post-F2 no longer deferred) → overall=FAIL.
 *   3.  Non-deferred dangling → overall=FAIL (hard gate).
 *   4.  Multiple non-deferred dangling rows → overall=FAIL.
 *   5.  sqlOverall is stored independently of panel overall.
 *   6.  Rows are bucketed into correct IDENTITY_GROUPS.
 *   7.  Group verdict = worst-of effective verdicts in the group.
 *   8.  null_ref parsed correctly but does not affect verdict.
 *   9.  Unknown table (not in any group) → present in rows but not in any group.
 *   10. Empty input → overall=PASS (nothing to fail), rows=[], groups all PASS.
 *   11. Line with fewer than 6 pipe segments is silently ignored.
 *   12. Post-F2 Benton steady-state → PASS (owner link dangling=0).
 */

import { describe, it, expect } from 'vitest';
import {
  parseIdentityDriftOutput,
  KNOWN_DRIFT_DEFERRED,
  effectiveVerdictForRow,
  worstVerdict,
} from '../parseIdentityDriftOutput';

// ── Fixture helpers ────────────────────────────────────────────────────────────

function tableRow(
  laneTable: string,
  total: number,
  live: number,
  dangling: number,
  nullRef: number,
  verdict: 'PASS' | 'FAIL',
): string {
  return [laneTable, total, live, dangling, nullRef, verdict].join('|');
}

const PASS_ALL_STDOUT = [
  tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_improvement', 89247, 89247, 0, 0, 'PASS'),
  tableRow('gis_tf.tf_parcel_geom', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_tax_area', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_exemption', 5124, 5124, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_line', 1200000, 1200000, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_line', 313139, 313139, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_owner_link', 89247, 89247, 0, 0, 'PASS'),
  'OVERALL: PASS — no identity drift',
].join('\n');

// Post-F2 state (2026-06-09): owner_link debris deleted; dangling=0.
const POST_F2_BENTON_STEADY_STATE_STDOUT = [
  tableRow('canonical_tf.tf_land', 87767, 87767, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_improvement', 99694, 99694, 0, 0, 'PASS'),
  tableRow('gis_tf.tf_parcel_geom', 80075, 79105, 0, 970, 'PASS'),
  tableRow('canonical_tf.tf_assessment', 83326, 83326, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_tax_area', 83326, 83326, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_exemption', 5643, 5643, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_line', 990665, 990665, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_current', 79767, 79767, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_line', 0, 0, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_current', 0, 0, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_owner_link', 714553, 714553, 0, 0, 'PASS'),
  'OVERALL: PASS — no identity drift',
].join('\n');

// ── Primitive helpers ──────────────────────────────────────────────────────────

describe('effectiveVerdictForRow', () => {
  it('dangling=0 → PASS regardless of deferred', () => {
    expect(effectiveVerdictForRow(0, false)).toBe('PASS');
    expect(effectiveVerdictForRow(0, true)).toBe('PASS');
  });

  it('dangling>0, deferred=true → WARN', () => {
    expect(effectiveVerdictForRow(1, true)).toBe('WARN');
  });

  it('dangling>0, deferred=false → FAIL', () => {
    expect(effectiveVerdictForRow(1, false)).toBe('FAIL');
  });
});

describe('worstVerdict', () => {
  it('all PASS → PASS', () => expect(worstVerdict(['PASS', 'PASS'])).toBe('PASS'));
  it('has WARN but no FAIL → WARN', () => expect(worstVerdict(['PASS', 'WARN'])).toBe('WARN'));
  it('has FAIL → FAIL', () => expect(worstVerdict(['PASS', 'WARN', 'FAIL'])).toBe('FAIL'));
  it('empty array → PASS', () => expect(worstVerdict([])).toBe('PASS'));
});

// ── Parser ─────────────────────────────────────────────────────────────────────

describe('parseIdentityDriftOutput', () => {
  // ── 1. All-PASS ─────────────────────────────────────────────────────────────
  it('1. all-PASS output → overall=PASS, sqlOverall stored correctly', () => {
    const result = parseIdentityDriftOutput(PASS_ALL_STDOUT);
    expect(result.overall).toBe('PASS');
    expect(result.sqlOverall).toBe('OVERALL: PASS — no identity drift');
    expect(result.rows).toHaveLength(11);
    result.rows.forEach((r) => {
      expect(r.effectiveVerdict).toBe('PASS');
    });
  });

  // ── 2. Owner-link dangling → FAIL (post-F2: no longer a deferred lane) ────────
  it('2. owner-link dangling → overall=FAIL (not deferred after F2)', () => {
    const stdout = [
      tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
      tableRow('canonical_tf.tf_parcel_owner_link', 3200000, 3200000, 1397252, 0, 'FAIL'),
      'OVERALL: FAIL — identity drift detected',
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    expect(result.overall).toBe('FAIL');
    const ownerRow = result.rows.find((r) => r.laneTable === 'canonical_tf.tf_parcel_owner_link');
    expect(ownerRow?.effectiveVerdict).toBe('FAIL');
    expect(ownerRow?.isDeferred).toBe(false);
  });

  // ── 3. Non-deferred dangling → FAIL ─────────────────────────────────────────
  it('3. non-deferred dangling → overall=FAIL', () => {
    const stdout = [
      tableRow('canonical_tf.tf_land', 89247, 80000, 9247, 0, 'FAIL'),
      'OVERALL: FAIL — identity drift detected',
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    expect(result.overall).toBe('FAIL');
    const landRow = result.rows.find((r) => r.laneTable === 'canonical_tf.tf_land');
    expect(landRow?.effectiveVerdict).toBe('FAIL');
    expect(landRow?.isDeferred).toBe(false);
  });

  // ── 4. Multiple non-deferred dangling rows → FAIL ───────────────────────────
  it('4. multiple non-deferred dangling rows → overall=FAIL', () => {
    const stdout = [
      tableRow('canonical_tf.tf_land', 89247, 80000, 9247, 0, 'FAIL'),
      tableRow('canonical_tf.tf_parcel_owner_link', 714553, 700000, 14553, 0, 'FAIL'),
      'OVERALL: FAIL — identity drift detected',
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    expect(result.overall).toBe('FAIL');
  });

  // ── 5. sqlOverall stored independently of panel overall ─────────────────────
  it('5. sqlOverall stored; panel overall computed from effective verdicts independently', () => {
    // Both SQL and panel say PASS when all dangling=0.
    const result = parseIdentityDriftOutput(PASS_ALL_STDOUT);
    expect(result.sqlOverall).toBe('OVERALL: PASS — no identity drift');
    expect(result.overall).toBe('PASS');
    // SQL says FAIL; panel also FAIL (no deferred lanes to downgrade the verdict).
    const failStdout = [
      tableRow('canonical_tf.tf_land', 89247, 80000, 9247, 0, 'FAIL'),
      'OVERALL: FAIL — identity drift detected',
    ].join('\n');
    const failResult = parseIdentityDriftOutput(failStdout);
    expect(failResult.sqlOverall).toBe('OVERALL: FAIL — identity drift detected');
    expect(failResult.overall).toBe('FAIL');
  });

  // ── 6. Rows bucketed into correct groups ─────────────────────────────────────
  it('6. rows bucketed into correct IDENTITY_GROUPS', () => {
    const result = parseIdentityDriftOutput(PASS_ALL_STDOUT);
    const f1Group = result.groups.find((g) => g.label === 'F1 Family');
    expect(f1Group).toBeDefined();
    expect(f1Group!.tables).toContain('canonical_tf.tf_land');
    expect(f1Group!.tables).toContain('canonical_tf.tf_improvement');
    expect(f1Group!.tables).toContain('gis_tf.tf_parcel_geom');

    const ownerGroup = result.groups.find((g) => g.label === 'Owner Link');
    expect(ownerGroup).toBeDefined();
    expect(ownerGroup!.tables).toContain('canonical_tf.tf_parcel_owner_link');
  });

  // ── 7. Group verdict = worst-of rows ─────────────────────────────────────────
  it('7. group verdict = worst-of effective verdicts in the group', () => {
    const stdout = [
      // Owner Link group has dangling (post-F2: not deferred) → group=FAIL
      tableRow('canonical_tf.tf_parcel_owner_link', 714553, 700000, 14553, 0, 'FAIL'),
      // F1 Family all PASS → group=PASS
      tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
      tableRow('canonical_tf.tf_improvement', 89247, 89247, 0, 0, 'PASS'),
      tableRow('gis_tf.tf_parcel_geom', 89247, 89247, 0, 0, 'PASS'),
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    const f1 = result.groups.find((g) => g.label === 'F1 Family');
    const ownerLink = result.groups.find((g) => g.label === 'Owner Link');
    expect(f1?.verdict).toBe('PASS');
    expect(ownerLink?.verdict).toBe('FAIL');
  });

  // ── 8. null_ref parsed but does not affect verdict ───────────────────────────
  it('8. null_ref parsed correctly but does not affect verdict', () => {
    const stdout = [
      tableRow('canonical_tf.tf_land', 89247, 89247, 0, 42, 'PASS'),
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    const row = result.rows[0];
    expect(row.nullRef).toBe(42);
    expect(row.effectiveVerdict).toBe('PASS'); // null_ref never alarmed
    expect(result.overall).toBe('PASS');
  });

  // ── 9. Unknown table not in any group ────────────────────────────────────────
  it('9. unknown table present in rows but absent from all group.rows', () => {
    const stdout = [
      tableRow('canonical_tf.tf_unknown_future_table', 100, 100, 0, 0, 'PASS'),
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    expect(result.rows).toHaveLength(1);
    const allGroupRows = result.groups.flatMap((g) => g.rows);
    const unknownInGroup = allGroupRows.find(
      (r) => r.laneTable === 'canonical_tf.tf_unknown_future_table',
    );
    expect(unknownInGroup).toBeUndefined();
  });

  // ── 10. Empty input ──────────────────────────────────────────────────────────
  it('10. empty input → overall=PASS, rows=[], all groups have empty rows', () => {
    const result = parseIdentityDriftOutput('');
    expect(result.overall).toBe('PASS');
    expect(result.rows).toHaveLength(0);
    expect(result.sqlOverall).toBe('');
    result.groups.forEach((g) => {
      expect(g.rows).toHaveLength(0);
      expect(g.verdict).toBe('PASS');
    });
  });

  // ── 11. Malformed line silently ignored ──────────────────────────────────────
  it('11. line with fewer than 6 pipe segments is silently ignored', () => {
    const stdout = [
      'too|short|line',
      tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
    ].join('\n');
    const result = parseIdentityDriftOutput(stdout);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].laneTable).toBe('canonical_tf.tf_land');
  });

  // ── 12. Post-F2 Benton steady-state → PASS ──────────────────────────────────
  it('12. Post-F2 Benton steady-state → overall=PASS (owner link dangling=0)', () => {
    const result = parseIdentityDriftOutput(POST_F2_BENTON_STEADY_STATE_STDOUT);
    expect(result.overall).toBe('PASS');
    expect(result.sqlOverall).toBe('OVERALL: PASS — no identity drift');

    const ownerRow = result.rows.find((r) => r.laneTable === 'canonical_tf.tf_parcel_owner_link');
    expect(ownerRow?.dangling).toBe(0);
    expect(ownerRow?.effectiveVerdict).toBe('PASS');
    expect(ownerRow?.isDeferred).toBe(false);

    // All rows PASS.
    result.rows.forEach((r) => expect(r.effectiveVerdict).toBe('PASS'));

    // KNOWN_DRIFT_DEFERRED is empty after F2.
    expect(KNOWN_DRIFT_DEFERRED.has('canonical_tf.tf_parcel_owner_link')).toBe(false);
    expect(KNOWN_DRIFT_DEFERRED.size).toBe(0);
  });
});
