import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * globals.css leak guard
 *
 * Prevents raw color regressions in the global stylesheet.
 * All color values must use hsl(var(--tf-*)) bridge tokens.
 */

const CSS_PATH = resolve(__dirname, '../../../globals.css');

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('globals.css leak guard', () => {
  const raw = readFileSync(CSS_PATH, 'utf8');
  const css = stripComments(raw);

  it('has no raw rgba/hsl calls outside hsl(var(--tf-*)) pattern', () => {
    const colorFns = [...css.matchAll(/\b(?:rgba?|hsla?)\(\s*[^)]+\)/g)]
      .map((m) => m[0])
      .filter((fn) => !/hsla?\(\s*var\(--tf-/.test(fn));

    expect(colorFns).toEqual([]);
  });

  it('has no raw hex color values', () => {
    const hexHits = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);

    expect(hexHits).toEqual([]);
  });
});
