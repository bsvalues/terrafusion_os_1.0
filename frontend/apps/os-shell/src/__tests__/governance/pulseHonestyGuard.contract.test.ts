/**
 * Pulse Honesty Guard — governance contract test.
 * ═══════════════════════════════════════════════════════════════
 *
 * Protects the truth layer. Every Pulse provider under
 * `services/pulse/providers/` is statically inspected and MUST satisfy the
 * honesty rules below. Providers are discovered dynamically, so a NEW provider
 * is automatically guarded — it cannot opt out.
 *
 * A provider that violates any rule fails CI:
 *   1. No sample / demo / fixture / mock / placeholder data.
 *   2. No fabricated "confidence".
 *   3. No default counts disguised as live values (`count: 0`).
 *   4. Must expose an explicit gap path (`pulseUnavailable(`).
 *   5. No fallback disguised as a live value: a catch / failure path must
 *      resolve to `pulseUnavailable`, never `pulseLive`.
 *
 * Why this exists: as providers multiply (certification, appeals, exemptions,
 * notices, sales, …) it becomes tempting to return `count: 0` / `level: stable`
 * when a source fails. That silently turns a gap into a false "all good" and
 * destroys trust. This guard makes that a build failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const PROVIDERS_DIR = path.resolve(__dirname, '../../services/pulse/providers');

/** Tokens that must never appear in a provider source file. */
const FORBIDDEN_TOKENS = [
  'isSampleData',
  'SAMPLE_',
  'DEMO_',
  'FIXTURE_',
  'DemoDataBanner',
  'mockData',
  'placeholderData',
  'confidence',
  'count: 0',
  'count:0',
];

function listProviderFiles(): string[] {
  if (!fs.existsSync(PROVIDERS_DIR)) return [];
  return fs
    .readdirSync(PROVIDERS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.d.ts'));
}

/** Extract the body of each `catch { ... }` block via brace matching. */
function extractCatchBlocks(src: string): string[] {
  const blocks: string[] = [];
  let cursor = src.indexOf('catch');
  while (cursor !== -1) {
    const open = src.indexOf('{', cursor);
    if (open === -1) break;
    let depth = 0;
    let i = open;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    blocks.push(src.slice(open, i));
    cursor = src.indexOf('catch', i);
  }
  return blocks;
}

describe('Pulse Honesty Guard', () => {
  const files = listProviderFiles();

  it('discovers at least one Pulse provider to guard', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(`provider: ${file}`, () => {
      const src = fs.readFileSync(path.join(PROVIDERS_DIR, file), 'utf-8');

      it('exposes an explicit gap path (pulseUnavailable)', () => {
        expect(src).toContain('pulseUnavailable(');
      });

      it('contains no sample/demo/fixture/fabrication tokens', () => {
        for (const token of FORBIDDEN_TOKENS) {
          expect(src.includes(token), `${file} must not contain "${token}"`).toBe(false);
        }
      });

      it('never returns a live value from a catch / failure path', () => {
        for (const block of extractCatchBlocks(src)) {
          expect(block.includes('pulseLive'), `${file}: a catch block returns pulseLive`).toBe(
            false
          );
          expect(
            block.includes('pulseUnavailable'),
            `${file}: a catch block must return pulseUnavailable`
          ).toBe(true);
        }
      });
    });
  }
});
