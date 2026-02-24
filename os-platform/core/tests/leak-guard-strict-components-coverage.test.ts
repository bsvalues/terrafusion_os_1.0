import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Phase 203: Strict coverage (narrow root)
 *
 * Enforces bijection-like coverage for a narrow, stable surface:
 *   frontend/apps/os-shell/src/components
 */

const NARROW_ROOT = 'frontend/apps/os-shell/src/components';
const TESTS_ROOT = 'os-platform/core/tests';
const GUARD_SUFFIXES = ['-leak-guard.test.ts', '-leak-guard.test.tsx'] as const;

const ELIGIBLE_EXTS = new Set(['.ts', '.tsx', '.css']);
const SKIP_DIR_NAMES = new Set([
  'node_modules', 'dist', 'build', '.next', '.turbo', '.git', 'coverage',
]);

function walkFiles(dir: string, predicate: (abs: string) => boolean): string[] {
  const out: string[] = [];
  const stack: string[] = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const abs = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (!SKIP_DIR_NAMES.has(ent.name)) stack.push(abs);
      } else if (ent.isFile() && predicate(abs)) {
        out.push(abs);
      }
    }
  }
  return out.sort();
}

function isEligibleSource(relPath: string): boolean {
  const norm = relPath.replaceAll('\\', '/');
  if (norm.endsWith('.d.ts')) return false;
  if (/\.(test|spec|stories)\./i.test(norm)) return false;
  if (norm.includes('/__tests__/') || norm.includes('/__mocks__/')) return false;
  const ext = path.extname(norm);
  return ELIGIBLE_EXTS.has(ext);
}

function extractStringConstants(source: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])([\s\S]*?)\2\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const ident = m[1]!;
    const value = (m[3] ?? '').trim();
    if (value.length > 0 && value.length < 5000) map.set(ident, value);
  }
  return map;
}

function extractTargetRelPath(
  source: string,
  constants: Map<string, string>,
): string | null {
  function resolveCapture(
    m: RegExpMatchArray,
    _litGroup: number,
    valGroup: number,
    identGroup: number,
  ): string | null {
    const lit = m[valGroup] ?? null;
    if (lit !== null) return lit.trim();
    const ident = m[identGroup] ?? null;
    if (!ident) return null;
    const resolved = constants.get(ident);
    return resolved ? resolved.trim() : null;
  }

  // Pattern 1: path.resolve(__dirname, '../../..', <target>)
  const p1 = source.match(
    /path\.resolve\(\s*__dirname\s*,[\s\S]*?,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p1) {
    const val = resolveCapture(p1, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 2: path.join(process.cwd(), <target>)
  const p2 = source.match(
    /path\.join\(\s*(?:process\.cwd\(\)|[\w$]+)\s*,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p2) {
    const val = resolveCapture(p2, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 3: resolve(__dirname, ..., <target>) (destructured)
  const p3 = source.match(
    /\bresolve\(\s*__dirname\s*,[\s\S]*?,?\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p3) {
    const val = resolveCapture(p3, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 4: const rel = 'frontend/...'
  const p4 = source.match(/\bconst\s+\w+\s*=\s*["'`](frontend\/[^"'`]+?)["'`]/m);
  if (p4?.[1]) return p4[1];

  // Pattern 5: assertNoRawColorLeaks('frontend/...')
  const p5 = source.match(
    /assertNoRawColorLeaks\(\s*["'`](frontend\/[^"'`]+?)["'`]\s*\)/m,
  );
  if (p5?.[1]) return p5[1];

  return null;
}

describe('Leak guard STRICT coverage (components narrow root) \u2014 Phase 203', () => {
  it('every eligible file in os-shell components has a corresponding leak guard', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const narrowRootAbs = path.resolve(repoRoot, NARROW_ROOT);
    const testsRootAbs = path.resolve(repoRoot, TESTS_ROOT);

    expect(
      fs.existsSync(narrowRootAbs),
      "Expected narrow root to exist",
    ).toBe(true);
    expect(
      fs.existsSync(testsRootAbs),
      "Expected tests root to exist",
    ).toBe(true);

    // 1) Gather all guard targets
    const guardFiles = walkFiles(testsRootAbs, (abs) =>
      GUARD_SUFFIXES.some((s) => abs.endsWith(s)),
    );

    const targetToGuard = new Map<string, string>();
    for (const guardAbs of guardFiles) {
      const guardRel = path.relative(repoRoot, guardAbs).replaceAll('\\', '/');
      const src = fs.readFileSync(guardAbs, 'utf8');
      const constants = extractStringConstants(src);
      const targetRel = extractTargetRelPath(src, constants);
      if (!targetRel) continue;
      const normTargetRel = targetRel.replaceAll('\\', '/').replace(/^(?:\.\.\/)+/, '');
      if (!normTargetRel.startsWith(NARROW_ROOT + '/')) continue;
      if (!targetToGuard.has(normTargetRel)) targetToGuard.set(normTargetRel, guardRel);
    }

    // 2) Gather eligible source files under narrow root
    const eligibleAbs = walkFiles(narrowRootAbs, (abs) => {
      const rel = path.relative(repoRoot, abs);
      return isEligibleSource(rel);
    });

    const eligibleRel = eligibleAbs
      .map((abs) => path.relative(repoRoot, abs).replaceAll('\\', '/'))
      .sort();

    // 3) Compute unguarded set
    const unguarded = eligibleRel.filter((rel) => !targetToGuard.has(rel));

    // 4) Emit actionable failure if any are missing guards
    const MAX_LIST = 60;
    if (unguarded.length > 0) {
      const lines = [
        'Unguarded eligible files in narrow root (' + NARROW_ROOT + '): ' + unguarded.length,
        ...unguarded.slice(0, MAX_LIST).map((p) => '  - ' + p),
        ...(unguarded.length > MAX_LIST
          ? ['  ...and ' + (unguarded.length - MAX_LIST) + ' more']
          : []),
      ];
      throw new Error(lines.join('\n'));
    }
  });
});
