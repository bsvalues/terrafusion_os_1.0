/**
 * Tests for the shared raw-color leak guard utility.
 *
 * Validates detection of hex, rgb/rgba, and raw numeric hsl/hsla,
 * while allowing tokenised hsl(var(--tf-*) / ...) patterns.
 */

import { findRawColorLeaks, assertNoRawColorLeaks } from '../leak-guard';

describe('findRawColorLeaks', () => {
  it('flags hex values (#rgb, #rrggbb, #rrggbbaa)', () => {
    const input = [
      '.a { color: #fff; }',
      '.b { background: #1a1a1a; }',
      '.c { border: 1px solid #aabbccdd; }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks.length).toBe(3);
    expect(leaks.every((l) => l.kind === 'hex')).toBe(true);
  });

  it('flags rgb() and rgba() calls', () => {
    const input = [
      '.a { border: 1px solid rgba(0, 0, 0, 0.4); }',
      '.b { box-shadow: 0 0 0 1px rgb(12, 34, 56); }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks.length).toBe(2);
    expect(leaks.every((l) => l.kind === 'rgb')).toBe(true);
  });

  it('flags raw numeric hsl() and hsla()', () => {
    const input = [
      '.bad { color: hsl(210 50% 40%); }',
      '.bad2 { color: hsla(210, 50%, 40%, 0.5); }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks.length).toBe(2);
    expect(leaks.every((l) => l.kind === 'hsl_raw')).toBe(true);
  });

  it('allows tokenised hsl(var(--tf-*) / alpha)', () => {
    const input = [
      '.ok { color: hsl(var(--tf-accent) / 0.5); }',
      '.ok2 { background: hsl(var(--tf-bg) / 1); }',
      '.ok3 { border: 1px solid hsl(var(--tf-error) / 0.3); }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks).toEqual([]);
  });

  it('allows var(--tf-*) direct references', () => {
    const input = '.ok { color: var(--tf-text); }';
    const leaks = findRawColorLeaks(input);
    expect(leaks).toEqual([]);
  });

  it('skips lines with tf-allow-raw-color escape hatch', () => {
    const input = [
      '// tf-allow-raw-color: THREE.js needs named colours',
      "const color = '#00ffff';",
      "const other = '#ff0000'; // no escape hatch here",
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    // Line 1 skipped (escape hatch covers it), line 2 skipped (escape hatch on prev line? No, each line evaluated independently)
    // Actually line 2 has the hex and no escape hatch → flagged
    // Line 3 also flagged
    expect(leaks.length).toBe(2);
    expect(leaks[0].line).toBe(2);
    expect(leaks[1].line).toBe(3);
  });

  it('does not flag SVG url(#id) references', () => {
    const input = [
      '.icon { fill: url(#gradient-1); }',
      '.mask { mask-image: url(#clip); }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks).toEqual([]);
  });

  it('reports correct line and column numbers', () => {
    const input = [
      '/* line 1 */',
      '/* line 2 */ .x { color: #abc; }',
    ].join('\n');
    const leaks = findRawColorLeaks(input);
    expect(leaks.length).toBe(1);
    expect(leaks[0].line).toBe(2);
    expect(leaks[0].column).toBeGreaterThan(20);
  });

  it('handles mixed violations on a single line', () => {
    const input =
      '.x { background: rgba(0,0,0,0.5); color: #fff; border: hsl(210 50% 40%); }';
    const leaks = findRawColorLeaks(input);
    const kinds = leaks.map((l) => l.kind).sort();
    expect(kinds).toEqual(['hex', 'hsl_raw', 'rgb']);
  });
});

describe('assertNoRawColorLeaks', () => {
  it('does not throw for clean content', () => {
    const clean = '.ok { color: hsl(var(--tf-text) / 1); }';
    expect(() => assertNoRawColorLeaks(clean)).not.toThrow();
  });

  it('throws with label in error message', () => {
    const dirty = '.x { color: #abc; }';
    expect(() =>
      assertNoRawColorLeaks(dirty, { label: 'test-file.css' }),
    ).toThrow(/test-file\.css/);
  });

  it('throws with leak details', () => {
    const dirty = '.x { color: rgba(255, 0, 0, 1); }';
    expect(() => assertNoRawColorLeaks(dirty)).toThrow(/\[rgb\]/);
  });
});
