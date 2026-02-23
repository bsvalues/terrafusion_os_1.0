import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contract: Jest-executed test lanes must not import vitest.
 *
 * Rationale: The Frontend Fast Gate CI runs Jest over
 * frontend/apps/os-shell/src/**\/*.test.{ts,tsx}. If a file in that tree
 * contains `from "vitest"` or `from 'vitest'`, Jest crashes with
 * "Vitest cannot be imported in a CommonJS module using require()".
 *
 * Both runners have globals: true, so describe/it/expect are available
 * without explicit imports. This contract prevents regression.
 */
describe('Governance Contract: Jest lane must not import vitest', () => {
  it('disallows vitest imports in leak-guard test directories', () => {
    const repoRoot = process.cwd();

    const dirs = [
      path.join(repoRoot, 'frontend/apps/os-shell/src/core/tests'),
      path.join(repoRoot, 'os-platform/core/tests'),
    ];

    const offenders: string[] = [];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(p);
        } else if (
          entry.isFile() &&
          /\.(test|spec)\.(t|j)sx?$/.test(entry.name)
        ) {
          const txt = fs.readFileSync(p, 'utf8');
          if (
            txt.includes('from "vitest"') ||
            txt.includes("from 'vitest'")
          ) {
            offenders.push(path.relative(repoRoot, p));
          }
        }
      }
    };

    dirs.forEach(walk);

    expect(
      offenders,
      `Found forbidden vitest imports:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
