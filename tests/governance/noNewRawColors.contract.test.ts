import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const UI_SCOPE_DIR = path.join(ROOT_DIR, 'frontend', 'apps', 'os-shell');
// Baselines snapshot the in-tree raw-color count so this contract catches
// NEW raw-color introductions. Re-baselined 2026-06-12 for the June 10
// integration line: the branch already contains 1405 hex occurrences before
// Workbench/County PRs merge, and those PRs add no new hex colors. Hold the
// current floor so future PRs must clean up or offset any new raw colors.
// The matching tooling-classified ratchet lives in ui-token-baseline.json.
const BASELINE_RGBA_RGB = 1335;
const BASELINE_HEX = 1405;

const INCLUDED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html']);
const EXCLUDED_DIRECTORIES = new Set(['node_modules', 'dist', '__tests__', '__mocks__', 'ARCHIVE', 'QUARANTINE']);

function collectScopedFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const walk = (currentDir: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
        walk(entryPath);
      } else if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  };

  walk(dir);
  return files;
}

function stripComments(input: string): string {
  let output = input.replace(/\/\*[\s\S]*?\*\//g, '');
  output = output.replace(/(^|[^:])\/\/.*$/gm, '$1');
  return output;
}

function countRawColors(sourceText: string) {
  const sanitized = stripComments(sourceText);
  const rgbaRgbCount =
    (sanitized.match(/\brgba\s*\(/gi) ?? []).length +
    (sanitized.match(/\brgb\s*\(/gi) ?? []).length;
  const hexCount = (sanitized.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).length;

  return { rgbaRgbCount, hexCount };
}

describe('Governance Contract: no new raw colors in UI scope', () => {
  it('keeps raw color usage at or below baseline', () => {
    const files = collectScopedFiles(UI_SCOPE_DIR);
    expect(files.length, `Expected UI scope at ${UI_SCOPE_DIR} to contain source files.`).toBeGreaterThan(0);

    let rgbaRgbCount = 0;
    let hexCount = 0;

    for (const file of files) {
      const sourceText = fs.readFileSync(file, 'utf-8');
      const counts = countRawColors(sourceText);
      rgbaRgbCount += counts.rgbaRgbCount;
      hexCount += counts.hexCount;
    }

    expect(
      rgbaRgbCount,
      `rgba/rgb raw colors increased above baseline (${BASELINE_RGBA_RGB}); current=${rgbaRgbCount}`
    ).toBeLessThanOrEqual(BASELINE_RGBA_RGB);
    expect(hexCount, `hex raw colors increased above baseline (${BASELINE_HEX}); current=${hexCount}`).toBeLessThanOrEqual(
      BASELINE_HEX
    );
  });
});
