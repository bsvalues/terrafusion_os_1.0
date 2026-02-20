import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering DashboardWidgets.css.
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../components/dashboard/DashboardWidgets.css',
);

const css = readFileSync(CSS_PATH, 'utf8');

const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
const ALLOW_TOKEN_RE =
  /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

describe('DashboardWidgets.css leak guard', () => {
  it('has no raw rgba/hsl calls outside hsl(var(--tf-*)) pattern', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = COLOR_FN_RE.exec(css)) !== null) {
      if (!ALLOW_TOKEN_RE.test(match[0])) {
        const line = css.substring(0, match.index).split('\n').length;
        violations.push(`L${line}: ${match[0]}`);
      }
    }
    // Allow up to 3 intentional inline HSL (indigo maintenance badge, no token)
    expect(violations.length).toBeLessThanOrEqual(3);
    for (const v of violations) {
      expect(v).toMatch(/hsl\(239/);
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
