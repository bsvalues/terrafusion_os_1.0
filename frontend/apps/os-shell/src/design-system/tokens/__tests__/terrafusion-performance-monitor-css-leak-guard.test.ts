/**
 * Leak-guard: terrafusion-performance-monitor.css
 * Ensures no raw hex / rgba / rgb / hsl colours creep back in.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(
  resolve(__dirname, '../../../styles/terrafusion-performance-monitor.css'),
  'utf8',
);

/* ---- helpers ---- */
function stripComments(s: string) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}
function stripUrls(s: string) {
  return s.replace(/url\([^)]*\)/gi, '');
}
function findAll(re: RegExp, s: string) {
  const hits: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) hits.push(m[0]);
  return hits;
}

const clean = stripUrls(stripComments(css));

/* ---- tests ---- */
test('no raw hex / rgba / rgb colours', () => {
  const HEX_RE = /#[0-9a-f]{3,8}\b/gi;
  const RGBA_RE = /rgba?\s*\([^)]+\)/gi;
  const hexHits = findAll(HEX_RE, clean);
  const rgbaHits = findAll(RGBA_RE, clean);
  const all = [...hexHits, ...rgbaHits];
  expect(all).toEqual([]);
});

test('all hsl() must be token-based (contain var(--tf-))', () => {
  const HSL_RE = /hsla?\s*\([^)]*\)/gi;
  const hits = findAll(HSL_RE, clean).filter(
    (h) => !h.includes('var(--tf-'),
  );
  expect(hits).toEqual([]);
});
