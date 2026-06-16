import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getTerraForgeCanonicalInventory } from '../../pages/suites/terraforgeCanonicalInventory';

function read(relPath: string): string {
  return readFileSync(resolve(import.meta.dirname, relPath), 'utf-8');
}

describe('TerraForge module boundaries contract', () => {
  it('freezes /forge as the TerraForge Suite surface instead of County Studio or Statistics Studio', () => {
    const inventory = getTerraForgeCanonicalInventory();
    const primaryLabels = inventory
      .filter((capability) => capability.tier === 'primary')
      .map((capability) => capability.label);
    const supportLabels = inventory
      .filter((capability) => capability.tier !== 'primary')
      .map((capability) => capability.label);

    expect(primaryLabels).toContain('CostForge');
    expect(primaryLabels).toContain('CompsForge');
    expect(primaryLabels).toContain('SalesForge');
    expect(primaryLabels).toContain('IncomeForge');
    expect(primaryLabels).toContain('Reconciliation');
    expect(primaryLabels).toContain('Calibration / QC');
    expect(primaryLabels).toContain('CAMA Characteristics');
    expect(primaryLabels).toContain('Valuation Notes / Defensibility');
    expect(supportLabels).toContain('County Studio');
    expect(primaryLabels).not.toContain('County Studio');
    expect(inventory.map((capability) => capability.label)).not.toContain('Statistics Studio');
  });

  it('keeps parcel-level action in the workbench lane instead of suite-home cards', () => {
    const suiteHomeContract = read('./forgeSuiteHome.contract.test.tsx');

    expect(suiteHomeContract).toContain('does not render ComparableSales as a standalone card');
    expect(suiteHomeContract).toContain('Reconciliation only as a primary canonical lane');
    expect(suiteHomeContract).toContain('does not render Value Audit card');
    expect(suiteHomeContract).toContain('does not render RatioStudyPanel');
  });
});
