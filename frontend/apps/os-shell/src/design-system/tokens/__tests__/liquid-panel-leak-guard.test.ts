import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(__dirname, '../../../ui/materials/liquid-panel.css');

function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripCssUrls(src: string) {
  return src.replace(/\burl\(\s*(['"]?)[\s\S]*?\1\s*\)/g, 'url(…)');
}

function findAll(re: RegExp, text: string) {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

describe('liquid-panel.css – token leak guard', () => {
  const raw = readFileSync(CSS_PATH, 'utf8');
  const css = stripCssUrls(stripComments(raw));

  test('no raw hex or rgba()/rgb() literals', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css);
    const rgbHits = findAll(/\brgba?\(\s*\d[\d\s,./%]*\)/g, css);
    const failures = [...hexHits.map((h) => `HEX: ${h}`), ...rgbHits.map((r) => `RGB: ${r}`)];
    expect(failures).toEqual([]);
  });

  test('only allows hsl() when based on tf tokens', () => {
    const hslCalls = findAll(/\bhsl\(\s*[^)]+\)/g, css);
    const bad = hslCalls.filter((s) => !s.includes('var(--tf-'));
    expect(bad).toEqual([]);
  });
});
