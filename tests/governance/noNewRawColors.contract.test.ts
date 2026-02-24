import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../..');
const FRONTEND_SRC = path.join(ROOT_DIR, 'frontend/apps/os-shell/src');

/**
 * Governance contract: raw color baseline ratchet.
 * This test captures the current count of rgba()/hex violations and
 * prevents the count from INCREASING. As sweep PRs land, lower the
 * baseline to ratchet down over time.
 *
 * To update the baseline after a sweep PR:
 *   1. Run this test with --reporter=verbose
 *   2. Note the "Current count" in the output
 *   3. Update BASELINE_MAX below
 */

// Baseline: set after PR B1 (anchors-only, no sweeps yet)
// Ratchet this DOWN as sweep PRs land.
const RGBA_BASELINE_MAX = 1400;
const HEX_BASELINE_MAX = 1050;

const SOURCE_GLOBS = [
  '**/*.css',
  '**/*.tsx',
  '**/*.ts',
  '**/*.jsx',
  '**/*.js',
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/coverage/**',
  '**/*.d.ts',
];

function countPattern(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function scanFiles(pattern: RegExp): { total: number; files: { file: string; count: number }[] } {
  const files = globSync(SOURCE_GLOBS, {
    cwd: FRONTEND_SRC,
    ignore: IGNORE_PATTERNS,
    absolute: true,
    nodir: true,
  });

  let total = 0;
  const hits: { file: string; count: number }[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const count = countPattern(content, pattern);
    if (count > 0) {
      total += count;
      hits.push({ file: path.relative(ROOT_DIR, filePath), count });
    }
  }

  hits.sort((a, b) => b.count - a.count);
  return { total, files: hits };
}

describe('Governance: No New Raw Colors (Baseline Ratchet)', () => {
  it(`rgba() count must not exceed baseline (${RGBA_BASELINE_MAX})`, () => {
    const result = scanFiles(/\brgba?\(/g);
    console.log(`[ratchet] Current rgba()/rgb() count: ${result.total} (baseline: ${RGBA_BASELINE_MAX})`);
    if (result.total > RGBA_BASELINE_MAX) {
      const top5 = result.files.slice(0, 5).map((f) => `  ${f.count}\t${f.file}`).join('\n');
      expect.fail(
        `rgba() violations increased to ${result.total} (baseline: ${RGBA_BASELINE_MAX}).\n` +
        `Top offenders:\n${top5}\n\n` +
        `Fix: replace raw rgba()/rgb() with hsl(var(--tf-*-hs) L% / alpha) tokens.`
      );
    }
  });

  it(`hex color count must not exceed baseline (${HEX_BASELINE_MAX})`, () => {
    // Match hex colors but exclude CSS custom property declarations and common non-color hex
    const result = scanFiles(/#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g);
    console.log(`[ratchet] Current hex color count: ${result.total} (baseline: ${HEX_BASELINE_MAX})`);
    if (result.total > HEX_BASELINE_MAX) {
      const top5 = result.files.slice(0, 5).map((f) => `  ${f.count}\t${f.file}`).join('\n');
      expect.fail(
        `Hex color violations increased to ${result.total} (baseline: ${HEX_BASELINE_MAX}).\n` +
        `Top offenders:\n${top5}\n\n` +
        `Fix: replace raw hex colors with var(--tf-*) tokens.`
      );
    }
  });

  it('token file must not introduce new raw hex colors', () => {
    const tokensPath = path.join(FRONTEND_SRC, 'styles/terrafusion-tokens.css');
    const content = fs.readFileSync(tokensPath, 'utf-8');

    // Foundation hex section is allowed (lines 7-22 define the source-of-truth hex values)
    // Count hex colors OUTSIDE the foundation section
    const lines = content.split('\n');
    let inFoundation = false;
    let rawHexOutsideFoundation = 0;

    for (const line of lines) {
      if (line.includes('FOUNDATION COLORS')) inFoundation = true;
      if (line.includes('PRIMARY COLORS')) inFoundation = false;

      if (!inFoundation) {
        const hexMatches = line.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
        if (hexMatches) {
          // Allow hex in comments (lines starting with spaces + /*)
          if (!line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
            rawHexOutsideFoundation += hexMatches.length;
          }
        }
      }
    }

    // Baseline: 43 legacy hex values exist outside Foundation (grays, gradients,
    // dark mode, semantic aliases). This ceiling ratchets DOWN as sweeps land.
    // DO NOT raise this number — fix the source instead.
    const TOKEN_HEX_BASELINE = 43;
    expect(
      rawHexOutsideFoundation,
      `Found ${rawHexOutsideFoundation} raw hex colors outside the Foundation section in terrafusion-tokens.css (baseline: ${TOKEN_HEX_BASELINE}). ` +
      `New colors should use HS anchors or Lumin Bridge tokens.`
    ).toBeLessThanOrEqual(TOKEN_HEX_BASELINE);
  });
});
