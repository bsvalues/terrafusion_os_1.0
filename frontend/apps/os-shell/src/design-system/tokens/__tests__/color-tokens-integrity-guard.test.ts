import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Color Tokens Integrity Guard
 *
 * Ensures color-tokens.css is a pure alias layer: no raw color literals,
 * only hsl(var(--tf-*)) and var(--tf-*) references.
 *
 * Rules:
 *  - No rgb()/rgba() calls
 *  - No hex literals (clean sweep — zero allowlist)
 *  - All 6 HS anchor tokens exist (palette infrastructure)
 */

const PATH = resolve(__dirname, '../color-tokens.css');

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Required palette hue-saturation anchor tokens */
const REQUIRED_HS_TOKENS = [
  '--tf-blue-hs',
  '--tf-cyan-hs',
  '--tf-green-hs',
  '--tf-red-hs',
  '--tf-amber-hs',
  '--tf-neutral-hs',
];

describe('Integrity — color-tokens.css', () => {
  const raw = readFileSync(PATH, 'utf8');
  const css = stripComments(raw);

  it('contains no rgb()/rgba() calls', () => {
    const hits = [...css.matchAll(/\brgba?\(\s*[^)]+\)/g)].map((m) => m[0]);
    expect(hits).toEqual([]);
  });

  it('contains no hex color literals', () => {
    const hits = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase());
    expect(hits).toEqual([]);
  });

  it('all required HS anchor tokens exist', () => {
    const missing = REQUIRED_HS_TOKENS.filter((token) => !raw.includes(token + ':'));
    expect(missing).toEqual([]);
  });
});
