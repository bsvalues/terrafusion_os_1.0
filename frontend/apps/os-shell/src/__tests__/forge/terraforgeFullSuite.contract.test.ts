import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const TERRAFORGE_ROOT = resolve(import.meta.dirname, '../../../../../apps/terraforge/src');
const BACKEND_ROOT = resolve(import.meta.dirname, '../../../../../../backend/src/TerraFusion.API/Controllers');
const TOOLS_ROOT = resolve(import.meta.dirname, '../../../../../../tools');

function read(relPath: string, base = TERRAFORGE_ROOT): string {
  return readFileSync(resolve(base, relPath), 'utf-8');
}
function exists(relPath: string, base = TERRAFORGE_ROOT): boolean {
  return existsSync(resolve(base, relPath));
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Application Architecture Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Application Architecture', () => {
  describe('file structure', () => {
    const pages = [
      'pages/RatioStudyPage.tsx',
      'pages/CompsPage.tsx',
      'pages/SaleQualificationPage.tsx',
      'pages/RegressionPage.tsx',
      'pages/CostSchedulesPage.tsx',
      'pages/LevyPage.tsx',
      'pages/CurrentUsePage.tsx',
      'pages/CurrentUseInterestPage.tsx',
      'pages/CurrentUseRemovalsPage.tsx',
    ];

    for (const page of pages) {
      it(`has ${page}`, () => {
        expect(exists(page)).toBe(true);
      });
    }

    it('has App.tsx as the root component', () => {
      expect(exists('App.tsx')).toBe(true);
    });

    it('has App.css for global styles', () => {
      expect(exists('App.css')).toBe(true);
    });
  });

  describe('routing completeness', () => {
    it('App.tsx imports all 9 page components', () => {
      const app = read('App.tsx');
      expect(app).toContain("import CompsPage");
      expect(app).toContain("import CostSchedulesPage");
      expect(app).toContain("import LevyPage");
      expect(app).toContain("import RatioStudyPage");
      expect(app).toContain("import RegressionPage");
      expect(app).toContain("import SaleQualificationPage");
      expect(app).toContain("import CurrentUsePage");
      expect(app).toContain("import CurrentUseInterestPage");
      expect(app).toContain("import CurrentUseRemovalsPage");
    });

    it('registers all 9 routes', () => {
      const app = read('App.tsx');
      expect(app).toContain('path="/ratio-study"');
      expect(app).toContain('path="/comps"');
      expect(app).toContain('path="/sale-qualification"');
      expect(app).toContain('path="/regression"');
      expect(app).toContain('path="/cost-schedules"');
      expect(app).toContain('path="/levy"');
      expect(app).toContain('path="/current-use"');
      expect(app).toContain('path="/current-use/interest"');
      expect(app).toContain('path="/current-use/removals"');
    });

    it('has 7 items in NAV_ITEMS', () => {
      const app = read('App.tsx');
      const navItems = app.match(/path:\s*'\/[^']+'/g);
      // NAV_ITEMS has 7 top-level nav items (sub-routes are nested)
      expect(navItems).toBeTruthy();
      expect(navItems!.length).toBeGreaterThanOrEqual(7);
    });

    it('defaults to /ratio-study as the index route', () => {
      const app = read('App.tsx');
      expect(app).toContain('Navigate to="/ratio-study"');
    });
  });

  describe('design system consistency', () => {
    const pages = [
      'pages/RatioStudyPage.tsx',
      'pages/CompsPage.tsx',
      'pages/CostSchedulesPage.tsx',
      'pages/LevyPage.tsx',
      'pages/CurrentUsePage.tsx',
    ];

    for (const page of pages) {
      it(`${page} uses tf- CSS class prefix`, () => {
        const content = read(page);
        expect(content).toContain('tf-');
      });
    }

    it('App.tsx renders TerraForge brand in nav', () => {
      const app = read('App.tsx');
      expect(app).toContain('TerraForge');
    });

    it('App.tsx renders footer with Benton County', () => {
      const app = read('App.tsx');
      expect(app).toContain('Benton County WA');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Sales Module Contract (Ratio Study + Comps + Qualification)
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Sales Module', () => {
  describe('RatioStudyPage', () => {
    it('references IAAO Standard on Ratio Studies', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('IAAO');
    });

    it('displays COD metric', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('COD');
    });

    it('displays PRD metric', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('PRD');
    });

    it('displays Median Ratio', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('Median');
    });

    it('supports tax year filtering', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('taxYear');
    });

    it('supports neighborhood filtering', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('hood');
    });

    it('has CSV export functionality', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('exportCsv');
      expect(page).toContain('text/csv');
    });

    it('has report download button', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('downloadRatioReport');
      expect(page).toContain('/api/reports/ratio-study');
    });

    it('uses pagination for results', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('pageSize');
      expect(page).toContain('setPage');
    });
  });

  describe('CompsPage', () => {
    it('uses /api/terraforge/comps endpoint', () => {
      const page = read('pages/CompsPage.tsx');
      expect(page).toContain('/api/terraforge/comps');
    });

    it('supports price range filtering', () => {
      const page = read('pages/CompsPage.tsx');
      expect(page).toContain('minPrice');
      expect(page).toContain('maxPrice');
    });

    it('supports GLA range filtering', () => {
      const page = read('pages/CompsPage.tsx');
      expect(page).toContain('minGla');
      expect(page).toContain('maxGla');
    });

    it('displays sale price data', () => {
      const page = read('pages/CompsPage.tsx');
      expect(page).toContain('salePrice');
    });

    it('displays property type', () => {
      const page = read('pages/CompsPage.tsx');
      expect(page).toContain('propType');
    });
  });

  describe('SaleQualificationPage', () => {
    it('uses /api/terraforge/sale-qualification endpoint', () => {
      const page = read('pages/SaleQualificationPage.tsx');
      expect(page).toContain('/api/terraforge/sale-qualification');
    });

    it('supports qualification decision workflow', () => {
      const page = read('pages/SaleQualificationPage.tsx');
      expect(page).toContain('qualified');
    });

    it('tracks decidedBy identity', () => {
      const page = read('pages/SaleQualificationPage.tsx');
      expect(page).toContain('decidedBy');
    });

    it('supports qualification notes', () => {
      const page = read('pages/SaleQualificationPage.tsx');
      expect(page).toContain('notes');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Cost Module Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Cost Module', () => {
  describe('CostSchedulesPage', () => {
    it('uses /api/costforge endpoint', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('/api/costforge');
    });

    it('displays cost matrix data', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toMatch(/baseCost|costPerSqFt|costMatrix/);
    });

    it('has cost estimate calculator', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('Calculate Cost Estimate');
    });

    it('computes Replacement Cost New (RCN)', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('replacementCostNew');
    });

    it('computes depreciation', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('depreci');
    });

    it('computes RCNLD', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('depreciatedCost');
    });

    it('includes land value in total', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('landValue');
    });

    it('has report download button', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('downloadCostReport');
      expect(page).toContain('/api/reports/cost-valuation');
    });

    it('supports building type selection', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('buildingType');
    });

    it('supports quality grade selection', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('qualityGrade');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Levy Module Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Levy Module', () => {
  describe('LevyPage', () => {
    it('uses /api/levy endpoint', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('/api/levy');
    });

    it('references RCW 84.52 (levy statutes)', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('RCW 84.52');
    });

    it('displays levy rates', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('rate');
    });

    it('displays district information', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toMatch(/district|District/);
    });

    it('has levy calculator', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('Calculate');
    });

    it('supports tax area number input', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('taxAreaNumber');
    });

    it('supports assessed value input', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('assessedValue');
    });

    it('has report download button', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('downloadLevyReport');
      expect(page).toContain('/api/reports/levy-certification');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Regression Module Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Regression Module', () => {
  describe('RegressionPage', () => {
    it('uses /api/terraforge/regression endpoint', () => {
      const page = read('pages/RegressionPage.tsx');
      expect(page).toContain('/api/terraforge/regression');
    });

    it('displays R-squared metric', () => {
      const page = read('pages/RegressionPage.tsx');
      expect(page).toMatch(/[Rr].*[Ss]quared|r2|rSquared|R²/);
    });

    it('displays coefficients', () => {
      const page = read('pages/RegressionPage.tsx');
      expect(page).toContain('Coefficient');
    });

    it('supports neighborhood filtering', () => {
      const page = read('pages/RegressionPage.tsx');
      expect(page).toContain('hood');
    });

    it('supports property type filtering', () => {
      const page = read('pages/RegressionPage.tsx');
      expect(page).toContain('propType');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Current Use Module Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Current Use Module', () => {
  describe('CurrentUsePage', () => {
    it('uses /api/currentuse endpoint', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('/api/currentuse');
    });

    it('references RCW 84.33/84.34', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('RCW 84.33');
      expect(page).toContain('84.34');
    });

    it('supports DFL classification', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('DFL');
    });

    it('supports CUFA classification', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('CUFA');
    });

    it('has rollback calculator', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('rollback');
    });

    it('computes additional tax', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('additionalTax');
    });

    it('computes interest per RCW 84.34.108', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('interest');
    });

    it('computes penalty (20%)', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('penalty');
    });

    it('has report download button', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('downloadRollbackReport');
      expect(page).toContain('/api/reports/rollback-notice');
    });

    it('handles penalty exception codes', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('penaltyExceptionCode');
    });
  });

  describe('CurrentUseInterestPage', () => {
    it('uses /api/currentuse endpoint', () => {
      const page = read('pages/CurrentUseInterestPage.tsx');
      expect(page).toContain('/api/currentuse');
    });

    it('references WA DOR as rate source', () => {
      const page = read('pages/CurrentUseInterestPage.tsx');
      expect(page).toContain('DOR');
    });

    it('displays interest rates by year', () => {
      const page = read('pages/CurrentUseInterestPage.tsx');
      expect(page).toContain('year');
      expect(page).toContain('rate');
    });
  });

  describe('CurrentUseRemovalsPage', () => {
    it('uses /api/currentuse endpoint', () => {
      const page = read('pages/CurrentUseRemovalsPage.tsx');
      expect(page).toContain('/api/currentuse');
    });

    it('tracks removal status', () => {
      const page = read('pages/CurrentUseRemovalsPage.tsx');
      expect(page).toContain('Pending');
      expect(page).toContain('Confirmed');
    });

    it('captures removal reason', () => {
      const page = read('pages/CurrentUseRemovalsPage.tsx');
      expect(page).toContain('reason');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Report Generation Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Report Generation', () => {
  describe('backend controller', () => {
    it('TerraForgeReportsController.cs exists', () => {
      expect(exists('TerraForgeReportsController.cs', BACKEND_ROOT)).toBe(true);
    });

    it('is routed at api/reports', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[Route("api/reports")]');
    });

    it('exposes POST rollback-notice endpoint', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[HttpPost("rollback-notice")]');
    });

    it('exposes POST levy-certification endpoint', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[HttpPost("levy-certification")]');
    });

    it('exposes POST cost-valuation endpoint', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[HttpPost("cost-valuation")]');
    });

    it('exposes POST ratio-study endpoint', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[HttpPost("ratio-study")]');
    });

    it('exposes GET types endpoint', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[HttpGet("types")]');
    });

    it('produces text/html content type', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('[Produces("text/html")]');
    });

    it('includes SHA-256 audit hash', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('SHA-256');
      expect(controller).toContain('ComputeAuditHash');
    });

    it('references RCW 84.34.108 in rollback notice', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('RCW 84.34.108');
    });

    it('references RCW 84.52.070 in levy certification', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('RCW 84.52.070');
    });

    it('references IAAO Standard in cost valuation', () => {
      const controller = read('TerraForgeReportsController.cs', BACKEND_ROOT);
      expect(controller).toContain('IAAO Standard');
    });
  });

  describe('CLI integration', () => {
    it('report-engine.mjs exists', () => {
      expect(exists('bin/commands/reports/report-engine.mjs', TOOLS_ROOT)).toBe(true);
    });

    it('report-cli.mjs exists', () => {
      expect(exists('bin/commands/reports/report-cli.mjs', TOOLS_ROOT)).toBe(true);
    });

    it('forge.mjs references reports module', () => {
      const forge = read('bin/commands/forge.mjs', TOOLS_ROOT);
      expect(forge).toContain('reports');
    });
  });

  describe('TerraPilot tool registry', () => {
    it('registry includes report_generate_rollback_notice', () => {
      const registry = read('registry/terrapilot.tools.json', TOOLS_ROOT);
      expect(registry).toContain('report_generate_rollback_notice');
    });

    it('registry includes report_generate_levy_certification', () => {
      const registry = read('registry/terrapilot.tools.json', TOOLS_ROOT);
      expect(registry).toContain('report_generate_levy_certification');
    });

    it('registry includes report_generate_cost_valuation', () => {
      const registry = read('registry/terrapilot.tools.json', TOOLS_ROOT);
      expect(registry).toContain('report_generate_cost_valuation');
    });

    it('registry includes report_generate_ratio_study', () => {
      const registry = read('registry/terrapilot.tools.json', TOOLS_ROOT);
      expect(registry).toContain('report_generate_ratio_study');
    });
  });

  describe('frontend integration', () => {
    it('CurrentUsePage calls /api/reports/rollback-notice', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('/api/reports/rollback-notice');
    });

    it('LevyPage calls /api/reports/levy-certification', () => {
      const page = read('pages/LevyPage.tsx');
      expect(page).toContain('/api/reports/levy-certification');
    });

    it('CostSchedulesPage calls /api/reports/cost-valuation', () => {
      const page = read('pages/CostSchedulesPage.tsx');
      expect(page).toContain('/api/reports/cost-valuation');
    });

    it('RatioStudyPage calls /api/reports/ratio-study', () => {
      const page = read('pages/RatioStudyPage.tsx');
      expect(page).toContain('/api/reports/ratio-study');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Cross-Module Consistency
// ══════════════════════════════════════════════════════════════════════════════

describe('TerraForge Cross-Module Consistency', () => {
  it('all pages use Tooltip component', () => {
    const pages = [
      'pages/RatioStudyPage.tsx',
      'pages/CompsPage.tsx',
      'pages/CostSchedulesPage.tsx',
      'pages/LevyPage.tsx',
      'pages/CurrentUsePage.tsx',
      'pages/RegressionPage.tsx',
      'pages/SaleQualificationPage.tsx',
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain('Tooltip');
    }
  });

  it('all calculator pages have loading states', () => {
    const pages = [
      'pages/CostSchedulesPage.tsx',
      'pages/LevyPage.tsx',
      'pages/CurrentUsePage.tsx',
      'pages/RegressionPage.tsx',
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain('loading');
      expect(content).toContain('setLoading');
    }
  });

  it('all calculator pages have error handling', () => {
    const pages = [
      'pages/CostSchedulesPage.tsx',
      'pages/LevyPage.tsx',
      'pages/CurrentUsePage.tsx',
      'pages/RegressionPage.tsx',
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain('error');
      expect(content).toContain('setError');
    }
  });

  it('vite.config.ts proxies /api to backend', () => {
    const viteConfig = readFileSync(resolve(TERRAFORGE_ROOT, '..', 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain("'/api'");
    expect(viteConfig).toContain('http://localhost:5000');
  });
});
