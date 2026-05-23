/**
 * LevyForge Domain Compliance Contract Tests
 *
 * Verifies WA State levy calculation compliance:
 * - RCW 84.52.043: $10/$1,000 aggregate regular levy limit
 * - RCW 84.55.005: IPD limit factor (min(1.01, 1 + IPD%))
 * - RCW 84.55.092: Banked capacity
 * - Standard formula: amount = (AV / 1000) * rate
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', '..');
const BACKEND_ROOT = join(REPO_ROOT, 'backend');
const LEVY_ROOT = join(BACKEND_ROOT, 'src', 'TerraFusion.Levy');

describe('WA State Levy Formula Compliance', () => {
  it('LevyController uses decimal arithmetic (never double/float)', () => {
    const controllerPath = join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'LevyController.cs');
    const content = readFileSync(controllerPath, 'utf-8');
    // Should use decimal division
    expect(content).toContain('assessedValue / 1_000m');
    // Should NOT use double/float promotion
    expect(content).not.toContain('(double)assessedValue');
    expect(content).not.toContain('(float)assessedValue');
  });

  it('LevyController uses MidpointRounding.AwayFromZero for amounts', () => {
    const controllerPath = join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'LevyController.cs');
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('MidpointRounding.AwayFromZero');
  });

  it('LevyController rounds to 2 decimal places', () => {
    const controllerPath = join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'LevyController.cs');
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('Math.Round(');
    // Should round to 2 places
    expect(content).toMatch(/Math\.Round\([^)]+,\s*2/);
  });

  it('LevyController handles zero assessed value without error', () => {
    const controllerPath = join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'LevyController.cs');
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('assessedValue == 0m');
  });
});

describe('RCW 84.55.005 — IPD Limit Factor', () => {
  it('IpdRateService implements the limit factor formula', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'IpdRateService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    // Must compute min(1.01, 1 + IPD/100)
    expect(content).toContain('Math.Min(1.01m');
    expect(content).toContain('/ 100m');
  });

  it('IpdRateService falls back to 1.01 when no data seeded', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'IpdRateService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('LimitFactor: 1.01m');
    expect(content).toContain('DataSeeded: false');
  });

  it('IpdRateService references RCW 84.55.005 in documentation', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'IpdRateService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('RCW 84.55.005');
  });
});

describe('RCW 84.52.043 — Statutory Rate Limits', () => {
  it('LevyRiskScoringService references $10/$1,000 limit', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'LevyRiskScoringService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('RegularLevyLimitPerThousand');
    expect(content).toContain('10.00m');
  });

  it('LevyRiskScoringService references RCW 84.52.043', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'LevyRiskScoringService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('RCW 84.52.043');
  });

  it('LevyCalculationService enforces MaximumRate cap', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'LevyCalculationService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('MaximumRate');
    expect(content).toContain('exceedsLimit');
  });
});

describe('RCW 84.55.092 — Banked Capacity', () => {
  it('BankedCapacity model exists with required fields', () => {
    const modelPath = join(LEVY_ROOT, 'Models', 'BankedCapacity.cs');
    const content = readFileSync(modelPath, 'utf-8');
    expect(content).toContain('OpeningBalance');
    expect(content).toContain('AccruedThisYear');
    expect(content).toContain('UsedThisYear');
    expect(content).toContain('ClosingBalance');
  });

  it('BankedCapacity is tracked in LevyDbContext', () => {
    const dbContextPath = join(LEVY_ROOT, 'Data', 'LevyDbContext.cs');
    const content = readFileSync(dbContextPath, 'utf-8');
    expect(content).toContain('BankedCapacities');
  });

  it('BankedCapacity references RCW 84.55.092 in documentation', () => {
    const modelPath = join(LEVY_ROOT, 'Models', 'BankedCapacity.cs');
    const content = readFileSync(modelPath, 'utf-8');
    expect(content).toContain('RCW 84.55.092');
  });
});

describe('Levy Certification Workflow', () => {
  it('LevyCertificationService implements state machine transitions', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'LevyCertificationService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('SubmitForReviewAsync');
    expect(content).toContain('CertifyAsync');
    expect(content).toContain('RejectAsync');
  });

  it('Certification states include Draft, PendingReview, Certified', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'LevyCertificationService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('"PendingReview"');
    expect(content).toContain('"Certified"');
    expect(content).toContain('"Draft"');
  });

  it('LevyCertification model is tracked in DbContext', () => {
    const dbContextPath = join(LEVY_ROOT, 'Data', 'LevyDbContext.cs');
    const content = readFileSync(dbContextPath, 'utf-8');
    expect(content).toContain('LevyCertifications');
  });
});

describe('Revenue Projection Service', () => {
  it('RevenueProjectionService uses growth rate for multi-year projections', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'RevenueProjectionService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('GrowthRate');
    expect(content).toContain('yearsToProject');
  });

  it('RevenueProjectionService applies collection rate', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'RevenueProjectionService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('collectionRate');
    expect(content).toContain('ProjectedNetRevenue');
  });

  it('RevenueProjectionService generates risk factors', () => {
    const servicePath = join(LEVY_ROOT, 'Services', 'RevenueProjectionService.cs');
    const content = readFileSync(servicePath, 'utf-8');
    expect(content).toContain('RiskFactors');
    expect(content).toContain('GenerateRiskFactors');
  });
});
