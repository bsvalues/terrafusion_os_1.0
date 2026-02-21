import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(
  __dirname,
  '../../../applications/terra-levy/components/analytics/QuantumAnalyticsWorkbench.css'
);

const ALLOWED_HEX = 0;

function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findAll(re: RegExp, text: string) {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

describe('QuantumAnalyticsWorkbench.css – token leak guard', () => {
  const raw = readFileSync(CSS_PATH, 'utf8');
  const css = stripComments(raw);

  test('no raw rgba()/rgb() literals', () => {
    const hits = findAll(/\brgba?\(\s*\d[\d\s,./%]*\)/g, css);
    expect(hits).toEqual([]);
  });

  test(`no more than ${ALLOWED_HEX} raw hex colours`, () => {
    const hits = findAll(/#[0-9a-fA-F]{3,8}\b/g, css);
    expect(hits.length).toBeLessThanOrEqual(ALLOWED_HEX);
  });
});
