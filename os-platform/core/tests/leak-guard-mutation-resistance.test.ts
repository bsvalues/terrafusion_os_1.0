import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type GuardCheck = {
  guardPath: string;
  targetRelPath: string;
  targetBaseName: string;
};

/**
 * Extracts the target file's relative path from any of the four guard patterns:
 *
 * 1. path.resolve(__dirname, "../../..", "frontend/.../File.tsx")
 * 2. path.join(process.cwd(), "frontend/.../File.tsx")
 * 3. assertNoRawColorLeaks("frontend/.../File.tsx")  (inline, no label)
 * 4. resolve(__dirname, "../../../frontend/.../File.tsx")  (destructured, combined)
 */
function extractTargetRelPath(guardContent: string): string | null {
  // Pattern 1: path.resolve(__dirname, "../../..", "frontend/...")
  const p1 = guardContent.match(
    /path\.resolve\(\s*__dirname\s*,[\s\S]*?,\s*["'`](frontend\/[^"'`]+?)["'`],?\s*\)/m
  );
  if (p1?.[1]) return p1[1];

  // Pattern 2: path.join(process.cwd(), "frontend/...")
  const p2 = guardContent.match(
    /path\.join\(\s*process\.cwd\(\)\s*,\s*["'`](frontend\/[^"'`]+?)["'`],?\s*\)/m
  );
  if (p2?.[1]) return p2[1];

  // Pattern 4: resolve(__dirname, "../../../frontend/...")  (destructured import)
  const p4 = guardContent.match(
    /\bresolve\(\s*__dirname\s*,\s*["'`][^"'`]*?(frontend\/[^"'`]+?)["'`],?\s*\)/m
  );
  if (p4?.[1]) return p4[1];

  // Pattern 5: const rel = 'frontend/...' (variable-based, e.g. path.join(repoRoot, rel))
  const p5 = guardContent.match(
    /const\s+rel\s*=\s*["'`](frontend\/[^"'`]+?)["'`]/m
  );
  if (p5?.[1]) return p5[1];

  // Pattern 3: assertNoRawColorLeaks("frontend/...")  (inline path, no label)
  const p3 = guardContent.match(/assertNoRawColorLeaks\(\s*["'`](frontend\/[^"'`]+?)["'`]\s*\)/m);
  if (p3?.[1]) return p3[1];

  return null;
}

/**
 * Checks whether the guard passes a label matching the target basename.
 * Returns true if label matches OR if the guard uses the inline-path pattern
 * (pattern 3) which doesn't use labels.
 */
function hasMatchingLabel(guardContent: string, expectedBaseName: string): boolean {
  // Inline-path pattern (no label used) — exempt from label checking
  if (/assertNoRawColorLeaks\(\s*["'`]frontend\//.test(guardContent)) {
    return true;
  }

  const escaped = expectedBaseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `assertNoRawColorLeaks\\(\\s*\\w+\\s*,\\s*\\{\\s*label\\s*:\\s*["'\`]${escaped}["'\`],?\\s*\\}\\s*\\)`,
    'm'
  );
  return re.test(guardContent);
}

describe('Leak guard mutation resistance', () => {
  it('every leak-guard test uses a label equal to the target file basename', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const testsRoot = path.resolve(repoRoot, 'os-platform/core/tests');

    expect(fs.existsSync(testsRoot), `Expected tests directory to exist: ${testsRoot}`).toBe(true);

    const guardFiles = fs
      .readdirSync(testsRoot)
      .filter(f => f.endsWith('-leak-guard.test.ts') || f.endsWith('-leak-guard.test.tsx'))
      .map(f => path.join(testsRoot, f))
      .sort();

    expect(
      guardFiles.length,
      'Expected at least 1 leak-guard test file; meta-integrity indicates there should be many.'
    ).toBeGreaterThan(0);

    const failures: string[] = [];
    const parsed: GuardCheck[] = [];

    for (const guardPath of guardFiles) {
      const content = fs.readFileSync(guardPath, 'utf8');
      const targetRelPath = extractTargetRelPath(content);

      if (!targetRelPath) {
        failures.push(
          `Missing/invalid target path resolution pattern in guard:\n  ${path.relative(repoRoot, guardPath)}`
        );
        continue;
      }

      const targetBaseName = path.basename(targetRelPath);
      parsed.push({ guardPath, targetRelPath, targetBaseName });

      if (!hasMatchingLabel(content, targetBaseName)) {
        failures.push(
          [
            `Label mismatch in guard: ${path.relative(repoRoot, guardPath)}`,
            `  Target: ${targetRelPath}`,
            `  Expected label: "${targetBaseName}"`,
          ].join('\n')
        );
      }
    }

    expect(failures.join('\n\n')).toBe('');
    expect(parsed.length).toBe(guardFiles.length);
  });
});
