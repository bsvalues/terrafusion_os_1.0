import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Chart Viz Permit Guard
 *
 * Keeps the 3 intentional chart hex values in colors.ts bounded:
 *  1. Only approved chart hex are allowed
 *  2. Each must carry a "chart-viz" permit comment on the same line
 *  3. Total hex count must not exceed 3
 */

const COLORS_PATH = resolve(__dirname, '../colors.ts');

/** Only these chart colors may remain as hex. */
const ALLOWED_CHART_HEX = new Set(['#8b5cf6', '#f97316', '#6366f1']);

describe('Permit guard — chart viz hex in colors.ts', () => {
  const raw = readFileSync(COLORS_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);

  it('only allows the 3 approved chart hex values and requires a chart-viz comment', () => {
    const failures: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/#[0-9a-fA-F]{6}\b/g);
      if (!matches) continue;

      for (const hex of matches) {
        const lower = hex.toLowerCase();
        const okHex = ALLOWED_CHART_HEX.has(lower);
        const hasPermit = line.toLowerCase().includes('chart-viz');

        if (!okHex) {
          failures.push(`Line ${i + 1}: unapproved hex ${hex}`);
        } else if (!hasPermit) {
          failures.push(`Line ${i + 1}: approved hex ${hex} missing /* chart-viz */ permit`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('does not exceed 3 chart hex occurrences total', () => {
    const count = [...raw.toLowerCase().matchAll(/#[0-9a-f]{6}\b/g)].length;

    expect(count).toBeLessThanOrEqual(3);
  });
});
