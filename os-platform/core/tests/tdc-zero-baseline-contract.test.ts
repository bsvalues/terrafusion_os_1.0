import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CI-level TDC zero-baseline contract enforcement.
 *
 * This test reads the ratchet and compliance contracts produced by
 * `pnpm tdc:ui:tokens` and fails if either reports any violations.
 * It acts as a constitutional backstop — even if individual leak-guard
 * tests are deleted, this test catches any regression to non-zero.
 */
describe('TDC zero-baseline contract', () => {
  const root = path.resolve(__dirname, '../../..');

  it('ratchet contract reports 0 current violations', () => {
    const ratchetPath = path.join(root, 'ui-token-ratchet.contract.json');
    expect(fs.existsSync(ratchetPath), `Missing ratchet contract: ${ratchetPath}`).toBe(true);

    const ratchet = JSON.parse(fs.readFileSync(ratchetPath, 'utf8'));
    expect(ratchet.ok, 'Ratchet contract should be ok').toBe(true);
    expect(ratchet.baselineViolationCount, 'Ratchet baseline must be 0').toBe(0);
    expect(ratchet.currentViolationCount, 'Ratchet current violations must be 0').toBe(0);
  });

  it('compliance contract reports 0 violations', () => {
    const compliancePath = path.join(root, 'ui-token-compliance.contract.json');
    expect(
      fs.existsSync(compliancePath),
      `Missing compliance contract: ${compliancePath}`
    ).toBe(true);

    const compliance = JSON.parse(fs.readFileSync(compliancePath, 'utf8'));
    expect(compliance.ok, 'Compliance contract should be ok').toBe(true);
    expect(compliance.violationCount, 'Compliance violations must be 0').toBe(0);
    expect(compliance.violations, 'Compliance violations array must be empty').toHaveLength(0);
  });
});
