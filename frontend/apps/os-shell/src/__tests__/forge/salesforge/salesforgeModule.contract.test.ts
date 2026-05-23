/**
 * SalesForge Module Contract Tests
 *
 * Validates:
 * - File structure (pages exist)
 * - Routing (App.tsx wires pages correctly)
 * - API integration (correct backend endpoints referenced)
 * - Controller contract (endpoints exist in backend source)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Resolve paths relative to the test file
const TERRAFORGE_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', 'apps', 'terraforge', 'src');
const BACKEND_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', '..', 'backend');

describe('SalesForge Module Structure', () => {
  it('SaleQualificationPage.tsx exists', () => {
    expect(fs.existsSync(path.join(TERRAFORGE_ROOT, 'pages', 'SaleQualificationPage.tsx'))).toBe(true);
  });

  it('CompsPage.tsx exists', () => {
    expect(fs.existsSync(path.join(TERRAFORGE_ROOT, 'pages', 'CompsPage.tsx'))).toBe(true);
  });

  it('RatioStudyPage.tsx exists', () => {
    expect(fs.existsSync(path.join(TERRAFORGE_ROOT, 'pages', 'RatioStudyPage.tsx'))).toBe(true);
  });

  it('RegressionPage.tsx exists', () => {
    expect(fs.existsSync(path.join(TERRAFORGE_ROOT, 'pages', 'RegressionPage.tsx'))).toBe(true);
  });
});

describe('SalesForge Routing', () => {
  const appSource = fs.readFileSync(path.join(TERRAFORGE_ROOT, '..', '..', '..', 'apps', 'terraforge', 'src', 'App.tsx'), 'utf-8');

  it('App.tsx imports SaleQualificationPage', () => {
    expect(appSource).toContain('SaleQualification');
  });

  it('App.tsx imports CompsPage', () => {
    expect(appSource).toContain('Comps');
  });

  it('App.tsx imports RatioStudyPage', () => {
    expect(appSource).toContain('RatioStudy');
  });

  it('App.tsx imports RegressionPage', () => {
    expect(appSource).toContain('Regression');
  });
});

describe('SalesForge API Integration', () => {
  const saleQualSource = fs.readFileSync(path.join(TERRAFORGE_ROOT, 'pages', 'SaleQualificationPage.tsx'), 'utf-8');
  const compsSource = fs.readFileSync(path.join(TERRAFORGE_ROOT, 'pages', 'CompsPage.tsx'), 'utf-8');
  const ratioSource = fs.readFileSync(path.join(TERRAFORGE_ROOT, 'pages', 'RatioStudyPage.tsx'), 'utf-8');

  it('SaleQualificationPage uses /api/terraforge/sale-qualification', () => {
    expect(saleQualSource).toContain('/api/terraforge/sale-qualification');
  });

  it('CompsPage uses /api/terraforge/comps-pool', () => {
    expect(compsSource).toContain('/api/terraforge/comps-pool');
  });

  it('RatioStudyPage uses /api/terraforge/ratio-study', () => {
    expect(ratioSource).toContain('/api/terraforge/ratio-study');
  });

  it('SaleQualificationPage uses fetch()', () => {
    expect(saleQualSource).toContain('fetch(');
  });

  it('CompsPage uses fetch()', () => {
    expect(compsSource).toContain('fetch(');
  });

  it('RatioStudyPage uses fetch()', () => {
    expect(ratioSource).toContain('fetch(');
  });
});

describe('SalesForge Backend Controller Contract', () => {
  const controllerPath = path.join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'TerraForgeController.cs');
  const controllerSource = fs.readFileSync(controllerPath, 'utf-8');

  it('TerraForgeController exists', () => {
    expect(fs.existsSync(controllerPath)).toBe(true);
  });

  it('Controller has [Route("api/terraforge")]', () => {
    expect(controllerSource).toContain('[Route("api/terraforge")]');
  });

  it('Controller has sale-qualification endpoint', () => {
    expect(controllerSource).toContain('[HttpGet("sale-qualification")]');
  });

  it('Controller has comps-pool endpoint', () => {
    expect(controllerSource).toContain('[HttpGet("comps-pool")]');
  });

  it('Controller has ratio-study endpoint', () => {
    expect(controllerSource).toContain('[HttpGet("ratio-study")]');
  });

  it('Controller has regression endpoint', () => {
    expect(controllerSource).toContain('[HttpGet("regression")]');
  });

  it('Controller has compute-qualifications POST endpoint', () => {
    expect(controllerSource).toContain('[HttpPost("compute-qualifications")]');
  });

  it('Controller has apply-recommendations POST endpoint', () => {
    expect(controllerSource).toContain('[HttpPost("apply-recommendations")]');
  });

  it('Controller has comparison-snapshots endpoint', () => {
    expect(controllerSource).toContain('[HttpGet("comparison-snapshots")]');
  });
});

describe('SalesForge Supporting Controllers', () => {
  const controllersDir = path.join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers');

  it('SalesAuditController.cs exists', () => {
    expect(fs.existsSync(path.join(controllersDir, 'SalesAuditController.cs'))).toBe(true);
  });

  it('SalesRatioStudyController.cs exists', () => {
    expect(fs.existsSync(path.join(controllersDir, 'SalesRatioStudyController.cs'))).toBe(true);
  });

  it('SalesReviewQueueController.cs exists', () => {
    expect(fs.existsSync(path.join(controllersDir, 'SalesReviewQueueController.cs'))).toBe(true);
  });

  it('SalesPipelineController.cs exists', () => {
    expect(fs.existsSync(path.join(controllersDir, 'SalesPipelineController.cs'))).toBe(true);
  });

  it('TfSalesController.cs exists', () => {
    expect(fs.existsSync(path.join(controllersDir, 'TfSalesController.cs'))).toBe(true);
  });
});
