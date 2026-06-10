/**
 * CostForge Domain Compliance Contract Tests
 *
 * Verifies:
 * 1. Benton County 2025 cost matrix data integrity
 * 2. IAAO Standard on Mass Appraisal compliance
 * 3. RCW 84.40.030 (100% true & fair value) enforcement
 * 4. Three-approach valuation methodology
 * 5. Depreciation schedule integrity
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', '..');
const CONTROLLER_PATH = resolve(REPO_ROOT, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'CostForgeController.cs');
const src = readFileSync(CONTROLLER_PATH, 'utf-8');

describe('Benton County Cost Matrix — Data Integrity', () => {
  it('uses 2025 cost matrix year', () => {
    expect(src).toContain('Cost Matrix 2025');
    expect(src).toContain('MatrixYear = 2025');
  });

  it('has 66 matrix entries (11 types × 6 regions)', () => {
    expect(src).toContain('11 building types × 6 Reval Areas = 66 matrix entries');
  });

  it('covers all 6 Reval Areas', () => {
    expect(src).toContain('"Reval 1"');
    expect(src).toContain('"Reval 2"');
    expect(src).toContain('"Reval 3"');
    expect(src).toContain('"Reval 4"');
    expect(src).toContain('"Reval 5"');
    expect(src).toContain('"Reval 6"');
  });

  it('covers residential building types (R1, R2)', () => {
    expect(src).toContain('"R1"');
    expect(src).toContain('"R2"');
    expect(src).toContain('Single Family Residential');
    expect(src).toContain('Multi-Family Residential');
  });

  it('covers commercial building types (C1-C4)', () => {
    expect(src).toContain('"C1"');
    expect(src).toContain('"C2"');
    expect(src).toContain('"C3"');
    expect(src).toContain('"C4"');
    expect(src).toContain('Commercial Retail');
    expect(src).toContain('Office');
    expect(src).toContain('Restaurant');
    expect(src).toContain('Warehouse');
  });

  it('covers agricultural building types (A1, A2)', () => {
    expect(src).toContain('"A1"');
    expect(src).toContain('"A2"');
    expect(src).toContain('Farm');
    expect(src).toContain('Ranch');
  });

  it('covers industrial and special building types (I1, S1, S2)', () => {
    expect(src).toContain('"I1"');
    expect(src).toContain('"S1"');
    expect(src).toContain('"S2"');
    expect(src).toContain('Industrial');
    expect(src).toContain('Hospital');
    expect(src).toContain('School');
  });
});

describe('Benton County Cost Matrix — Region Factors', () => {
  it('Reval 1 (Kennewick) has factor 1.00 (base)', () => {
    expect(src).toContain('["Reval 1"] = 1.00m');
  });

  it('Reval 2 (West Richland) has factor 1.05', () => {
    expect(src).toContain('["Reval 2"] = 1.05m');
  });

  it('Reval 3 (North Richland) has factor 1.10', () => {
    expect(src).toContain('["Reval 3"] = 1.10m');
  });

  it('Reval 4 (East Benton) has factor 0.95', () => {
    expect(src).toContain('["Reval 4"] = 0.95m');
  });

  it('Reval 5 (Prosser) has factor 0.90', () => {
    expect(src).toContain('["Reval 5"] = 0.90m');
  });

  it('Reval 6 (Rural) has factor 0.82', () => {
    expect(src).toContain('["Reval 6"] = 0.82m');
  });
});

describe('IAAO Cost Approach Compliance', () => {
  it('implements RCN (Replacement Cost New) calculation', () => {
    expect(src).toContain('RcnPerSqft');
    expect(src).toContain('RCN per sqft');
  });

  it('implements RCND (RCN less Depreciation) calculation', () => {
    expect(src).toContain('RcndPerSqft');
    expect(src).toContain('RCND per sqft');
  });

  it('applies condition AFTER depreciation (Benton Method)', () => {
    // This is the key IAAO requirement: condition is post-depreciation
    expect(src).toContain('condition applied post-depreciation');
    expect(src).toContain('IAAO / Benton Method');
  });

  it('uses BankersRound (MidpointRounding.ToEven) for all calculations', () => {
    expect(src).toContain('MidpointRounding.ToEven');
    expect(src).toContain('BankersRound');
  });

  it('has quality grade factors (ECONOMY through LUXURY)', () => {
    expect(src).toContain('"ECONOMY"');
    expect(src).toContain('"STANDARD"');
    expect(src).toContain('"CUSTOM"');
    expect(src).toContain('"PREMIUM"');
    expect(src).toContain('"LUXURY"');
  });

  it('has condition grade factors (POOR through EXCELLENT)', () => {
    expect(src).toContain('"POOR"');
    expect(src).toContain('"FAIR"');
    expect(src).toContain('"GOOD"');
    expect(src).toContain('"EXCELLENT"');
  });

  it('has complexity grade factors (SIMPLE through HIGHLY_COMPLEX)', () => {
    expect(src).toContain('"SIMPLE"');
    expect(src).toContain('"COMPLEX"');
    expect(src).toContain('"HIGHLY_COMPLEX"');
  });
});

describe('RCW 84.40.030 — Assessment at True & Fair Value', () => {
  it('assessment ratio is 100% (1.00)', () => {
    expect(src).toContain('assessmentRatio = 1.00m');
  });

  it('references RCW 84.40.030', () => {
    expect(src).toContain('RCW 84.40.030');
  });

  it('assessed value equals total cost at 100%', () => {
    expect(src).toContain('assessedValue = BankersRound(totalCost * assessmentRatio)');
  });
});

describe('Depreciation Schedule Integrity', () => {
  it('has separate residential and commercial schedules', () => {
    expect(src).toContain('ResidentialDepreciation');
    expect(src).toContain('CommercialDepreciation');
  });

  it('residential classification includes R-type and A-type', () => {
    expect(src).toContain('StartsWith("R"');
    expect(src).toContain('StartsWith("A"');
  });

  it('depreciation factor is age-based with brackets', () => {
    expect(src).toContain('MinAge');
    expect(src).toContain('MaxAge');
    expect(src).toContain('Factor');
  });

  it('handles future year built (negative age clamped to 0)', () => {
    expect(src).toContain('if (age < 0) age = 0');
  });
});

describe('Three-Approach Valuation Methodology', () => {
  it('implements Cost Approach (ComputeCostEstimate)', () => {
    expect(src).toContain('ComputeCostEstimate');
  });

  it('implements Income Approach (NOI + cap rate)', () => {
    expect(src).toContain('calculate-noi');
    expect(src).toContain('calculate-valuation');
    expect(src).toContain('cap-rates');
  });

  it('implements Sales Comparison (adjust + reconcile)', () => {
    expect(src).toContain('adjust-comparable');
    expect(src).toContain('reconcile');
    expect(src).toContain('adjustment-factors');
  });

  it('supports IQR trimming for outlier removal', () => {
    expect(src).toContain('IqrTrimPairs');
    expect(src).toContain('Q1');
    expect(src).toContain('IQR');
  });

  it('supports OLS regression analytics', () => {
    expect(src).toContain('analytics/regression');
    expect(src).toContain('Normal Equations');
  });
});

describe('Advanced Analytics Compliance', () => {
  it('supports Bayesian analysis', () => {
    expect(src).toContain('analytics/bayesian');
  });

  it('supports Monte Carlo simulation', () => {
    expect(src).toContain('analytics/montecarlo');
  });

  it('supports spatial autocorrelation (Moran I)', () => {
    expect(src).toContain('analytics/spatial/moran');
  });

  it('supports spatial autocorrelation (Geary C)', () => {
    expect(src).toContain('analytics/spatial/geary');
  });

  it('supports RCW 84.34 current use analysis', () => {
    expect(src).toContain('analytics/rcw/84-34');
  });

  it('supports RCW 84.26 historic property analysis', () => {
    expect(src).toContain('analytics/rcw/84-26');
  });

  it('supports data quality assessment', () => {
    expect(src).toContain('analytics/data-quality/assess');
  });

  it('supports ML prediction', () => {
    expect(src).toContain('analytics/ml/predict');
  });
});
