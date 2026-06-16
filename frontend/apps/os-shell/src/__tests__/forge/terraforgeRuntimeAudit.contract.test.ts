import { describe, expect, it } from 'vitest';
import { isModuleRegistered } from '../../config/moduleComponents';
import { getTerraForgeCanonicalInventory } from '../../pages/suites/terraforgeCanonicalInventory';
import {
  getTerraForgeRuntimeAudit,
  type TerraForgeRuntimeAuditEntry,
} from '../../pages/suites/terraforgeRuntimeAudit';

const byId = (entries: readonly TerraForgeRuntimeAuditEntry[], id: string) => {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new Error(`Missing TerraForge runtime audit entry: ${id}`);
  }
  return entry;
};

describe('TerraForge app-by-app runtime audit contract', () => {
  it('covers every canonical TerraForge capability and no non-canonical extras', () => {
    const canonicalIds = getTerraForgeCanonicalInventory().map((capability) => capability.id);
    const auditIds = getTerraForgeRuntimeAudit().map((entry) => entry.id);

    expect(auditIds).toEqual(canonicalIds);
    expect(auditIds).not.toContain('terra-gama');
    expect(auditIds).not.toContain('workbench-forge');
  });

  it('requires every launchable suite app to resolve through the module registry', () => {
    const launchable = getTerraForgeRuntimeAudit().filter((entry) => entry.launchableFromSuite);

    expect(launchable.map((entry) => entry.id)).toEqual([
      'costforge',
      'compsforge',
      'salesforge',
      'calibration-qc',
      'county-studio',
    ]);

    for (const entry of launchable) {
      expect(entry.moduleId, `${entry.id} must declare a moduleId`).toBeTruthy();
      expect(isModuleRegistered(entry.moduleId!), `${entry.id} module is not registered`).toBe(true);
    }
  });

  it('records IncomeForge as the current suite launch gap instead of silently claiming runtime proof', () => {
    const incomeForge = byId(getTerraForgeRuntimeAudit(), 'incomeforge');

    expect(incomeForge.auditStatus).toBe('fail');
    expect(incomeForge.launchableFromSuite).toBe(false);
    expect(incomeForge.moduleId).toBe('income-forge');
    expect(isModuleRegistered(incomeForge.moduleId)).toBe(false);
    expect(incomeForge.blocker).toMatch(/module registry/i);
    expect(incomeForge.runtimePaths).toContain('/costforge/income-approach/cap-rates');
  });

  it('keeps Workbench and parcel-scoped support out of suite runtime proof', () => {
    for (const entry of getTerraForgeRuntimeAudit()) {
      expect(entry.proofSurface).not.toBe('workbench');
      expect(entry.route).not.toMatch(/^\/property\//);
      expect(entry.runtimePaths.every((path) => !path.startsWith('/property/'))).toBe(true);
    }
  });

  it('marks not-yet-exposed primary lanes as honest unavailable, not active proof', () => {
    const audit = getTerraForgeRuntimeAudit();

    for (const id of ['reconciliation', 'cama-characteristics', 'valuation-notes-defensibility']) {
      const entry = byId(audit, id);
      expect(entry.auditStatus).toBe('not-exposed');
      expect(entry.launchableFromSuite).toBe(false);
      expect(entry.runtimeSurface).toBe('suite-card-only');
    }
  });
});