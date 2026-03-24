/**
 * wave5-typeSafety.contract.test.ts
 *
 * Wave 5: Type Safety Hardening — proves ESLint enforcement,
 * governed directory cleanliness, service boundary any elimination,
 * and regression prevention gates.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');
const FRONTEND_ROOT = resolve(SRC_ROOT, '../../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

function countPattern(dir: string, pattern: RegExp, excludeTests = true): number {
  const absDir = resolve(SRC_ROOT, dir);
  let count = 0;
  function walk(d: string) {
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const p = join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') walk(p);
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        if (excludeTests && /\.test\./.test(entry.name)) continue;
        const content = readFileSync(p, 'utf-8');
        const matches = content.match(pattern);
        if (matches) count += matches.length;
      }
    }
  }
  walk(absDir);
  return count;
}

// ============================================================================
// Gate 1: ESLint no-explicit-any rule is active
// ============================================================================
describe('Gate 1 — ESLint no-explicit-any enforcement', () => {
  const eslintConfig = readFileSync(resolve(FRONTEND_ROOT, '.eslintrc.cjs'), 'utf-8');

  it('has @typescript-eslint/no-explicit-any rule', () => {
    expect(eslintConfig).toContain('no-explicit-any');
  });

  it('has governed directory override', () => {
    expect(eslintConfig).toContain('auth/**');
    expect(eslintConfig).toContain('contracts/**');
  });
});

// ============================================================================
// Gate 2: Governed directories remain clean (0 any)
// ============================================================================
describe('Gate 2 — governed directories zero any', () => {
  const dirs = ['auth', 'contracts', 'orchestration', 'routing', 'config'];
  for (const dir of dirs) {
    it(`${dir}/ has zero any types`, () => {
      expect(countPattern(dir, /:\s*any\b/g)).toBe(0);
    });
  }
});

// ============================================================================
// Gate 3: gptHub.ts has zero any
// ============================================================================
describe('Gate 3 — gptHub.ts zero any', () => {
  it('has no any type annotations', () => {
    const src = readSrc('services/gptHub.ts');
    const matches = src.match(/:\s*any\b/g) || [];
    expect(matches.length).toBe(0);
  });
});

// ============================================================================
// Gate 4: signalRClient.ts has zero any
// ============================================================================
describe('Gate 4 — signalRClient.ts zero any', () => {
  it('has no any type annotations', () => {
    const src = readSrc('services/signalRClient.ts');
    const matches = src.match(/:\s*any\b/g) || [];
    expect(matches.length).toBe(0);
  });
});

// ============================================================================
// Gate 5: performance.ts has zero naked any
// ============================================================================
describe('Gate 5 — performance.ts zero naked any', () => {
  it('has no any outside of @ts-expect-error lines', () => {
    const src = readSrc('services/performance.ts');
    const lines = src.split('\n');
    const nakedAnyLines = lines.filter(
      l => /:\s*any\b/.test(l) && !l.includes('@ts-expect-error')
    );
    expect(nakedAnyLines.length).toBe(0);
  });
});

// ============================================================================
// Gate 6: Zero @ts-ignore regression
// ============================================================================
describe('Gate 6 — zero @ts-ignore', () => {
  it('no @ts-ignore in entire src/', () => {
    expect(countPattern('.', /@ts-ignore/g, false)).toBe(0);
  });
});

// ============================================================================
// Gate 7: @ts-expect-error frozen at ceiling
// ============================================================================
describe('Gate 7 — @ts-expect-error ceiling', () => {
  it('@ts-expect-error count <= 17', () => {
    expect(countPattern('.', /@ts-expect-error/g, false)).toBeLessThanOrEqual(17);
  });
});

// ============================================================================
// Gate 8: type-debt script exists
// ============================================================================
describe('Gate 8 — type-debt gate exists', () => {
  it('frontend package.json has type-debt script', () => {
    const pkg = readFileSync(resolve(FRONTEND_ROOT, 'package.json'), 'utf-8');
    expect(pkg).toContain('type-debt');
  });
});
