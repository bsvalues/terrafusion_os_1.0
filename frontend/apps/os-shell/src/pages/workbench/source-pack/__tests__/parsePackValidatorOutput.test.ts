/**
 * WORKBENCH-V0.3 SLICE-K — parsePackValidatorOutput unit tests.
 *
 * Validates:
 *   1.  Empty string - no checks, no sections, overall null.
 *   2.  PASS stdout - overall=PASS.
 *   3.  WARN stdout - overall=WARN.
 *   4.  FAIL stdout - overall=FAIL.
 *   5.  Section grouping - checks grouped by category in canonical order.
 *   6.  Per-section counts - failCount/warnCount/passCount/infoCount correct.
 *   7.  Section worst-of verdict - FAIL > WARN > PASS.
 *   8.  INFO excluded from section verdict.
 *   9.  Notes with pipe - notes field joins remaining pipe-separated parts.
 *  10.  Summary line absent - derive overall from per-check rows.
 *  11.  Unknown category still collected.
 *  12.  Canonical section order preserved.
 */

import { parsePackValidatorOutput } from '../parsePackValidatorOutput';

// Helper: build a pipe-delimited check row
function row(
  category: string,
  checkName: string,
  measured: string,
  expected: string,
  verdict: string,
  severity = 'INFO',
  notes = '',
): string {
  return [category, checkName, measured, expected, verdict, severity, notes].join('|');
}

// Helper: build the OVERALL summary line
function overallLine(v: string, fail = 0, warn = 0, pass = 0, info = 0): string {
  return `OVERALL: ${v}|fail=${fail}|warn=${warn}|pass=${pass}|info=${info}`;
}

