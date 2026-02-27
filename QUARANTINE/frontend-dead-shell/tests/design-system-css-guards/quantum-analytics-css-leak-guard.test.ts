import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering
 * quantum-analytics.css.
 *
 * Two invariants:
 *   1. Zero raw rgba/rgb/hsl/hsla calls outside hsl(var(--tf-*)) pattern.
 *   2. Zero raw hex color values (#abc, #aabbcc, #aabbccdd).
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../styles/quantum-analytics.css',
);

const css = readFileSync(CSS_PATH, 'utf8');

// Matches rgba(...), rgb(...), hsla(...), hsl(...) NOT preceded by [A-Za-z0-9]
const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
// Token-safe pattern: hsl(var(--tf-*) ...) or var(--tf-*)
const ALLOW_TOKEN_RE =
  /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
// Raw hex: #abc, #aabbcc, #aabbccdd
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

describe('quantum-analytics.css leak guard', () => {
  it('has no raw rgba/hsl calls outside hsl(var(--tf-*)) pattern', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = COLOR_FN_RE.exec(css)) !== null) {
      if (!ALLOW_TOKEN_RE.test(match[0])) {
        const line = css.substring(0, match.index).split('\n').length;
        violations.push(`L${line}: ${match[0]}`);
      }
    }
    expect(violations).toEqual([]);
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
