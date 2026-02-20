import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Token Integrity Guard
 *
 * Protects the token factory from regressions:
 *  1. No raw rgba/rgb in token files (all should use hsl(var(--tf-*)/alpha))
 *  2. No unexpected raw hex beyond documented irreducible definitions
 *  3. Required LUMIN BRIDGE tokens exist (prevents accidental deletion/rename)
 */

const TOKEN_PATH = resolve(__dirname, '../../../styles/terrafusion-tokens.css');

/** Irreducible hex definitions: tokens that ARE the source values (no bridge equivalent) */
const ALLOWED_HEX = new Set<string>([
  // Phase 14: LUMIN BRIDGE complete — zero irreducible hex remain
]);

/** LUMIN BRIDGE tokens that must always exist */
const REQUIRED_BRIDGE_TOKENS = [
  '--tf-bg',
  '--tf-surface',
  '--tf-surface-2',
  '--tf-border',
  '--tf-text',
  '--tf-muted',
  '--tf-accent',
  '--tf-accent-2',
  '--tf-success',
  '--tf-error',
  '--tf-warning',
  '--tf-anim-blue',
  '--tf-anim-green',
  '--tf-indigo',
  '--tf-purple',
  '--tf-black',
  '--tf-info',
  '--tf-dark',
  // Light-theme bridge (Phase 10)
  '--tf-brand-blue',
  '--tf-brand-blue-dark',
  '--tf-light-border',
  '--tf-light-muted',
  '--tf-light-surface',
  // Bridge completion (Phase 14)
  '--tf-transcend',
  '--tf-dark-cyan',
  '--tf-slate-300',
  '--tf-slate-100',
  '--tf-slate-600',
  '--tf-slate-700',
  '--tf-slate-950',
  // Dark-theme bridge (Phase 18)
  '--tf-sky-blue-hs',
  '--tf-navy-border-hs',
  '--tf-deep-navy-hs',
  // Consciousness bridge (Phase 19)
  '--tf-transcend-green-hs',
];

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findAll(pattern: RegExp, text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(pattern)) hits.push(m[0]);
  return hits;
}

describe('Token integrity guard — terrafusion-tokens.css', () => {
  const raw = readFileSync(TOKEN_PATH, 'utf8');
  const css = stripComments(raw);

  it('contains no raw rgba/rgb color functions (all should use hsl(var(--tf-*)))', () => {
    const rgbHits = findAll(/\brgba?\(\s*[^)]+\)/g, css);

    expect(rgbHits).toEqual([]);
  });

  it('contains no unexpected raw hex colors beyond allowed definitions', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css).filter(
      (h) => !ALLOWED_HEX.has(h.toLowerCase())
    );

    expect(hexHits).toEqual([]);
  });

  it('all required LUMIN BRIDGE tokens exist', () => {
    const missing = REQUIRED_BRIDGE_TOKENS.filter((token) => !raw.includes(token + ':'));

    expect(missing).toEqual([]);
  });
});
