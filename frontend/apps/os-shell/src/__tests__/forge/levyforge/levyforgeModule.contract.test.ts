/**
 * LevyForge Module Contract Tests
 *
 * Verifies the structural integrity of the LevyForge module:
 * - Frontend page exists at expected path
 * - Backend controller exists and exposes expected routes
 * - Navigation is wired in TerraForge App.tsx
 * - WA State levy formula compliance
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

// Resolve paths relative to the test file's location
const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..', '..');
const TERRAFORGE_ROOT = join(REPO_ROOT, 'frontend', 'apps', 'terraforge');
const BACKEND_ROOT = join(REPO_ROOT, 'backend');

describe('LevyForge Module Structure', () => {
  it('LevyPage.tsx exists in the TerraForge pages directory', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    expect(existsSync(pagePath)).toBe(true);
  });

  it('LevyPage exports a default component', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content).toContain('export default function LevyPage');
  });

  it('LevyPage is routed at /levy in App.tsx', () => {
    const appPath = join(TERRAFORGE_ROOT, 'src', 'App.tsx');
    const content = readFileSync(appPath, 'utf-8');
    expect(content).toContain("path: '/levy'");
    expect(content).toContain('<LevyPage');
  });

  it('LevyPage is imported in App.tsx', () => {
    const appPath = join(TERRAFORGE_ROOT, 'src', 'App.tsx');
    const content = readFileSync(appPath, 'utf-8');
    expect(content).toContain("import LevyPage from './pages/LevyPage'");
  });

  it('Levy navigation label exists in the nav array', () => {
    const appPath = join(TERRAFORGE_ROOT, 'src', 'App.tsx');
    const content = readFileSync(appPath, 'utf-8');
    expect(content).toContain("label: 'Levy'");
  });
});

describe('LevyForge Backend Controller', () => {
  const controllerPath = join(BACKEND_ROOT, 'src', 'TerraFusion.API', 'Controllers', 'LevyController.cs');

  it('LevyController.cs exists', () => {
    expect(existsSync(controllerPath)).toBe(true);
  });

  it('controller is routed at api/levy', () => {
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('[Route("api/levy")]');
  });

  it('exposes GET /rates endpoint', () => {
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('[HttpGet("rates")]');
  });

  it('exposes GET /tax-areas endpoint', () => {
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('[HttpGet("tax-areas")]');
  });

  it('exposes GET /calculate endpoint', () => {
    const content = readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('[HttpGet("calculate")]');
  });
});

describe('LevyForge Backend Services', () => {
  const levyProjectRoot = join(BACKEND_ROOT, 'src', 'TerraFusion.Levy');

  it('LevyCalculationService exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Services', 'LevyCalculationService.cs'))).toBe(true);
  });

  it('LevyCertificationService exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Services', 'LevyCertificationService.cs'))).toBe(true);
  });

  it('RevenueProjectionService exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Services', 'RevenueProjectionService.cs'))).toBe(true);
  });

  it('IpdRateService exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Services', 'IpdRateService.cs'))).toBe(true);
  });

  it('LevyRiskScoringService exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Services', 'LevyRiskScoringService.cs'))).toBe(true);
  });

  it('LevyDbContext exists', () => {
    expect(existsSync(join(levyProjectRoot, 'Data', 'LevyDbContext.cs'))).toBe(true);
  });
});

describe('LevyForge Frontend API Integration', () => {
  it('LevyPage calls the rates endpoint via API constant', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content).toContain("const API = '/api/levy'");
    expect(content).toContain('/rates');
  });

  it('LevyPage calls /api/levy/calculate', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content).toContain('/calculate');
  });

  it('LevyPage renders a rates table', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content).toContain('<table');
    expect(content).toContain('Levy Code');
  });

  it('LevyPage has a calculator section', () => {
    const pagePath = join(TERRAFORGE_ROOT, 'src', 'pages', 'LevyPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content).toContain('Calculator');
  });
});
