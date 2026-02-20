import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering NotificationSystem.css.
 * Phase 9: 62 → 0 violations (clean sweep, no exceptions).
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../components/notifications/NotificationSystem.css'
);

const css = readFileSync(CSS_PATH, 'utf8');

const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
const ALLOW_TOKEN_RE = /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('NotificationSystem.css leak guard', () => {
  it('has no raw rgba/hsl calls outside token pattern', () => {
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
    const clean = stripComments(css);
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = RAW_HEX_RE.exec(clean)) !== null) {
      const line = clean.substring(0, match.index).split('\n').length;
      violations.push(`L${line}: ${match[0]}`);
    }
    expect(violations).toEqual([]);
  });
});
