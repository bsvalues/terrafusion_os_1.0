/**
 * Phase 19b — Hard gate: no direct localStorage authToken access.
 *
 * After Phase 18 established the auth boundary (authStorage.ts),
 * no file outside authStorage.ts should touch localStorage with
 * the 'authToken' key directly. All reads/writes/removes must go
 * through the boundary module.
 *
 * This test scans the source tree and fails with file:line details
 * if any violation is found.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.resolve(__dirname, '../..');
const ALLOWED_FILES = ['auth/authStorage.ts'];
const EXTENSIONS = ['.ts', '.tsx'];

// Patterns that constitute a direct authToken localStorage access
const FORBIDDEN_PATTERNS = [
  /localStorage\.getItem\(\s*['"]authToken['"]\s*\)/,
  /localStorage\.setItem\(\s*['"]authToken['"]/,
  /localStorage\.removeItem\(\s*['"]authToken['"]/,
];

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      results.push(...walkDir(fullPath));
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function isAllowed(filePath: string): boolean {
  const rel = path.relative(SRC_ROOT, filePath).replace(/\\/g, '/');
  return ALLOWED_FILES.some((allowed) => rel === allowed);
}

describe('NoDirectAuthTokenStorageReads', () => {
  it('no file outside authStorage.ts accesses localStorage with authToken key', () => {
    const violations: string[] = [];
    const files = walkDir(SRC_ROOT);

    for (const file of files) {
      if (isAllowed(file)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(lines[i])) {
            const rel = path.relative(SRC_ROOT, file).replace(/\\/g, '/');
            violations.push(`  ${rel}:${i + 1} → ${lines[i].trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual(expect.objectContaining({ length: 0 }));
    if (violations.length > 0) {
      // Belt-and-suspenders: surface details when the expect above fails
      throw new Error(
        `Found ${violations.length} direct localStorage authToken access(es) outside authStorage.ts:\n${violations.join('\n')}\n\nMigrate to: import { getToken, setToken, clearToken } from '@/auth/authStorage';`
      );
    }
  });
});
