import { describe, expect, it } from 'vitest';
import { isModuleRegistered } from '../../config/moduleComponents';
import { getTerraForgeCanonicalInventory } from '../../pages/suites/terraforgeCanonicalInventory';
import {
  getTerraForgeProductionMatrix,
  type TerraForgeProductionMatrixEntry,
} from '../../pages/suites/terraforgeProductionMatrix';

const forbiddenPacsRuntimeUi = /\bPACS\b|\bPacs\b|pacs_/;

function byId(entries: readonly TerraForgeProductionMatrixEntry[], id: string): TerraForgeProductionMatrixEntry {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new Error(`Missing TerraForge production matrix entry: ${id}`);
  }
  return entry;
}

describe('TerraForge production matrix proof contract', () => {
  it('covers the canonical TerraForge inventory exactly', () => {
    const canonicalIds = getTerraForgeCanonicalInventory().map((capability) => capability.id);
    const matrixIds = getTerraForgeProductionMatrix().map((entry) => entry.id);

    expect(matrixIds).toEqual(canonicalIds);
    expect(matrixIds).not.toContain('workbench-forge');
    expect(matrixIds).not.toContain('terra-gama');
  });

  it('requires authenticated public browser proof for every primary capability', () => {
    const matrix = getTerraForgeProductionMatrix();
    const primaryIds = getTerraForgeCanonicalInventory()
      .filter((capability) => capability.tier === 'primary')
      .map((capability) => capability.id);

    expect(primaryIds).toEqual([
      'costforge',
      'compsforge',
      'salesforge',
      'incomeforge',
      'reconciliation',
      'calibration-qc',
      'cama-characteristics',
      'valuation-notes-defensibility',
    ]);

    for (const id of primaryIds) {
      const entry = byId(matrix, id);
      expect(entry.proofMode, id).toBe('authenticated-public-browser-smoke');
      expect(entry.proofStatus, id).toBe('requires-public-smoke');
      expect(entry.route, id).toBe('/forge');
      expect(entry.proofSurface, id).toBe('suite');
      expect(entry.runtimeAuditStatus, id).toBe('runtime-backed');
      expect(entry.launchableFromSuite, id).toBe(true);
      expect(entry.moduleId, id).toBeTruthy();
      expect(isModuleRegistered(entry.moduleId!), id).toBe(true);
      expect(entry.runtimePaths.length, id).toBeGreaterThan(0);
      expect(entry.endpointOnlyProofAllowed, id).toBe(false);
      expect(entry.workbenchProofAllowed, id).toBe(false);
      expect(entry.requiredEvidence.join('\n'), id).toMatch(/authenticated public production session/);
    }
  });

  it('keeps support and deferred tools out of primary production proof', () => {
    const matrix = getTerraForgeProductionMatrix();
    const supportOrDeferred = matrix.filter((entry) => entry.tier !== 'primary');

    expect(supportOrDeferred.map((entry) => entry.id)).toEqual([
      'batch-cost-runs',
      'regression-studio',
      'county-studio',
      'coefficient-preview',
      'current-use-support',
    ]);

    for (const entry of supportOrDeferred) {
      expect(entry.proofMode, entry.id).toBe('support-or-deferred-disclosure');
      expect(entry.proofStatus, entry.id).toBe('not-primary-proof');
      expect(entry.proofSurface, entry.id).toBe('support');
      expect(entry.endpointOnlyProofAllowed, entry.id).toBe(false);
      expect(entry.workbenchProofAllowed, entry.id).toBe(false);
      expect(entry.requiredEvidence.join('\n'), entry.id).toMatch(/not counted as primary/i);
    }
  });

  it('does not allow endpoint-only, Workbench, parcel-route, or PACS-facing proof leakage', () => {
    for (const entry of getTerraForgeProductionMatrix()) {
      expect(entry.endpointOnlyProofAllowed, entry.id).toBe(false);
      expect(entry.workbenchProofAllowed, entry.id).toBe(false);
      expect(entry.route, entry.id).not.toMatch(/^\/property\//);
      expect(entry.runtimePaths.every((path) => !path.startsWith('/property/')), entry.id).toBe(true);

      const runtimeFacingText = [
        entry.id,
        entry.label,
        entry.route,
        entry.moduleId ?? '',
        ...entry.runtimePaths,
        ...entry.requiredEvidence,
      ].join('\n');
      expect(runtimeFacingText, entry.id).not.toMatch(forbiddenPacsRuntimeUi);
    }
  });
});
