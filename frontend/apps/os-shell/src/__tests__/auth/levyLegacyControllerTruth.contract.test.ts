/**
 * Levy legacy controller truth contract
 *
 * @vitest-environment jsdom
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

describe('Levy legacy controller truth contract', () => {
  it('legacy glossary controller is explicit compatibility mode instead of fake 200 stub content', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/GlossaryController.cs');

    expect(src).toContain('StatusCodes.Status501NotImplemented');
    expect(src).toContain('status = "unavailable"');
    expect(src).toContain('/api/levy/v1/ipd-rates');
    expect(src).not.toContain('status = "stub"');
    expect(src).not.toContain('Glossary terms not yet implemented.');
  });

  it('historical analysis controller now reads real levy history instead of returning stubs', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/HistoricalAnalysisController.cs');

    expect(src).toContain('LevyDbContext');
    expect(src).toContain('source = "LevyRates + LevyCertifications"');
    expect(src).toContain('source = "LevyRates"');
    expect(src).toContain('thresholdPct');
    expect(src).not.toContain('status = "stub"');
    expect(src).not.toContain('Historical statistics not yet implemented.');
    expect(src).not.toContain('Trend analysis not yet implemented.');
    expect(src).not.toContain('Anomaly detection not yet implemented.');
  });

  it('legacy property assessment controller bridges validate and valuate to the levy service', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/PropertyAssessmentController.cs');

    expect(src).toContain('ILevyPropertyAssessmentService');
    expect(src).toContain('ValidatePropertyAsync');
    expect(src).toContain('CalculateValueAsync');
    expect(src).toContain('StatusCodes.Status501NotImplemented');
    expect(src).toContain('/api/levy/v1/property-assessment/verify-compliance');
    expect(src).not.toContain('status = "stub"');
    expect(src).not.toContain('Assessment validation not yet implemented.');
    expect(src).not.toContain('Valuation calculation not yet implemented.');
  });

  it('legacy tax strategy controller no longer returns fake scenario-planning success', () => {
    const src = readRepoFile('backend/src/TerraFusion.API/Controllers/TaxStrategyController.cs');

    expect(src).toContain('StatusCodes.Status501NotImplemented');
    expect(src).toContain('/levy/scenarios/analyze');
    expect(src).toContain('/levy/scenarios/compare');
    expect(src).toContain('/api/levy/forecast/dashboard');
    expect(src).not.toContain('status = "stub"');
    expect(src).not.toContain('Decision tree not yet implemented.');
    expect(src).not.toContain('Path analysis not yet implemented.');
    expect(src).not.toContain('Scenario creation not yet implemented.');
  });

  it('live levy calculation service is deterministic compatibility mode, not quantum/championship theater', () => {
    const serviceSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/LevyCalculationService.cs');
    const interfaceSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/ILevyCalculationService.cs');
    const programSrc = readRepoFile('backend/src/TerraFusion.API/Program.cs');

    expect(interfaceSrc).not.toContain('Government. Transcended.');
    expect(interfaceSrc).not.toContain('factor 949');
    expect(serviceSrc).not.toContain('QUANTUM_FACTOR');
    expect(serviceSrc).not.toContain('TARGET_ACCURACY');
    expect(serviceSrc).not.toContain('Quantum-optimized rate with championship accuracy');
    expect(serviceSrc).toContain('governedOptimizationAvailable');
    expect(serviceSrc).toContain('optimizationMode');
    expect(serviceSrc).toContain('QuantumOptimized = false');
    expect(programSrc).toContain('useQuantumOptimization: false');
  });

  it('live levy revenue projection service no longer claims quantum forecasting or target-accuracy theater', () => {
    const serviceSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/RevenueProjectionService.cs');
    const interfaceSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/IRevenueProjectionService.cs');
    const programSrc = readRepoFile('backend/src/TerraFusion.API/Program.cs');

    expect(interfaceSrc).not.toContain('Government. Transcended.');
    expect(serviceSrc).not.toContain('QUANTUM_FACTOR');
    expect(serviceSrc).not.toContain('TARGET_ACCURACY');
    expect(serviceSrc).toContain('comparisonMode');
    expect(serviceSrc).toContain('governedOptimizationAvailable');
    expect(serviceSrc).toContain('AiProjectedRevenue = projectedRevenue');
    expect(programSrc).toContain('useQuantumForecasting: false');
  });

  it('levy data quality and property assessment compatibility services use honest compatibility wording', () => {
    const dataQualitySrc = readRepoFile('backend/src/TerraFusion.Levy/Services/LevyDataQualityService.cs');
    const dataQualityInterfaceSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/ILevyDataQualityService.cs');
    const propertyAssessmentSrc = readRepoFile('backend/src/TerraFusion.Levy/Services/LevyPropertyAssessmentService.cs');

    expect(dataQualityInterfaceSrc).toContain('compatibility');
    expect(dataQualitySrc).toContain('compatibility_default_recommendations');
    expect(dataQualitySrc).toContain('compatibility_no_live_metrics');
    expect(dataQualitySrc).not.toContain('placeholder_default_recommendations');
    expect(propertyAssessmentSrc).toContain('contract compatibility only');
    expect(propertyAssessmentSrc).not.toContain('zero placeholder pending data wiring');
  });
});
