import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

type ForbiddenDep = {
  name: string;
  patterns: RegExp[];
};

const FORBIDDEN: ForbiddenDep[] = [
  {
    name: 'nodemailer',
    patterns: [
      /^\s*import\s+.*\s+from\s+["']nodemailer["'];?\s*$/m,
      /^\s*(?:const|let|var)\s+.*=\s*require\(\s*["']nodemailer["']\s*\)\s*;?\s*$/m,
    ],
  },
  {
    name: 'bcrypt',
    patterns: [
      /^\s*import\s+.*\s+from\s+["']bcrypt["'];?\s*$/m,
      /^\s*(?:const|let|var)\s+.*=\s*require\(\s*["']bcrypt["']\s*\)\s*;?\s*$/m,
    ],
  },
  {
    name: 'multer',
    patterns: [
      /^\s*import\s+.*\s+from\s+["']multer["'];?\s*$/m,
      /^\s*(?:const|let|var)\s+.*=\s*require\(\s*["']multer["']\s*\)\s*;?\s*$/m,
    ],
  },
];

// A lightweight heuristic: optional-deps tests must not import optional deps at module scope.
// They must be imported inside a try/catch within a test or helper.
function scanFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && /\.test\.(t|j)sx?$/.test(ent.name)) results.push(p);
    }
  };

  walk(dir);
  return results;
}

describe('Governance Contract: optional-deps tests must not hard-import optional deps', () => {
  it('forbids top-level imports/requires of optional dependencies', () => {
    const repoRoot = process.cwd();
    const optionalDepsDir = path.join(repoRoot, 'tests/optional-deps');

    const files = scanFiles(optionalDepsDir);
    expect(files.length, 'Expected optional-deps tests to exist').toBeGreaterThan(0);

    const offenders: { file: string; dep: string; pattern: string }[] = [];

    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');

      for (const dep of FORBIDDEN) {
        for (const pat of dep.patterns) {
          if (pat.test(text)) {
            offenders.push({
              file: path.relative(repoRoot, file),
              dep: dep.name,
              pattern: String(pat),
            });
          }
        }
      }
    }

    expect(
      offenders,
      offenders.length
        ? `Top-level optional dep imports found:\n${offenders
            .map(o => `- ${o.file}: ${o.dep}`)
            .join('\n')}\n\nFix: move import/require into a try/catch inside the test.`
        : ''
    ).toEqual([]);
  });
});
