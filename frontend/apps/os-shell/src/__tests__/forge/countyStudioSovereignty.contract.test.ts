import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(relPath: string): string {
  return readFileSync(resolve(import.meta.dirname, relPath), 'utf-8');
}

describe('County Studio sovereignty contract', () => {
  it('mounted County Studio frontend requires county scope for studies and sends county-scoped headers', () => {
    const scope = read('../../pages/forge/county-studio/countyStudyScope.ts');
    const api = read('../../pages/forge/county-studio/countyStudyApi.ts');
    const dialog = read('../../pages/forge/county-studio/components/OpenStudyDialog.tsx');

    expect(scope).toContain('buildCountyScopedSessionHeaders');
    expect(api).toContain('requireCountyStudyScope');
    expect(api).toContain('withCountyStudyHeaders');
    expect(api).toContain('studies?countyId=');
    expect(api).toContain('County Studio cannot create studies outside the active county scope.');
    expect(dialog).not.toContain("countyId: 'benton'");
    expect(dialog).toContain('County scope required before County Studio can load studies.');
  });

  it('mounted County Studio create flows map UI-only enums to the governed backend contract', () => {
    const api = read('../../pages/forge/county-studio/countyStudyApi.ts');
    const studyDialog = read('../../pages/forge/county-studio/components/OpenStudyDialog.tsx');
    const cohortDialog = read('../../pages/forge/county-studio/components/CohortCreationDialog.tsx');
    const worksheet = read('../../pages/forge/county-studio/components/ScenarioWorksheet.tsx');
    const support = read('../../pages/forge/county-studio/countyStudioCreationSupport.ts');

    expect(api).toContain('function mapStudyType');
    expect(api).toContain('function mapSelectionType');
    expect(api).toContain('function mapScenarioAdjustment');
    expect(api).toContain("case 'Manual':");
    expect(api).toContain("return 'Manual';");
    expect(support).toContain('UNSUPPORTED_ADJUSTMENT_TYPES');
    expect(support).toContain("'CustomFormula'");
    expect(support).toContain('Custom formula scenarios are intentionally hidden until a governed formula contract exists.');
    expect(studyDialog).not.toContain('EquityStudy');
    expect(studyDialog).not.toContain('CustomStudy');
    expect(cohortDialog).toContain('Manual parcel list');
    expect(cohortDialog).toContain("source: 'manual-parcel-list'");
    expect(worksheet).not.toContain('CustomFormula');
  });

  it('backend controller and hub reject out-of-scope study resources instead of trusting raw ids', () => {
    const controller = read('../../../../../../backend/src/TerraFusion.API/Controllers/CountyStudyController.cs');
    const hub = read('../../../../../../backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs');

    expect(controller).toContain('ResolveCountyScopeAsync');
    expect(controller).toContain('EnsureStudyScopeAsync');
    expect(controller).toContain('EnsureSegmentScopeAsync');
    expect(controller).toContain('EnsureScenarioScopeAsync');
    expect(controller).toContain('County Studio cannot list studies outside the active county scope.');
    expect(controller).toContain('County scope required.');
    expect(hub).toContain('EnsureStudyAccessAsync');
    expect(hub).toContain('County scope required.');
    expect(hub).toContain('Study not available for active county scope.');
  });

  it('County Studio still hands parcel-level work off to Atlas and Property Workbench with valuation context', () => {
    const page = read('../../pages/forge/county-studio/CountyStudyPage.tsx');
    const inspector = read('../../pages/forge/county-studio/components/ObjectInspector.tsx');

    expect(page).toContain('new URLSearchParams');
    expect(page).toContain('studyId: activeStudy.studyId');
    expect(page).toContain('countyId: activeStudy.countyId');
    expect(page).toContain("window.open(`/forge/atlas-live?${params.toString()}`, '_blank', 'noopener,noreferrer')");
    expect(inspector).toContain("activateModule('property-workbench'");
    expect(inspector).toContain('metadata: {');
    expect(inspector).toContain('segmentId: seg.segmentId');
    expect(inspector).toContain('countyId: activeStudy?.countyId');
    expect(inspector).toContain('studyId: activeStudy?.studyId');
    expect(inspector).toContain('taxYear: activeStudy?.taxYear');
    expect(inspector).toContain('neighborhoodCode: segmentNeighborhoodCode');
    expect(inspector).toContain('revalArea: segmentRevalArea');
    expect(inspector).not.toContain('city: activeStudy');
    expect(inspector).toContain('countyId:      context.countyId');
    expect(inspector).toContain('countyId:         context.countyId');
  });
});
