/**
 * WORKBENCH-V0.3 SLICE-J — parseDoctorOutput unit tests.
 *
 * Validates:
 *   1.  Empty string → no steps, overall null.
 *   2.  PASS stdout → overall=PASS, steps[0].verdict=PASS.
 *   3.  WARN stdout → overall=WARN, steps[0].verdict=WARN.
 *   4.  FAIL stdout → overall=FAIL, steps[0].verdict=FAIL.
 *   5.  Step verdict = worst-of: PASS + WARN line → WARN.
 *   6.  Step verdict = worst-of: WARN + FAIL line → FAIL.
 *   7.  DB info line is extracted.
 *   8.  Multi-step stdout: 4 steps parsed correctly.
 *   9.  overMsgs contains supporting message text.
 *  10.  Unknown symbol lines produce sym=null but are captured as text.
 *  11.  "error" keyword in line → FAIL sym.
 *  12.  Step with no symbol lines → verdict=null.
 */

import { parseDoctorOutput } from '../parseDoctorOutput';

// ── Fixtures ───────────────────────────────────────────────────────────────────

function wrap(body: string, overall: string) {
  // Do NOT trim body — leading spaces on step header lines are required by
  // the step-header regex /^\s+#(\d)\s+(.+?)\s*\.{3}/.
  return [
    '══════════════════════════════════════════════',
    '  tf-sync doctor',
    '══════════════════════════════════════════════',
    body,
    '══════════════════════════════════════════════',
    overall,
    '══════════════════════════════════════════════',
  ].join('\n');
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('parseDoctorOutput', () => {
  // ── 1 ─────────────────────────────────────────────────────────────────────

  it('empty string returns empty result', () => {
    const r = parseDoctorOutput('');
    expect(r.steps).toHaveLength(0);
    expect(r.overall).toBeNull();
    expect(r.dbInfo).toBeNull();
    expect(r.overMsgs).toHaveLength(0);
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────

  it('PASS stdout → overall=PASS, step verdict=PASS', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n✓  All checks passed',
      '✓ OVERALL: PASS — substrate clean',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.overall).toBe('PASS');
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0].verdict).toBe('PASS');
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────

  it('WARN stdout → overall=WARN, step verdict=WARN', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n⚠  1 deferred boundary',
      '⚠ OVERALL: WARN — known deferred items',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.overall).toBe('WARN');
    expect(r.steps[0].verdict).toBe('WARN');
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────

  it('FAIL stdout → overall=FAIL, step verdict=FAIL', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n✗  pack mismatch',
      '✗ OVERALL: FAIL — do not drain',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.overall).toBe('FAIL');
    expect(r.steps[0].verdict).toBe('FAIL');
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────

  it('PASS + WARN lines in a step → step verdict=WARN', () => {
    const stdout = wrap(
      '    #1  Identity Drift...\n✓  clean table\n⚠  known deferred link',
      '⚠ OVERALL: WARN',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.steps[0].verdict).toBe('WARN');
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────

  it('WARN + FAIL lines in a step → step verdict=FAIL', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n⚠  deferred item\n✗  structural break',
      '✗ OVERALL: FAIL',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.steps[0].verdict).toBe('FAIL');
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────

  it('extracts DB info line', () => {
    const stdout = wrap(
      'DB: 127.0.0.1:5432/terrafusion\n    #0  Pack Validator...\n✓  ok',
      '✓ OVERALL: PASS',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.dbInfo).toBe('127.0.0.1:5432/terrafusion');
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────

  it('parses 4 steps correctly', () => {
    const body = [
      '    #0  Pack Validator...',
      '✓  pass',
      '    #1  Identity Drift...',
      '✓  clean',
      '    #2  Seal Check...',
      '✓  22/22',
      '    #3  Domain Coverage...',
      '✓  12 sealed',
    ].join('\n');
    const stdout = wrap(body, '✓ OVERALL: PASS');
    const r = parseDoctorOutput(stdout);
    expect(r.steps).toHaveLength(4);
    expect(r.steps.map(s => s.idx)).toEqual([0, 1, 2, 3]);
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────

  it('overMsgs contains supporting message text', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n✓  pass',
      '✓ OVERALL: PASS — substrate clean\nSome additional info here',
    );
    const r = parseDoctorOutput(stdout);
    expect(r.overMsgs.some(m => m.includes('additional'))).toBe(true);
  });

  // ── 10 ────────────────────────────────────────────────────────────────────

  it('lines with no symbol have sym=null but are still captured as text', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n  plain info line without symbol',
      '✓ OVERALL: PASS',
    );
    const r = parseDoctorOutput(stdout);
    const nullSymLines = r.steps[0].details.filter(d => d.sym === null);
    expect(nullSymLines.length).toBeGreaterThan(0);
    expect(nullSymLines[0].text).toContain('plain info line');
  });

  // ── 11 ────────────────────────────────────────────────────────────────────

  it('"error" keyword in a detail line → sym=FAIL', () => {
    const stdout = wrap(
      '    #0  Pack Validator...\n  connection error occurred',
      '✗ OVERALL: FAIL',
    );
    const r = parseDoctorOutput(stdout);
    const failLines = r.steps[0].details.filter(d => d.sym === 'FAIL');
    expect(failLines.length).toBeGreaterThan(0);
  });

  // ── 12 ────────────────────────────────────────────────────────────────────

  it('step with no symbol lines → verdict=null', () => {
    const stdout = wrap(
      '    #3  Domain Coverage...\n  12 domains found',
      '✓ OVERALL: PASS',
    );
    const r = parseDoctorOutput(stdout);
    // "12 domains found" has no symbol → verdict stays null
    expect(r.steps[0].verdict).toBeNull();
  });
});
