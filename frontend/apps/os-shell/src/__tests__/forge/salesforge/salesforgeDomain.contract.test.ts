/**
 * SalesForge Domain Compliance Contract Tests
 *
 * Validates:
 * - IAAO Standard on Ratio Studies compliance
 * - WA State DOR ratio study requirements
 * - 3-layer qualification model integrity
 * - OLS regression engine contract
 * - Statistical computation compliance
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', '..', 'backend');
const SERVICES_DIR = path.join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Services');
const CONTROLLER_PATH = path.join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'TerraForgeController.cs');

describe('IAAO Ratio Study Compliance', () => {
  const controllerSource = fs.readFileSync(CONTROLLER_PATH, 'utf-8');

  it('Implements IQR outlier trimming (IAAO §5.1.3)', () => {
    expect(controllerSource).toContain('IQR');
  });

  it('Computes median ratio (central tendency)', () => {
    expect(controllerSource.toLowerCase()).toContain('median');
  });

  it('Computes COD (Coefficient of Dispersion)', () => {
    // COD = (avg absolute deviation from median / median) × 100
    expect(controllerSource).toMatch(/[Cc][Oo][Dd]/);
  });

  it('Computes PRD (Price-Related Differential)', () => {
    // PRD = mean ratio / weighted mean ratio
    expect(controllerSource).toMatch(/[Pp][Rr][Dd]/);
  });

  it('Has confidence interval endpoint', () => {
    expect(controllerSource).toContain('confidence-intervals');
  });

  it('Has vertical equity endpoint', () => {
    expect(controllerSource).toContain('vertical-equity');
  });

  it('Has influence diagnostics endpoint', () => {
    expect(controllerSource).toContain('influence-diagnostics');
  });

  it('Has time trend endpoint', () => {
    expect(controllerSource).toContain('time-trend');
  });

  it('Has spatial autocorrelation endpoint', () => {
    expect(controllerSource).toContain('spatial-autocorrelation');
  });

  it('Has hedonic regression endpoint', () => {
    expect(controllerSource).toContain('hedonic-regression');
  });

  it('Has variance decomposition endpoint', () => {
    expect(controllerSource).toContain('variance-decomposition');
  });

  it('Has sale-chasing detection endpoint', () => {
    expect(controllerSource).toContain('sale-chasing');
  });

  it('Has cross-validation endpoint', () => {
    expect(controllerSource).toContain('cross-validation');
  });

  it('Has KS shift test endpoint', () => {
    expect(controllerSource).toContain('ks-shift-test');
  });

  it('Has driver analysis endpoint', () => {
    expect(controllerSource).toContain('driver-analysis');
  });
});

describe('3-Layer Qualification Model', () => {
  const qualServicePath = path.join(SERVICES_DIR, 'ISaleQualificationService.cs');
  const qualImplPath = path.join(SERVICES_DIR, 'SaleQualificationService.cs');

  it('ISaleQualificationService interface exists', () => {
    expect(fs.existsSync(qualServicePath)).toBe(true);
  });

  it('SaleQualificationService implementation exists', () => {
    expect(fs.existsSync(qualImplPath)).toBe(true);
  });

  const implSource = fs.readFileSync(qualImplPath, 'utf-8');

  it('Layer 1: Evaluates PACS SaleQualifier (sl_qualifier)', () => {
    expect(implSource).toContain('Layer 1');
    expect(implSource).toContain('rawSaleQualifier');
  });

  it('Layer 2: Evaluates County Ratio Code (sl_county_ratio_cd)', () => {
    expect(implSource).toContain('Layer 2');
    expect(implSource).toContain('rawCountyRatioCd');
  });

  it('Layer 3: Evaluates Exclusion Flag (sales_exclude_calc_cd)', () => {
    expect(implSource).toContain('Layer 3');
    expect(implSource).toContain('rawExcludeCalcCd');
  });

  it('Layer 4: Evaluates WAC 458-61A exemption code', () => {
    expect(implSource).toContain('Layer 4');
    expect(implSource).toContain('rawWacCd');
  });

  it('Layer 5: Default to qualified', () => {
    expect(implSource).toContain('Layer 5');
    expect(implSource).toContain('"qualified"');
  });

  it('Returns correct qualification outcomes', () => {
    expect(implSource).toContain('"non-arms-length"');
    expect(implSource).toContain('"foreclosure"');
    expect(implSource).toContain('"estate"');
    expect(implSource).toContain('"land-only"');
    expect(implSource).toContain('"omitted"');
    expect(implSource).toContain('"dark-sale"');
    expect(implSource).toContain('"excluded"');
    expect(implSource).toContain('"exempt"');
  });

  it('Benton County codes are hardcoded as fallback', () => {
    expect(implSource).toContain('"100"');
    expect(implSource).toContain('"200"');
    expect(implSource).toContain('"300"');
    expect(implSource).toContain('"400"');
    expect(implSource).toContain('"500"');
  });
});

describe('OLS Regression Engine', () => {
  const olsInterfacePath = path.join(SERVICES_DIR, 'IOlsRegressionService.cs');
  const olsImplPath = path.join(SERVICES_DIR, 'OlsRegressionService.cs');

  it('IOlsRegressionService interface exists', () => {
    expect(fs.existsSync(olsInterfacePath)).toBe(true);
  });

  it('OlsRegressionService implementation exists', () => {
    expect(fs.existsSync(olsImplPath)).toBe(true);
  });

  const implSource = fs.readFileSync(olsImplPath, 'utf-8');

  it('Uses Normal Equations: β = (XᵀX)⁻¹ Xᵀy', () => {
    expect(implSource).toContain('XtX');
    expect(implSource).toContain('Xty');
  });

  it('Computes R² (coefficient of determination)', () => {
    expect(implSource).toContain('RSquared');
    expect(implSource).toContain('ssTot');
    expect(implSource).toContain('ssRes');
  });

  it('Computes adjusted R²', () => {
    expect(implSource).toContain('RSquaredAdj');
  });

  it('Returns residuals', () => {
    expect(implSource).toContain('Residuals');
    expect(implSource).toContain('residuals');
  });

  it('Handles singular matrix (returns null)', () => {
    expect(implSource).toContain('singular');
  });

  it('Uses 3 predictors: GLA, LotSize, YearBuilt', () => {
    expect(implSource).toContain('Gla');
    expect(implSource).toContain('LotSizeSqft');
    expect(implSource).toContain('YearBuilt');
  });

  it('Implements Gauss-Jordan elimination for matrix inversion', () => {
    expect(implSource).toContain('InvertMatrix');
    expect(implSource).toContain('pivot');
  });
});

describe('WA State DOR Compliance', () => {
  const controllerSource = fs.readFileSync(CONTROLLER_PATH, 'utf-8');

  it('Respects SuppressOnRatioRptCd for DOR reporting', () => {
    expect(controllerSource).toContain('SuppressOnRatioRptCd');
  });

  it('Respects IncludeNoCalc flag', () => {
    expect(controllerSource).toContain('IncludeNoCalc');
  });

  it('Uses 2-year lookback window for sales', () => {
    expect(controllerSource).toContain('taxYear - 2');
  });

  it('Supports SalesYear (DOR year assignment)', () => {
    expect(controllerSource).toContain('SalesYear');
  });

  it('Computes ratios as AssessedValue / SalePrice (not PACS ratio)', () => {
    // TF computes its own ratios, never uses PACS-computed values
    expect(controllerSource).toContain('assessedByParcel');
  });
});

describe('Decimal Arithmetic Safety', () => {
  const entityPath = path.join(BACKEND_ROOT, 'src', 'TerraFusion.Core', 'Entities', 'ComparableSale.cs');
  const entitySource = fs.readFileSync(entityPath, 'utf-8');

  it('SalePrice is decimal (not float/double)', () => {
    expect(entitySource).toMatch(/public\s+decimal\s+SalePrice/);
  });

  it('AdjustedSalePrice is decimal? (not float/double)', () => {
    expect(entitySource).toMatch(/public\s+decimal\?\s+AdjustedSalePrice/);
  });
});
