import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering App.css.
 *
 * The TDC scanner catches violations at audit time, but this test runs
 * in the Jest unit-test pass so regressions are caught immediately during
 * local development and CI, before the full TDC audit.
 */

const APP_CSS_PATH = resolve(__dirname, '../../../App.css');

const css = readFileSync(APP_CSS_PATH, 'utf8');

// Matches rgba(...), rgb(...), hsla(...), hsl(...) NOT preceded by [A-Za-z0-9]
const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
// Token-safe pattern: hsl(var(--tf-*) ...) or var(--tf-*)
const ALLOW_TOKEN_RE = /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
// Raw hex: #abc, #aabbcc, #aabbccdd
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

describe('App.css leak guard', () => {
  it('has no raw rgba/hsl calls outside hsl(var(--tf-*)) pattern', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = COLOR_FN_RE.exec(css)) !== null) {
      if (!ALLOW_TOKEN_RE.test(match[0])) {
        const line = css.substring(0, match.index).split('\n').length;
        violations.push(`L${line}: ${match[0]}`);
      }
    }
    // Allow up to 1 intentional inline HSL (purple gradient, no token)
    expect(violations.length).toBeLessThanOrEqual(1);
    if (violations.length === 1) {
      expect(violations[0]).toMatch(/hsl\(270/);
    }
  });

  it('has no raw hex color values', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = RAW_HEX_RE.exec(css)) !== null) {
      const line = css.substring(0, match.index).split('\n').length;
      violations.push(`L${line}: ${match[0]}`);
    }
    expect(violations).toEqual([]);
  });
});
