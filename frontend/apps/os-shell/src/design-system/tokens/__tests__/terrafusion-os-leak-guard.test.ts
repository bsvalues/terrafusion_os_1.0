import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering terrafusion-os.css.
 * 13 intentional RAW_HEX in .high-contrast section: absolute black/white
 * for WCAG 2.1 AA compliance — must NOT be tokenized to themed vars.
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../styles/terrafusion-os.css'
);

const css = readFileSync(CSS_PATH, 'utf8');

const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
const ALLOW_TOKEN_RE = /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

// High-contrast section uses absolute black/white hex for WCAG AA
const HIGH_CONTRAST_START = css.indexOf('.high-contrast');

describe('terrafusion-os.css leak guard', () => {
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

  it('has no raw hex color values outside high-contrast section', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = RAW_HEX_RE.exec(css)) !== null) {
      // Allow hex values in the high-contrast WCAG section
      if (match.index >= HIGH_CONTRAST_START) continue;
      const line = css.substring(0, match.index).split('\n').length;
      violations.push(`L${line}: ${match[0]}`);
    }
    expect(violations).toEqual([]);
  });

  it('high-contrast section only uses absolute black and white hex', () => {
    const hcSection = css.substring(HIGH_CONTRAST_START);
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    const hcHexRe = /#[0-9a-fA-F]{3,8}\b/g;
    while ((match = hcHexRe.exec(hcSection)) !== null) {
      const hex = match[0].toLowerCase();
      if (hex !== '#000000' && hex !== '#ffffff') {
        const line = hcSection.substring(0, match.index).split('\n').length;
        violations.push(`L${line}: ${match[0]} (only #000000/#ffffff allowed)`);
      }
    }
    expect(violations).toEqual([]);
  });
});
