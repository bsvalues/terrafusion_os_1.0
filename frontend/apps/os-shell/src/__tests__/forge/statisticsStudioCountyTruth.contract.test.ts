import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(relPath: string): string {
  return readFileSync(resolve(import.meta.dirname, relPath), 'utf-8');
}

describe('Statistics Studio county truth contract', () => {
  it('mounted statistics panels require explicit county scope for live queries', () => {
    const studio = read('../../pages/forge/statistics/StatisticsStudio.tsx');
    const stratified = read('../../pages/forge/statistics/StratifiedStudyPanel.tsx');
    const drivers = read('../../pages/forge/statistics/ValueDriverPanel.tsx');
    const scope = read('../../pages/forge/statistics/statisticsCountyScope.ts');

    expect(studio).toContain('getStatisticsCountyScope');
    expect(studio).toContain('enabled: countyScope.isolated');
    expect(studio).toContain('statistics-studio-unavailable');
    expect(studio).toContain('statistics-studio-advanced-unavailable');
    expect(stratified).toContain('countyScope.headers');
    expect(stratified).toContain('countyId=${encodeURIComponent(countyScope.countyId)}');
    expect(stratified).not.toContain('BentonCounty_DOR_StratifiedStudy');
    expect(drivers).toContain('countyScope.headers');
    expect(drivers).toContain('countyId=${encodeURIComponent(countyScope.countyId)}');
    expect(scope).toContain('advancedCertified');
  });

  it('mounted statistics production files no longer hardcode Benton study labels', () => {
    const studio = read('../../pages/forge/statistics/StatisticsStudio.tsx');
    const stratified = read('../../pages/forge/statistics/StratifiedStudyPanel.tsx');
    const drivers = read('../../pages/forge/statistics/ValueDriverPanel.tsx');

    expect(studio).not.toContain('Benton County Ratio Study');
    expect(stratified).not.toContain('BentonCounty');
    expect(drivers).not.toContain('Benton County');
  });

  it('active TerraForge ratio-study endpoints require authenticated canonical county scope', () => {
    const controller = read(
      '../../../../../../backend/src/TerraFusion.API/Controllers/TerraForgeController.cs'
    );

    expect(controller).toContain('[Authorize(Policy = "RequireAssessor")]');
    expect(controller).toContain('TryResolveAuthenticatedCountyScopeAsync');
    expect(controller).toContain('_authenticatedCountyContext');
    expect(controller).toContain('.GetCurrentAsync(cancellationToken)');
    expect(controller).toContain('return (Guid.Empty, Forbid());');
    expect(controller).not.toContain('Request.Headers["x-county-id"]');
    expect(controller).toContain('GetStratifiedRatioStudy(');
    expect(controller).toContain('GetDriverAnalysis(');
    expect(controller).toContain('GetComparisonSnapshots(');
    expect(controller).toContain('s.CountyId == scopedCountyId');
    expect(controller).toContain('p.CountyId == scopedCountyId');
  });
});
