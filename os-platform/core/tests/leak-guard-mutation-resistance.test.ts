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
 * Extracts the last argument to a path.resolve(__dirname, ..., <lastArg>) call.
 * Supports the lastArg being:
 *  - a string literal
 *  - an identifier that resolves to a string literal via extractStringConstants()
 */
function extractTargetRelPath(source: string, constants: Map<string, string>): string | null {
  const normalizeTargetPath = (value: string): string => {
    const trimmed = value.trim();
    const marker = 'frontend/apps/os-shell/src/';
    const markerIdx = trimmed.indexOf(marker);
    return markerIdx >= 0 ? trimmed.slice(markerIdx) : trimmed;
  };

  const candidates = new Set<string>();

  for (const value of constants.values()) {
    if (value.includes('frontend/apps/os-shell/src/')) {
      candidates.add(normalizeTargetPath(value));
    }
  }

  for (const m of source.matchAll(/["'`]([^"'`]*frontend\/apps\/os-shell\/src\/[^"'`]*)["'`]/g)) {
    const raw = (m[1] ?? '').trim();
    if (raw) candidates.add(normalizeTargetPath(raw));
  }

  if (candidates.size === 0) return null;
  if (candidates.size === 1) return [...candidates][0]!;

  const pathLike = [...candidates].filter((value) =>
    /\.[a-z0-9]+$/i.test(path.basename(value)),
  );

  if (pathLike.length === 1) return pathLike[0]!;

  pathLike.sort((a, b) => a.length - b.length);
  return pathLike[0] ?? [...candidates][0]!;
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

      parsed.push({ guardAbsPath, guardRelPath, targetRelPath, targetBaseName, labelValue });

      if (!labelValue) {
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

      if (labelValue !== targetBaseName) {
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
