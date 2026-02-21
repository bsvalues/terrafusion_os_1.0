import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Leak Guard: shadows.ts
 * Blocks regression of raw hex/rgba colors back into the shadow tokens file.
 *
 * This file should contain ZERO raw hex or rgba — all shadow colors use
 * hsl(var(--tf-*)) tokens.
 */

const TS_PATH = resolve(__dirname, '../shadows.ts');

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function findAll(pattern: RegExp, text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(pattern)) hits.push(m[0]);
  return hits;
}

describe('Leak guard — shadows.ts', () => {
  const src = stripComments(readFileSync(TS_PATH, 'utf8'));

  it('contains no raw rgba/rgb color functions', () => {
    const rgbHits = findAll(/\brgba?\(\s*[^)]+\)/g, src);

    expect(rgbHits).toEqual([]);
  });

  it('contains no raw hex colors', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, src);

    expect(hexHits).toEqual([]);
  });
});
