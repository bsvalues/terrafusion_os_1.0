import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(relPath: string): string {
  return readFileSync(resolve(import.meta.dirname, relPath), 'utf-8');
}

describe('CostForge county-scope contract', () => {
  it('mounted CostForge tabs no longer hardcode Benton county ids', () => {
    const triage = read('../../pages/forge/cost/tabs/TriageTab.tsx');
    const audit = read('../../pages/forge/cost/tabs/NeighborhoodAuditTab.tsx');
    const calibration = read('../../pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx');
    const parcel = read('../../pages/forge/cost/CostApproachRunner.tsx');
    const schedule = read('../../pages/forge/cost/CostManual.tsx');
    const depreciation = read('../../pages/forge/cost/DepreciationCalculator.tsx');

    expect(triage).not.toContain('VITE_BENTON_COUNTY_ID');
    expect(audit).not.toContain('VITE_BENTON_COUNTY_ID');
    expect(calibration).not.toContain('VITE_BENTON_COUNTY_ID');
    expect(parcel).not.toContain('VITE_BENTON_COUNTY_ID');
    expect(schedule).not.toContain('VITE_BENTON_COUNTY_ID');
    expect(depreciation).not.toContain('VITE_BENTON_COUNTY_ID');
  });

  it('mounted CostForge production surfaces no longer label the live workspace as Benton-only', () => {
    const workspace = read('../../pages/forge/cost/CostForge.tsx');
    const countyScope = read('../../pages/forge/cost/countyScope.ts');
    const parcel = read('../../pages/forge/cost/CostApproachRunner.tsx');
    const schedule = read('../../pages/forge/cost/CostManual.tsx');
    const depreciation = read('../../pages/forge/cost/DepreciationCalculator.tsx');

    expect(workspace).not.toContain('Benton County');
    expect(parcel).not.toContain('Benton Method');
    expect(schedule).not.toContain('Benton County');
    expect(schedule).not.toContain('Benton Method');
    expect(depreciation).not.toContain('Benton County');
    expect(depreciation).not.toContain('Benton Method');
    expect(workspace).toContain('getCostForgeCountyBadgeLabel');
    expect(countyScope).toContain('County-scoped workspace');
  });

  it('mounted CostForge frontend uses the shared county scope and certified-lane helpers', () => {
    const store = read('../../pages/forge/cost/costForgeWorkspaceStore.ts');
    const triage = read('../../pages/forge/cost/tabs/TriageTab.tsx');
    const audit = read('../../pages/forge/cost/tabs/NeighborhoodAuditTab.tsx');
    const calibration = read('../../pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx');
    const parcel = read('../../pages/forge/cost/CostApproachRunner.tsx');
    const schedule = read('../../pages/forge/cost/CostManual.tsx');
    const depreciation = read('../../pages/forge/cost/DepreciationCalculator.tsx');

    expect(store).toContain('getCostForgeCountyScope');
    expect(triage).toContain('getCostForgeCountyScope');
    expect(audit).toContain('getCostForgeCountyScope');
    expect(calibration).toContain('getCostForgeCountyScope');
    expect(parcel).toContain('getCostForgeCountyScope');
    expect(parcel).toContain('supportsCertifiedCostScheduleLane');
    expect(schedule).toContain('getCostForgeCountyScope');
    expect(schedule).toContain('supportsCertifiedCostScheduleLane');
    expect(depreciation).toContain('getCostForgeCountyScope');
    expect(depreciation).toContain('supportsCertifiedCostScheduleLane');
  });

  it('active CostForge backend routes now require county context and guard certified-only schedule lanes', () => {
    const controller = read('../../../../../../backend/src/TerraFusion.API/Controllers/CostForgeController.cs');

    expect(controller).not.toContain('dev/anonymous fallback for CostForge');
    expect(controller).toContain('GetNeighborhoodCalibrationMatrix(');
    expect(controller).toContain('MassAdjustPreview([FromBody] MassAdjustPreviewRequest req)');
    expect(controller).toContain('GetDashboardStats(');
    expect(controller).toContain('GetNeighborhoodParcels(');
    expect(controller).toContain('return Unauthorized(new { error = "County context required." });');
    expect(controller).toContain('SupportsCertifiedCostScheduleLane');
    expect(controller).toContain('GetImprovementTypeCodes([FromQuery] string? countyId)');
    expect(controller).toContain('GetCostSchedule([FromQuery] string? qualityClass)');
    expect(controller).toContain('ComputeEffectiveAge([FromBody] EffectiveAgeRequest req)');
    expect(controller).toContain('Certified cost schedule lane unavailable for the active county scope.');
  });
});
