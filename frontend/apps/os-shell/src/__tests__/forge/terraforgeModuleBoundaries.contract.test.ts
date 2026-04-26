import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(relPath: string): string {
  return readFileSync(resolve(import.meta.dirname, relPath), 'utf-8');
}

describe('TerraForge module boundaries contract', () => {
  it('freezes County Studio, Statistics Studio, and GeoForge into separate product lanes', () => {
    const suiteHome = read('../../pages/suites/ForgeSuiteHome.tsx');

    expect(suiteHome).toContain('County-wide metrics and IAAO diagnostics');
    expect(suiteHome).toContain('without map-first drilldown or scenario publishing');
    expect(suiteHome).toContain('County-wide cost approach');
    expect(suiteHome).toContain('County-wide sales comparison');
    expect(suiteHome).toContain('Sale qualification & ratio audit');
  });

  it('keeps parcel-level action in the workbench lane instead of suite-home cards', () => {
    const suiteHomeContract = read('./forgeSuiteHome.contract.test.tsx');

    expect(suiteHomeContract).toContain('does not render ComparableSales as a standalone card');
    expect(suiteHomeContract).toContain('does not render Reconciliation card');
    expect(suiteHomeContract).toContain('does not render Value Audit card');
    expect(suiteHomeContract).toContain('does not render RatioStudyPanel');
  });
});
