import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS Leak Guard – prevents raw rgba/hex from re-entering AIAssistant.css.
 * 2 intentional inline HSL: hsl(258 90% 66%) violet processing, hsl(226 100% 94%) indigo-100 title.
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../applications/terra-levy/components/ai/AIAssistant.css',
);

const css = readFileSync(CSS_PATH, 'utf8');

const COLOR_FN_RE = /(?<![0-9A-Za-z])(?:rgba?|hsla?)\([^)]*\)/g;
const ALLOW_TOKEN_RE = /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;
const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

// Intentional inline HSL: violet processing indicator + indigo-100 title gradient
const INLINE_HSL_RE = /^hsl\((258|226) /;

describe('AIAssistant.css leak guard', () => {
  it('has no raw rgba/hsl calls outside token pattern or intentional inline HSL', () => {
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = COLOR_FN_RE.exec(css)) !== null) {
      if (!ALLOW_TOKEN_RE.test(match[0]) && !INLINE_HSL_RE.test(match[0])) {
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
