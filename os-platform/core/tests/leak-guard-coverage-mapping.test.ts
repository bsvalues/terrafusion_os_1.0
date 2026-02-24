import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 202: Coverage mapping test
 *
 * Guarantees:
 *  - Every guard target exists on disk.
 *  - No two guards target the same file.
 *  - No orphan guards (targets constrained to allowed roots).
 * Optional (STRICT): ensure all eligible source files under allowed roots have guards.
 *
 * Uses the same constant-resolution extraction from Phase 201R.
 */

/** Toggle strictness here. */
const STRICT_UNGUARDED_CHECK = false;

/** Guard file suffixes. */
const GUARD_SUFFIXES = ['-leak-guard.test.ts', '-leak-guard.test.tsx'] as const;

/**
 * Allowed target roots (relative to repo root).
 * Keep these narrow to avoid surprising coverage requirements.
 */
const ALLOWED_TARGET_ROOTS = ['frontend/apps/os-shell/src'] as const;

/**
 * Eligible file extensions for STRICT mode.
 * (We include CSS because you already have CSS guards.)
 */
const ELIGIBLE_EXTS = new Set(['.ts', '.tsx', '.css']);

/** Directories to skip when walking for STRICT mode. */
const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.git',
  'coverage',
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

/**
 * Extracts target file relative path from guard source.
 * Matches the 5-pattern extraction from Phase 201R (constant-resolution).
 */
