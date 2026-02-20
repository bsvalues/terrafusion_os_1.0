import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Leak guard — colors.ts
 *
 * Ensures colors.ts is a pure palette consumer:
 *  - No raw hex/rgb/rgba literals (except documented chart visualization colors)
 *  - hsl() only when based on tf HS anchors (var(--tf-*-hs))
 */

const PATH = resolve(__dirname, '../colors.ts');

/** Intentional chart visualization hex — no HS anchor equivalent */
const ALLOWED_HEX = new Set(['#8b5cf6', '#f97316', '#6366f1']);

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('Leak guard — colors.ts', () => {
  const raw = stripComments(readFileSync(PATH, 'utf8'));

  it('contains no raw hex/rgb/rgba literals beyond chart allowlist', () => {
    const hexHits = [...raw.matchAll(/#[0-9a-fA-F]{3,8}\b/g)]
      .map((m) => m[0].toLowerCase())
      .filter((h) => !ALLOWED_HEX.has(h));
    const rgbHits = [...raw.matchAll(/\brgba?\(\s*[^)]+\)/g)].map((m) => m[0]);

    const failures = [
      ...hexHits.map((h) => `HEX: ${h}`),
      ...rgbHits.map((r) => `RGB: ${r}`),
    ];

    expect(failures).toEqual([]);
  });

  it('only allows hsl() when based on tf HS anchors or bridge tokens', () => {
    const hslCalls = [...raw.matchAll(/\bhsl\(\s*[^)]+\)/g)].map((m) => m[0]);
    const bad = hslCalls.filter((s) => !s.includes('var(--tf-'));

    expect(bad).toEqual([]);
  });
});
