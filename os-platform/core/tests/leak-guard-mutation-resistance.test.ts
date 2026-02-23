import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type GuardParse = {
  guardAbsPath: string;
  guardRelPath: string;
  targetRelPath: string;
  targetBaseName: string;
  labelValue: string | null;
};

/**
 * Recursively collects files under `dir` that satisfy predicate.
 * Avoids extra deps (glob libs) to keep the test environment stable.
 */
function walkFiles(dir: string, predicate: (absPath: string) => boolean): string[] {
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
      if (ent.isDirectory()) stack.push(abs);
      else if (ent.isFile() && predicate(abs)) out.push(abs);
    }
  }

  return out.sort();
}

/**
 * Very small, deterministic "string constant table" for guard tests.
 * Supports:
 *   const X = "string";
 *   let X = 'string';
 *   const X = `string`;
 *
 * Only top-level/simple assignments are needed for our guard patterns.
 */
function extractStringConstants(source: string): Map<string, string> {
  const map = new Map<string, string>();

  const re =
    /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])([\s\S]*?)\2\s*;/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const ident = m[1]!;
    const value = m[3]!;
    if (value.length > 0 && value.length < 5000) {
      map.set(ident, value);
    }
  }

  return map;
}

/**
 * Extracts the target file's relative path from the guard source.
 * Supports all known guard resolution patterns with constant-resolution:
 *
 * 1. path.resolve(__dirname, "../../..", <literal|CONST>)
 * 2. path.join(process.cwd(), <literal|CONST>)  /  path.join(repoRoot, <literal|CONST>)
 * 3. resolve(__dirname, ..., <literal|CONST>)    (destructured import)
 * 4. const rel = "frontend/..." (variable extracted, then used in path.join)
 * 5. assertNoRawColorLeaks("frontend/...")        (inline path, no label — target IS the path)
 */
function extractTargetRelPath(source: string, constants: Map<string, string>): string | null {
  // Helper: resolve a last-arg capture (literal or identifier)
  function resolveCapture(
    m: RegExpMatchArray,
    litGroup: number,
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

  // Pattern 1: path.resolve(__dirname, "../../..", <target>)
  const p1 = source.match(
    /path\.resolve\(\s*__dirname\s*,[\s\S]*?,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p1) {
    const val = resolveCapture(p1, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 2: path.join(process.cwd(), <target>) or path.join(<var>, <target>)
  const p2 = source.match(
    /path\.join\(\s*(?:process\.cwd\(\)|[\w$]+)\s*,\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p2) {
    const val = resolveCapture(p2, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 3: resolve(__dirname, ..., <target>)  (destructured import of path.resolve)
  const p3 = source.match(
    /\bresolve\(\s*__dirname\s*,[\s\S]*?,?\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))\s*,?\s*\)/m,
  );
  if (p3) {
    const val = resolveCapture(p3, 1, 2, 3);
    if (val) return val;
  }

  // Pattern 4: const rel = "frontend/..." (variable with frontend path)
  const p4 = source.match(/\bconst\s+\w+\s*=\s*["'`](frontend\/[^"'`]+?)["'`]/m);
  if (p4?.[1]) return p4[1];

  // Pattern 5: assertNoRawColorLeaks("frontend/...")  (inline path as first arg, no label)
  const p5 = source.match(/assertNoRawColorLeaks\(\s*["'`](frontend\/[^"'`]+?)["'`]\s*\)/m);
  if (p5?.[1]) return p5[1];

  return null;
}

/**
 * Extracts the label value used in:
 *   assertNoRawColorLeaks(<any>, { label: "<value>", ... })
 * Supports:
 *  - label as string literal
 *  - label as identifier resolving to string literal
 *  - additional properties in the options object
 *  - any variable name for the first argument (not necessarily "content")
 */
function extractLabelValue(source: string, constants: Map<string, string>): string | null {
  const callRe = /assertNoRawColorLeaks\(\s*[\s\S]*?,\s*\{([\s\S]*?)\}\s*\)/m;
  const callMatch = source.match(callRe);
  if (!callMatch) return null;

  const objBody = callMatch[1] ?? '';

  const labelRe = /\blabel\s*:\s*(?:(["'`])([\s\S]*?)\1|([A-Za-z_$][\w$]*))/m;
  const labelMatch = objBody.match(labelRe);
  if (!labelMatch) return null;

  const literalValue = labelMatch[2] ?? null;
  if (literalValue !== null) return literalValue.trim();

  const ident = labelMatch[3] ?? null;
  if (!ident) return null;

  const resolved = constants.get(ident);
  return resolved ? resolved.trim() : null;
}

describe('Leak guard mutation resistance', () => {
  it('every leak-guard uses a label equal to path.basename(target)', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const testsRoot = path.resolve(repoRoot, 'os-platform/core/tests');

    expect(fs.existsSync(testsRoot), `Expected tests directory to exist: ${testsRoot}`).toBe(true);

    const guardFiles = walkFiles(
      testsRoot,
      (p) => p.endsWith('-leak-guard.test.ts') || p.endsWith('-leak-guard.test.tsx'),
    );

    expect(
      guardFiles.length,
      'Expected leak-guard tests to exist; meta-integrity indicates there should be many.',
    ).toBeGreaterThan(0);

    const failures: string[] = [];
    const parsed: GuardParse[] = [];

    for (const guardAbsPath of guardFiles) {
      const guardRelPath = path.relative(repoRoot, guardAbsPath);
      const source = fs.readFileSync(guardAbsPath, 'utf8');
      const constants = extractStringConstants(source);

      const targetRelPath = extractTargetRelPath(source, constants);
      if (!targetRelPath) {
        failures.push(
          [
            `Unable to resolve target path in guard (expected path.resolve(__dirname, "../../..", <target>)):`,
            `  ${guardRelPath}`,
          ].join('\n'),
        );
        continue;
      }

      const targetBaseName = path.basename(targetRelPath);
      const labelValue = extractLabelValue(source, constants);

      // Inline-path guards (assertNoRawColorLeaks("frontend/...")) have no label — exempt
      const isInlinePath = /assertNoRawColorLeaks\(\s*["'`]frontend\//.test(source);

      parsed.push({ guardAbsPath, guardRelPath, targetRelPath, targetBaseName, labelValue });

      if (!labelValue && !isInlinePath) {
        failures.push(
          [
            `Missing label in assertNoRawColorLeaks options object:`,
            `  Guard:  ${guardRelPath}`,
            `  Target: ${targetRelPath}`,
            `  Expected: { label: "${targetBaseName}" }`,
          ].join('\n'),
        );
        continue;
      }

      if (labelValue && labelValue !== targetBaseName) {
        failures.push(
          [
            `Label mismatch:`,
            `  Guard:    ${guardRelPath}`,
            `  Target:   ${targetRelPath}`,
            `  Expected: ${targetBaseName}`,
            `  Actual:   ${labelValue}`,
          ].join('\n'),
        );
      }
    }

    // Ensure our parser is not silently skipping guards.
    expect(parsed.length).toBe(guardFiles.length);

    // Make mismatches loud + actionable.
    expect(failures.join('\n\n')).toBe('');
  });
});
