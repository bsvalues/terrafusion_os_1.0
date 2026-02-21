import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Leak Guard: terrafusion-brand.css
 * Blocks regression of raw hex/rgba colors back into the tokenized file.
 *
 * This file should contain ZERO raw hex or rgba — all colors use
 * hsl(var(--tf-*)) tokens.
 */

const CSS_PATH = resolve(__dirname, '../../../assets/terrafusion-brand.css');

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripUrls(input: string): string {
  return input.replace(/\burl\(\s*(['"]?)[\s\S]*?\1\s*\)/g, 'url(…)');
}

function findAll(pattern: RegExp, text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(pattern)) hits.push(m[0]);
  return hits;
}

describe('Leak guard — terrafusion-brand.css', () => {
  const css = stripUrls(stripComments(readFileSync(CSS_PATH, 'utf8')));

  it('contains no raw rgba/rgb/hex color literals', () => {
    const rgbHits = findAll(/\brgba?\(\s*[^)]+\)/g, css);
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css);

    expect([...rgbHits, ...hexHits]).toEqual([]);
  });

  it('every hsl() call is token-based (var(--tf-*))', () => {
    const allHsl = findAll(/\bhsla?\([^)]+\)/g, css);
    const nonToken = allHsl.filter((h) => !h.includes('var(--tf-'));

    expect(nonToken).toEqual([]);
  });
});
