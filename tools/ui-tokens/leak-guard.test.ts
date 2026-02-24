import { describe, it, expect } from 'vitest';
import { findRawColorLeaks, assertNoRawColorLeaks } from './leak-guard';

describe('ui token leak-guard', () => {
  it('flags hex and rgb/rgba', () => {
    const input = `
      .a { color: #fff; }
      .b { background: #1a1a1a; }
      .c { border-color: rgba(0,0,0,0.4); }
      .d { box-shadow: 0 0 0 1px rgb(12 34 56); }
    `;
    const leaks = findRawColorLeaks(input, { label: 'sample.css' });
    expect(leaks.map((l) => l.kind)).toContain('hex');
    expect(leaks.map((l) => l.kind)).toContain('rgb');
  });

  it('flags raw numeric hsl() but allows tokenized hsl(var(--tf-…))', () => {
    const input = `
      .ok1 { color: var(--tf-text); }
      .ok2 { background: hsl(var(--tf-neutral-hs) / 10%); }
      .ok3 { background: hsl(var(--tf-green-hs) / 50% / 0.1); }
      .bad1 { color: hsl(210 50% 40%); }
      .bad2 { color: hsla(210, 50%, 40%, 0.5); }
    `;
    const leaks = findRawColorLeaks(input);
    expect(leaks.some((l) => l.kind === 'hsl_raw')).toBe(true);
    expect(leaks.some((l) => l.match.includes('var(--tf-'))).toBe(false);
  });

  it('supports ignoreLinePatterns for documented exceptions', () => {
    const input = `
      /* tf-allow-raw-color: vendor svg filter id */
      .icon { filter: url(#dropShadow); }
      .bad { color: #ff00ff; }
    `;
    const leaks = findRawColorLeaks(input, {
      ignoreLinePatterns: [/tf-allow-raw-color/i],
    });
    expect(leaks.some((l) => l.kind === 'hex')).toBe(true);
  });

  it('assertNoRawColorLeaks throws a readable error', () => {
    const input = '.x { color: #abc; }';
    expect(() => assertNoRawColorLeaks(input, { label: 'x.css' })).toThrow(
      /Raw color leaks detected.*x\.css/s,
    );
  });

  it('does not false-positive on currentColor and token vars', () => {
    const input = `
      .a { color: currentColor; }
      .b { color: var(--tf-accent); }
      .c { background: hsl(var(--tf-cyan-hs) / 50%); }
    `;
    expect(() => assertNoRawColorLeaks(input)).not.toThrow();
  });

  it('skips SVG url(#id) references', () => {
    const input = `
      .icon { filter: url(#dropShadow); }
      .mask { clip-path: url(#mask1); }
    `;
    expect(() => assertNoRawColorLeaks(input)).not.toThrow();
  });

  it('ignoreFilePatterns short-circuits on matching label', () => {
    const input = '.x { color: #abc; }';
    const leaks = findRawColorLeaks(input, {
      label: 'vendor/external.css',
      ignoreFilePatterns: [/vendor\//],
    });
    expect(leaks).toEqual([]);
  });

  it('reports correct line and column numbers', () => {
    const input = 'line1\n  .a { color: #f00; }';
    const leaks = findRawColorLeaks(input);
    expect(leaks).toHaveLength(1);
    expect(leaks[0].line).toBe(2);
    expect(leaks[0].column).toBe(15);
    expect(leaks[0].kind).toBe('hex');
  });
});
