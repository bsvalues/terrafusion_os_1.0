import { readFileSync } from 'fs';
import { resolve } from 'path';

const TSX_PATH = resolve(__dirname, '../../../components/research/StatisticalValidationWorkbench.tsx');

function stripBlockAndLineComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function extractStringsAndStrip(input: string): {
  strings: string[];
  codeWithoutStrings: string;
} {
  const strings: string[] = [];
  let out = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === "'") {
      let j = i + 1;
      let s = "'";
      while (j < input.length) {
        const c = input[j];
        s += c;
        if (c === '\\' && j + 1 < input.length) {
          s += input[j + 1];
          j += 2;
          continue;
        }
        if (c === "'") break;
        j++;
      }
      strings.push(s);
      out += "''";
      i = j + 1;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      let s = '"';
      while (j < input.length) {
        const c = input[j];
        s += c;
        if (c === '\\' && j + 1 < input.length) {
          s += input[j + 1];
          j += 2;
          continue;
        }
        if (c === '"') break;
        j++;
      }
      strings.push(s);
      out += '""';
      i = j + 1;
      continue;
    }

    if (ch === '`') {
      let j = i + 1;
      let s = '`';
      let depth = 0;
      while (j < input.length) {
        const c = input[j];
        s += c;
        if (c === '\\' && j + 1 < input.length) {
          s += input[j + 1];
          j += 2;
          continue;
        }
        if (c === '$' && input[j + 1] === '{') {
          depth++;
          s += '{';
          j += 2;
          continue;
        }
        if (c === '}' && depth > 0) {
          depth--;
          j++;
          continue;
        }
        if (c === '`' && depth === 0) break;
        j++;
      }
      strings.push(s);
      out += '``';
      i = j + 1;
      continue;
    }

    out += ch;
    i++;
  }

  return { strings, codeWithoutStrings: out };
}

function findAll(re: RegExp, text: string): string[] {
  return [...text.matchAll(re)].map((m) => m[0]);
}

describe('StatisticalValidationWorkbench.tsx – TSX token leak guard', () => {
  const raw = readFileSync(TSX_PATH, 'utf8');
  const noComments = stripBlockAndLineComments(raw);
  const { codeWithoutStrings, strings } = extractStringsAndStrip(noComments);

  test('no raw hex/rgb/rgba in executable code (outside strings/comments)', () => {
    const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, codeWithoutStrings);
    const rgbHits = findAll(/\brgba?\(\s*\d[\d\s,./%]*\)/g, codeWithoutStrings);
    const failures = [...hexHits.map((h) => `HEX: ${h}`), ...rgbHits.map((r) => `RGB: ${r}`)];
    expect(failures).toEqual([]);
  });

  test('no raw hex/rgb/rgba inside string literals', () => {
    const failures: string[] = [];
    for (const s of strings) {
      const hexHits = findAll(/#[0-9a-fA-F]{3,8}\b/g, s);
      const rgbHits = findAll(/\brgba?\(\s*\d[\d\s,./%]*\)/g, s);
      for (const h of hexHits) failures.push(`HEX in string: ${h} :: ${s.slice(0, 80)}`);
      for (const r of rgbHits) failures.push(`RGB in string: ${r} :: ${s.slice(0, 80)}`);
    }
    expect(failures).toEqual([]);
  });

  test('only allows hsl() literals when token-based', () => {
    const scan = [codeWithoutStrings, ...strings].join('\n');
    const hslCalls = findAll(/\bhsl\(\s*[^)]+\)/g, scan);
    const bad = hslCalls.filter((x) => !x.includes('var(--tf-'));
    expect(bad).toEqual([]);
  });
});