function extractTargetRelPath(source: string, constants: Map<string, string>): string | null {
  function resolveCapture(
    m: RegExpMatchArray,
    _litGroup: number,
    valGroup: number,
    identGroup: number
  ): string | null {
    const lit = m[valGroup] ?? null;
    if (lit !== null) return lit.trim();
    const ident = m[identGroup] ?? null;
    if (!ident) return null;
    const resolved = constants.get(ident);
    return resolved ? resolved.trim() : null;
  }

  // Pattern 1: path.resolve(__dirname, "../../..", <target>)
  const p1 = source.match(
    /path\.resolve\(\s*__dirname\s*,[\s\S]*?,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m
  );
  if (p1) {
    const val = resolveCapture(p1, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 2: path.join(process.cwd(), <target>) or path.join(<var>, <target>)
  const p2 = source.match(
    /path\.join\(\s*(?:process\.cwd\(\)|[\w$]+)\s*,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m
  );
  if (p2) {
    const val = resolveCapture(p2, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 3: resolve(__dirname, ..., <target>)  (destructured import)
  const p3 = source.match(
    /\bresolve\(\s*__dirname\s*,[\s\S]*?,?\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m
  );
  if (p3) {
    const val = resolveCapture(p3, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 4: const rel = "frontend/..." (variable with frontend path)
  const p4 = source.match(/\bconst\s+\w+\s*=\s*["'`](frontend\/[^"'`]+?)["'`]/m);
  if (p4?.[1]) return p4[1];

  // Pattern 5: assertNoRawColorLeaks("frontend/...")  (inline path, no label)
  const p5 = source.match(/assertNoRawColorLeaks\(\s*["'`](frontend\/[^"'`]+?)["'`]\s*\)/m);
  if (p5?.[1]) return p5[1];

  return null;
}

function isUnderAllowedRoots(targetRelPath: string): boolean {
  const norm = targetRelPath.replaceAll('\\', '/');
  return ALLOWED_TARGET_ROOTS.some(root => norm.startsWith(`${root}/`) || norm === root);
}

function isEligibleForStrict(absPath: string): boolean {
  const ext = path.extname(absPath);
  if (!ELIGIBLE_EXTS.has(ext)) return false;
  if (absPath.endsWith('.d.ts')) return false;
  return true;
}

describe('Leak guard coverage mapping (Phase 202)', () => {
  it('guards map 1:1 to real targets and do not duplicate (and optionally cover all eligible files)', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const testsRoot = path.resolve(repoRoot, 'os-platform/core/tests');

    expect(fs.existsSync(testsRoot), `Expected tests directory: ${testsRoot}`).toBe(true);

    // Use git ls-files for deterministic enumeration — only tracked guards count.
    // This prevents untracked (regenerated) files from affecting the result.
    const trackedRaw = execSync(
      'git ls-files os-platform/core/tests/*-leak-guard.test.ts os-platform/core/tests/*-leak-guard.test.tsx',
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    ).trim();
    const guardFiles = trackedRaw
      ? trackedRaw.split('\n').map(rel => path.resolve(repoRoot, rel.trim()))
      : [];

    expect(guardFiles.length, 'Expected tracked leak-guard tests to exist.').toBeGreaterThan(0);

    const failures: string[] = [];
    const targetToGuard = new Map<string, string>(); // targetRelPath -> guardRelPath

    for (const guardAbs of guardFiles) {
      const guardRel = path.relative(repoRoot, guardAbs);
      const source = fs.readFileSync(guardAbs, 'utf8');
      const constants = extractStringConstants(source);

      const targetRel = extractTargetRelPath(source, constants);
      if (!targetRel) {
        failures.push(`Unable to resolve target path in guard:\n  ${guardRel}`);
        continue;
      }

      // Normalize: strip leading "../" segments (guards using resolve(__dirname, '../../../frontend/...'))
      // and normalize slashes for stable cross-platform comparison.
      const targetRelNorm = targetRel.replaceAll('\\', '/').replace(/^(?:\.\.\/)+/, '');

      // 1) Orphan guard detection (constrain to allowed roots)
      if (!isUnderAllowedRoots(targetRelNorm)) {
        failures.push(
          [
            `Orphan/Out-of-scope guard target:`,
            `  Guard:  ${guardRel}`,
            `  Target: ${targetRelNorm}`,
            `  Allowed roots: ${ALLOWED_TARGET_ROOTS.join(', ')}`,
          ].join('\n')
        );
      }

      // 2) Target existence
      const targetAbs = path.resolve(repoRoot, targetRelNorm);
      if (!fs.existsSync(targetAbs)) {
        failures.push(
          [
            `Guard target does not exist on disk:`,
            `  Guard:  ${guardRel}`,
            `  Target: ${targetRelNorm}`,
            `  Resolved: ${targetAbs}`,
          ].join('\n')
        );
      }

      // 3) Duplicate targeting
      const existing = targetToGuard.get(targetRelNorm);
      if (existing) {
        failures.push(
          [
            `Duplicate guard target detected:`,
            `  Target: ${targetRelNorm}`,
            `  Guard A: ${existing}`,
            `  Guard B: ${guardRel}`,
          ].join('\n')
        );
      } else {
        targetToGuard.set(targetRelNorm, guardRel);
      }
    }

    // Optional strict: ensure all eligible files under allowed roots are guarded.
    if (STRICT_UNGUARDED_CHECK) {
      const eligibleAbsFiles: string[] = [];

      for (const rootRel of ALLOWED_TARGET_ROOTS) {
        const rootAbs = path.resolve(repoRoot, rootRel);
        if (!fs.existsSync(rootAbs)) continue;

        const found = walkFiles(rootAbs, abs => isEligibleForStrict(abs));
        eligibleAbsFiles.push(...found);
      }

      const eligibleRel = eligibleAbsFiles
        .map(abs => path.relative(repoRoot, abs).replaceAll('\\', '/'))
        .sort();

      const unguarded = eligibleRel.filter(rel => !targetToGuard.has(rel));

      const MAX_LIST = 50;
      if (unguarded.length > 0) {
        failures.push(
          [
            `Unguarded eligible files detected (STRICT mode): ${unguarded.length}`,
            ...unguarded.slice(0, MAX_LIST).map(p => `  - ${p}`),
            ...(unguarded.length > MAX_LIST
              ? [`  ...and ${unguarded.length - MAX_LIST} more`]
              : []),
          ].join('\n')
        );
      }
    }

    expect(failures.join('\n\n')).toBe('');
  });
});
