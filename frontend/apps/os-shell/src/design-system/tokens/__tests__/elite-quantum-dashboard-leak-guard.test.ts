import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CSS_PATH = resolve(__dirname, '../../../styles/elite-quantum-dashboard.css');

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findAll(pattern: RegExp, text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(pattern)) hits.push(m[0]);
  return hits;
}

describe('Leak guard — elite-quantum-dashboard.css', () => {
  const css = stripComments(readFileSync(CSS_PATH, 'utf8'));

  it('contains no raw rgba/rgb color functions', () => {
    const rgbHits = findAll(/\brgba?\(\s*[^)]+\)/g, css);

    expect(rgbHits).toEqual([]);
  });

  it('contains no raw hex colors', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css);

    expect(hexHits).toEqual([]);
  });
});
