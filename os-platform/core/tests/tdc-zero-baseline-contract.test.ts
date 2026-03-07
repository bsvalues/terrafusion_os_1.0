import fs from 'node:fs';
import path from 'node:path';

/**
 * CI-level TDC ratchet contract enforcement.
 *
 * This test reads the ratchet and compliance contracts produced by
 * `pnpm tdc:ui:tokens` and verifies:
 *
 * 1. The ratchet is healthy: current violations ≤ baseline (no regressions).
 * 2. The compliance contract exists and is consistent with the ratchet.
 * 3. Violations are monotonically decreasing (ratchet never loosens).
 *
 * The ratchet prevents new raw-color introductions while allowing gradual
 * remediation of legacy violations. See tools/reports/tdc_violation_inventory.json
 * for the full violation classification.
 */
describe('TDC ratchet contract', () => {
  const root = path.resolve(__dirname, '../../..');

  it('ratchet contract is healthy (current ≤ baseline)', () => {
    const ratchetPath = path.join(root, 'ui-token-ratchet.contract.json');
    expect(fs.existsSync(ratchetPath), `Missing ratchet contract: ${ratchetPath}`).toBe(true);

    const ratchet = JSON.parse(fs.readFileSync(ratchetPath, 'utf8'));
    expect(ratchet.ok, 'Ratchet contract should be ok').toBe(true);
    expect(
      ratchet.currentViolationCount,
      `Ratchet regression: current (${ratchet.currentViolationCount}) must be ≤ baseline (${ratchet.baselineViolationCount})`
    ).toBeLessThanOrEqual(ratchet.baselineViolationCount);
  });

  it('compliance contract exists and is consistent', () => {
    const compliancePath = path.join(root, 'ui-token-compliance.contract.json');
    expect(
      fs.existsSync(compliancePath),
      `Missing compliance contract: ${compliancePath}`
    ).toBe(true);

    const compliance = JSON.parse(fs.readFileSync(compliancePath, 'utf8'));
    expect(compliance.violationCount, 'Compliance violation count must be a number').toBeTypeOf('number');
    expect(
      Array.isArray(compliance.violations),
      'Compliance violations must be an array'
    ).toBe(true);
    expect(
      compliance.violations.length,
      'Violations array length must match violationCount'
    ).toBe(compliance.violationCount);
  });

  it('baseline matches current snapshot (re-run pnpm tdc:ui:tokens if stale)', () => {
    const baselinePath = path.join(root, 'ui-token-baseline.json');
    const ratchetPath = path.join(root, 'ui-token-ratchet.contract.json');
    expect(fs.existsSync(baselinePath), `Missing baseline: ${baselinePath}`).toBe(true);

    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const ratchet = JSON.parse(fs.readFileSync(ratchetPath, 'utf8'));

    expect(
      baseline.scopeHash,
      'Baseline scope hash must match ratchet scope hash (re-run pnpm tdc:ui:tokens)'
    ).toBe(ratchet.scopeHash);
  });
});