describe('parsePackValidatorOutput', () => {
  it('empty string returns no checks, no sections, overall null', () => {
    const r = parsePackValidatorOutput('');
    expect(r.checks).toHaveLength(0);
    expect(r.sections).toHaveLength(0);
    expect(r.overall).toBeNull();
    expect(r.failCount).toBe(0);
    expect(r.warnCount).toBe(0);
    expect(r.passCount).toBe(0);
    expect(r.infoCount).toBe(0);
  });

  it('PASS stdout produces overall=PASS', () => {
    const stdout = [
      row('table_presence', 'parcel_base_exists', 'YES', 'YES', 'PASS', 'CRITICAL'),
      overallLine('PASS', 0, 0, 1, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.overall).toBe('PASS');
    expect(r.failCount).toBe(0);
    expect(r.passCount).toBe(1);
  });

  it('WARN stdout produces overall=WARN', () => {
    const stdout = [
      row('table_presence', 'some_check', 'present', 'present', 'PASS', 'CRITICAL'),
      row('data_content', 'row_count_check', '4500', '>0', 'WARN', 'WARN', 'deferred item'),
      overallLine('WARN', 0, 1, 1, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.overall).toBe('WARN');
    expect(r.warnCount).toBe(1);
  });

  it('FAIL stdout produces overall=FAIL', () => {
    const stdout = [
      row('table_presence', 'parcel_base_exists', 'NO', 'YES', 'FAIL', 'CRITICAL', 'table missing'),
      overallLine('FAIL', 1, 0, 0, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.overall).toBe('FAIL');
    expect(r.failCount).toBe(1);
  });

  it('groups checks into 4 canonical sections', () => {
    const stdout = [
      row('table_presence', 'tbl_chk_1', '1', '1', 'PASS', 'CRITICAL'),
      row('column_structure', 'col_chk_1', '1', '1', 'PASS', 'CRITICAL'),
      row('dictionary', 'dict_chk_1', '1', '1', 'PASS', 'INFO'),
      row('data_content', 'data_chk_1', '100', '>0', 'PASS', 'INFO'),
      overallLine('PASS', 0, 0, 4, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.sections).toHaveLength(4);
    expect(r.sections.map(s => s.category)).toEqual([
      'table_presence',
      'column_structure',
      'dictionary',
      'data_content',
    ]);
    for (const s of r.sections) {
      expect(s.checks).toHaveLength(1);
    }
  });

  it('per-section counts are correct', () => {
    const stdout = [
      row('table_presence', 'chk_pass', '1', '1', 'PASS', 'CRITICAL'),
      row('table_presence', 'chk_warn', '0', '1', 'WARN', 'WARN'),
      row('table_presence', 'chk_fail', '0', '1', 'FAIL', 'CRITICAL'),
      row('table_presence', 'chk_info', '4', '>0', 'INFO', 'INFO'),
      overallLine('FAIL', 1, 1, 1, 1),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    const sec = r.sections.find(s => s.category === 'table_presence');
    expect(sec).toBeDefined();
    expect(sec!.passCount).toBe(1);
    expect(sec!.warnCount).toBe(1);
    expect(sec!.failCount).toBe(1);
    expect(sec!.infoCount).toBe(1);
  });

  it('section verdict: PASS + FAIL produces FAIL', () => {
    const stdout = [
      row('table_presence', 'chk_pass', '1', '1', 'PASS', 'CRITICAL'),
      row('table_presence', 'chk_fail', '0', '1', 'FAIL', 'CRITICAL'),
      overallLine('FAIL', 1, 0, 1, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    const sec = r.sections.find(s => s.category === 'table_presence');
    expect(sec!.verdict).toBe('FAIL');
  });

  it('section verdict: PASS + WARN produces WARN', () => {
    const stdout = [
      row('column_structure', 'col_pass', 'ok', 'ok', 'PASS', 'CRITICAL'),
      row('column_structure', 'col_warn', 'null', 'not_null', 'WARN', 'WARN'),
      overallLine('WARN', 0, 1, 1, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    const sec = r.sections.find(s => s.category === 'column_structure');
    expect(sec!.verdict).toBe('WARN');
  });

  it('INFO excluded from section verdict: PASS + INFO produces PASS', () => {
    const stdout = [
      row('dictionary', 'dict_info_1', '42', '>0', 'INFO', 'INFO', 'optional check'),
      row('dictionary', 'dict_pass_1', '1', '1', 'PASS', 'INFO'),
      overallLine('PASS', 0, 0, 1, 1),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    const sec = r.sections.find(s => s.category === 'dictionary');
    expect(sec!.verdict).toBe('PASS');
    expect(sec!.infoCount).toBe(1);
    expect(sec!.passCount).toBe(1);
  });

  it('notes containing pipe chars are joined correctly', () => {
    const line = 'table_presence|col_pipe|present|present|PASS|INFO|see issue|TF-123|action required';
    const r = parsePackValidatorOutput(line + '\n' + overallLine('PASS', 0, 0, 1, 0));
    const check = r.checks[0];
    expect(check).toBeDefined();
    expect(check.notes).toBe('see issue|TF-123|action required');
  });

  it('missing summary line derives overall from per-check rows', () => {
    const stdout = [
      row('table_presence', 'chk_pass', '1', '1', 'PASS', 'CRITICAL'),
      row('table_presence', 'chk_warn', '0', '1', 'WARN', 'WARN'),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.overall).toBe('WARN');
    expect(r.failCount).toBe(0);
    expect(r.warnCount).toBe(1);
    expect(r.passCount).toBe(1);
  });

  it('unknown category check is collected in checks array', () => {
    const stdout = [
      row('unknown_future_section', 'future_chk', '1', '1', 'PASS', 'INFO'),
      overallLine('PASS', 0, 0, 1, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.checks).toHaveLength(1);
    expect(r.checks[0].category).toBe('unknown_future_section');
  });

  it('canonical section order preserved even when input is reversed', () => {
    const stdout = [
      row('data_content', 'dc_chk', '100', '>0', 'PASS', 'INFO'),
      row('dictionary', 'dict_chk', '3', '>0', 'PASS', 'INFO'),
      row('column_structure', 'col_chk', 'present', 'present', 'PASS', 'CRITICAL'),
      row('table_presence', 'tbl_chk', 'YES', 'YES', 'PASS', 'CRITICAL'),
      overallLine('PASS', 0, 0, 4, 0),
    ].join('\n');
    const r = parsePackValidatorOutput(stdout);
    expect(r.sections.map(s => s.category)).toEqual([
      'table_presence',
      'column_structure',
      'dictionary',
      'data_content',
    ]);
  });
});
