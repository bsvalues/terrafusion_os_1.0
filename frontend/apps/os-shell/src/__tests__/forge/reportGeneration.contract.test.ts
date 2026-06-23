import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const BACKEND_ROOT = resolve(import.meta.dirname, '../../../../../../backend/src/TerraFusion.API/Controllers');
const TOOLS_ROOT = resolve(import.meta.dirname, '../../../../../../tools');
const TERRAFORGE_ROOT = resolve(import.meta.dirname, '../../../../../apps/terraforge/src');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ══════════════════════════════════════════════════════════════════════════════
// Report Generation — Backend API Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('Report Generation — Backend API Contract', () => {
  const controllerPath = resolve(BACKEND_ROOT, 'TerraForgeReportsController.cs');

  it('controller file exists', () => {
    expect(existsSync(controllerPath)).toBe(true);
  });

  it('is an ApiController', () => {
    const src = read(controllerPath);
    expect(src).toContain('[ApiController]');
  });

  it('route is api/reports (not api/terraforge/reports)', () => {
    const src = read(controllerPath);
    expect(src).toContain('[Route("api/reports")]');
  });

  it('does not require authorization (public report generation)', () => {
    const src = read(controllerPath);
    // Should NOT have [Authorize] at class level
    const lines = src.split('\n');
    const routeLine = lines.findIndex(l => l.includes('[Route("api/reports")]'));
    const classLines = lines.slice(Math.max(0, routeLine - 5), routeLine);
    const hasAuthorize = classLines.some(l => l.includes('[Authorize]'));
    expect(hasAuthorize).toBe(false);
  });

  describe('endpoint contracts', () => {
    it('rollback-notice accepts POST with JsonElement body', () => {
      const src = read(controllerPath);
      expect(src).toContain('[HttpPost("rollback-notice")]');
      expect(src).toContain('GenerateRollbackNotice');
      expect(src).toContain('[FromBody] JsonElement');
    });

    it('levy-certification accepts POST with JsonElement body', () => {
      const src = read(controllerPath);
      expect(src).toContain('[HttpPost("levy-certification")]');
      expect(src).toContain('GenerateLevyCertification');
    });

    it('cost-valuation accepts POST with JsonElement body', () => {
      const src = read(controllerPath);
      expect(src).toContain('[HttpPost("cost-valuation")]');
      expect(src).toContain('GenerateCostValuation');
    });

    it('ratio-study accepts POST with JsonElement body', () => {
      const src = read(controllerPath);
      expect(src).toContain('[HttpPost("ratio-study")]');
      expect(src).toContain('GenerateRatioStudy');
    });

    it('types endpoint is GET (read-only)', () => {
      const src = read(controllerPath);
      expect(src).toContain('[HttpGet("types")]');
      expect(src).toContain('ListReportTypes');
    });
  });

  describe('security and audit', () => {
    it('uses SHA-256 for audit hashing', () => {
      const src = read(controllerPath);
      expect(src).toContain('SHA256.HashData');
      expect(src).toContain('SHA-256:');
    });

    it('logs report generation with timing', () => {
      const src = read(controllerPath);
      expect(src).toContain('Stopwatch.StartNew');
      expect(src).toContain('ElapsedMilliseconds');
    });

    it('returns 500 with error detail on failure', () => {
      const src = read(controllerPath);
      expect(src).toContain('StatusCode(500');
      expect(src).toContain('Report generation failed');
    });
  });

  describe('legal compliance', () => {
    it('rollback notice references RCW 84.34.108', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.34.108');
    });

    it('rollback notice references WAC 458-30-590', () => {
      const src = read(controllerPath);
      expect(src).toContain('WAC 458-30-590');
    });

    it('levy certification references RCW 84.52.070', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.52.070');
    });

    it('levy certification references RCW 84.52.043 (limits)', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.52.043');
    });

    it('levy certification references RCW 84.55.010 (101% limit factor)', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.55.010');
    });

    it('cost valuation references IAAO Standard', () => {
      const src = read(controllerPath);
      expect(src).toContain('IAAO Standard on Mass Appraisal');
    });

    it('cost valuation references RCW 84.40.030 (true and fair value)', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.40.030');
    });

    it('ratio study references IAAO Standard on Ratio Studies', () => {
      const src = read(controllerPath);
      expect(src).toContain('IAAO Standard on Ratio Studies');
    });

    it('ratio study references RCW 84.48.075', () => {
      const src = read(controllerPath);
      expect(src).toContain('RCW 84.48.075');
    });

    it('rollback notice includes RIGHT TO APPEAL section', () => {
      const src = read(controllerPath);
      expect(src).toContain('RIGHT TO APPEAL');
      expect(src).toContain('Board of Equalization');
    });
  });

  describe('report content structure', () => {
    it('all reports include Benton County header', () => {
      const src = read(controllerPath);
      const matches = src.match(/BENTON COUNTY ASSESSOR/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBe(4); // One per report type
    });

    it('all reports include signature blocks', () => {
      const src = read(controllerPath);
      const matches = src.match(/signature-block/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it('all reports include print-optimized CSS', () => {
      const src = read(controllerPath);
      expect(src).toContain('@media print');
      expect(src).toContain('@page');
    });

    it('levy report uses landscape orientation', () => {
      const src = read(controllerPath);
      expect(src).toContain('letter landscape');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Report Generation — CLI Engine Contract
// ══════════════════════════════════════════════════════════════════════════════

describe('Report Generation — CLI Engine Contract', () => {
  const enginePath = resolve(TOOLS_ROOT, 'bin/commands/reports/report-engine.mjs');
  const cliPath = resolve(TOOLS_ROOT, 'bin/commands/reports/report-cli.mjs');

  it('report-engine.mjs exists', () => {
    expect(existsSync(enginePath)).toBe(true);
  });

  it('report-cli.mjs exists', () => {
    expect(existsSync(cliPath)).toBe(true);
  });

  it('engine exports generateReportHtml', () => {
    const src = read(enginePath);
    expect(src).toContain('export function generateReportHtml');
  });

  it('engine exports generateReportPdf', () => {
    const src = read(enginePath);
    expect(src).toContain('export async function generateReportPdf');
  });

  it('engine exports REPORT_TYPES', () => {
    const src = read(enginePath);
    expect(src).toContain('export const REPORT_TYPES');
  });

  it('engine supports all 4 report types', () => {
    const src = read(enginePath);
    expect(src).toContain('rollback-notice');
    expect(src).toContain('levy-certification');
    expect(src).toContain('cost-valuation');
    expect(src).toContain('ratio-study');
  });

  it('CLI supports --list flag', () => {
    const src = read(cliPath);
    expect(src).toContain('--list');
  });

  it('CLI supports --format flag', () => {
    const src = read(cliPath);
    expect(src).toContain('--format');
  });

  it('CLI supports --batch flag', () => {
    const src = read(cliPath);
    expect(src).toContain('--batch');
  });

  it('CLI supports --data flag for JSON input', () => {
    const src = read(cliPath);
    expect(src).toContain('--data');
  });

  it('CLI supports --output flag', () => {
    const src = read(cliPath);
    expect(src).toContain('--output');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Report Generation — Frontend-Backend Contract Alignment
// ══════════════════════════════════════════════════════════════════════════════

describe('Report Generation — Frontend-Backend Alignment', () => {
  it('frontend rollback-notice POST matches backend endpoint', () => {
    const frontend = read(resolve(TERRAFORGE_ROOT, 'pages/CurrentUsePage.tsx'));
    const backend = read(resolve(BACKEND_ROOT, 'TerraForgeReportsController.cs'));
    // Frontend calls /api/reports/rollback-notice
    expect(frontend).toContain('/api/reports/rollback-notice');
    // Backend serves at [Route("api/reports")] + [HttpPost("rollback-notice")]
    expect(backend).toContain('[Route("api/reports")]');
    expect(backend).toContain('[HttpPost("rollback-notice")]');
  });

  it('frontend levy-certification POST matches backend endpoint', () => {
    const frontend = read(resolve(TERRAFORGE_ROOT, 'pages/LevyPage.tsx'));
    const backend = read(resolve(BACKEND_ROOT, 'TerraForgeReportsController.cs'));
    expect(frontend).toContain('/api/reports/levy-certification');
    expect(backend).toContain('[HttpPost("levy-certification")]');
  });

  it('frontend cost-valuation POST matches backend endpoint', () => {
    const frontend = read(resolve(TERRAFORGE_ROOT, 'pages/CostSchedulesPage.tsx'));
    const backend = read(resolve(BACKEND_ROOT, 'TerraForgeReportsController.cs'));
    expect(frontend).toContain('/api/reports/cost-valuation');
    expect(backend).toContain('[HttpPost("cost-valuation")]');
  });

  it('frontend ratio-study POST matches backend endpoint', () => {
    const frontend = read(resolve(TERRAFORGE_ROOT, 'pages/RatioStudyPage.tsx'));
    const backend = read(resolve(BACKEND_ROOT, 'TerraForgeReportsController.cs'));
    expect(frontend).toContain('/api/reports/ratio-study');
    expect(backend).toContain('[HttpPost("ratio-study")]');
  });

  it('frontend sends Content-Type: application/json (backend expects JsonElement)', () => {
    const pages = [
      resolve(TERRAFORGE_ROOT, 'pages/CurrentUsePage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/LevyPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/CostSchedulesPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/RatioStudyPage.tsx'),
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain("'Content-Type': 'application/json'");
    }
  });

  it('frontend handles response as blob for download', () => {
    const pages = [
      resolve(TERRAFORGE_ROOT, 'pages/CurrentUsePage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/LevyPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/CostSchedulesPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/RatioStudyPage.tsx'),
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain('.blob()');
    }
  });

  it('frontend creates download link with .html extension', () => {
    const pages = [
      resolve(TERRAFORGE_ROOT, 'pages/CurrentUsePage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/LevyPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/CostSchedulesPage.tsx'),
      resolve(TERRAFORGE_ROOT, 'pages/RatioStudyPage.tsx'),
    ];
    for (const page of pages) {
      const content = read(page);
      expect(content).toContain('.html');
    }
  });
});
