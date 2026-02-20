import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * WCAG-Print Permit Guard — DataScienceLaboratory.css
 *
 * Only #000000 and #ffffff are allowed as raw hex, and only inside
 * high-contrast / print media queries with a "wcag-print" permit
 * comment on the same line.
 */

const CSS_PATH = resolve(
  __dirname,
  '../../../applications/terra-levy/components/analytics/DataScienceLaboratory.css'
);

/** Only these WCAG-mandated hex values may remain. */
const WCAG_HEX = new Set(['#000000', '#ffffff', '#000', '#fff']);

describe('Permit guard — wcag-print hex in DataScienceLaboratory.css', () => {
  const raw = readFileSync(CSS_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);

  it('rejects any hex that is not a WCAG literal', () => {
    const failures: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (!matches) continue;

      for (const hex of matches) {
        if (!WCAG_HEX.has(hex.toLowerCase())) {
          failures.push(`Line ${i + 1}: non-WCAG hex ${hex}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('requires /* wcag-print */ permit comment on every WCAG hex line', () => {
    const failures: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (!matches) continue;

      for (const hex of matches) {
        if (!WCAG_HEX.has(hex.toLowerCase())) continue;
        if (!line.includes('wcag-print')) {
          failures.push(`Line ${i + 1}: WCAG hex ${hex} missing /* wcag-print */ permit`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('does not exceed 10 WCAG hex occurrences total', () => {
    const count = [...raw.toLowerCase().matchAll(/#(?:000000|ffffff|000|fff)\b/g)].length;
    expect(count).toBeLessThanOrEqual(10);
  });
});
