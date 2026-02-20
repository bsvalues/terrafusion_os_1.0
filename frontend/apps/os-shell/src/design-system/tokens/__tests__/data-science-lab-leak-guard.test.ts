import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Leak Guard: DataScienceLaboratory.css
 * Blocks regression of raw colors back into the tokenized file.
 *
 * Allowed survivors (WCAG / print only):
 *   - #000000, #ffffff  (prefers-contrast: high + @media print — WCAG)
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../applications/terra-levy/components/analytics/DataScienceLaboratory.css'
);

/** Hex values intentionally left as raw (WCAG / print only) */
const ALLOWED_HEX = new Set(['#000000', '#ffffff']);

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findAll(pattern: RegExp, text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(pattern)) hits.push(m[0]);
  return hits;
}

describe('Leak guard — DataScienceLaboratory.css', () => {
  const css = stripComments(readFileSync(CSS_PATH, 'utf8'));

  it('contains no unexpected raw rgba/hsl color functions', () => {
    const rgbHits = findAll(/\brgba?\(\s*[^)]+\)/g, css).filter(
      (h) => !/hsl\(\s*var\(--tf-/.test(h)
    );

    expect(rgbHits).toEqual([]);
  });

  it('contains no raw hex colors beyond allowed exceptions', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css).filter(
      (h) => !ALLOWED_HEX.has(h.toLowerCase())
    );

    expect(hexHits).toEqual([]);
  });
});
