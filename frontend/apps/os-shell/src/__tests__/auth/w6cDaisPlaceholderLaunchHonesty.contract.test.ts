/**
 * W6C — Dais Placeholder Launch Honesty Contract Tests
 *
 * Static source-file inspection.
 * Verifies:
 *   - placeholder-backed Dais standalone cards are marked coming-soon at the suite seam
 *   - placeholder-backed Dais module IDs resolve to explicit PlaceholderModule surfaces
 *   - real Dais cards remain launchable
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Gate 1 — placeholder-backed Dais cards are explicit at the suite seam', () => {
  const src = readSrc('pages/suites/DaisSuiteHome.tsx');

  it('marks TerraPILT as coming-soon', () => {
    expect(src).toMatch(/id:\s*'terra-pilt'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('marks TerraPermit as coming-soon', () => {
    expect(src).toMatch(/id:\s*'terra-permit'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('marks VEI as coming-soon', () => {
    expect(src).toMatch(/id:\s*'vei'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('marks PropertyTax AI as coming-soon', () => {
    expect(src).toMatch(/id:\s*'property-tax-ai'[\s\S]*availability:\s*'coming-soon'/);
  });

  it('keeps TerraLevy, Management, and TerraQueue launchable', () => {
    expect(src).toMatch(/\{[^}]*id:\s*'terra-levy'[^}]*moduleId:\s*'terra-levy'[^}]*\}/);
    expect(src).toMatch(/\{[^}]*id:\s*'management-dashboard'[^}]*moduleId:\s*'management-dashboard'[^}]*\}/);
    expect(src).toMatch(/\{[^}]*id:\s*'terra-queue'[^}]*moduleId:\s*'terra-queue'[^}]*\}/);
  });
});

describe('Gate 2 — placeholder-backed Dais cards resolve only to explicit placeholders', () => {
  const src = readSrc('config/moduleComponents.tsx');

  it('VEI resolves to PlaceholderModule', () => {
    expect(src).toMatch(/case 'vei':[\s\S]*<PlaceholderModule[\s\S]*status='placeholder'/);
  });

  it('TerraPILT resolves to PlaceholderModule', () => {
    expect(src).toMatch(/case 'terra-pilt':[\s\S]*<PlaceholderModule[\s\S]*status='placeholder'/);
  });

  it('PropertyTax AI resolves to PlaceholderModule', () => {
    expect(src).toMatch(/case 'property-tax-ai':[\s\S]*<PlaceholderModule[\s\S]*status='placeholder'/);
  });

  it('TerraPermit resolves to PlaceholderModule', () => {
    expect(src).toMatch(/case 'terra-permit':[\s\S]*<PlaceholderModule[\s\S]*status='placeholder'/);
  });

  it('Management and TerraQueue still resolve to real components', () => {
    expect(src).toMatch(/case 'management-dashboard':[\s\S]*<ManagementDashboard\s*\/>/);
    expect(src).toMatch(/case 'terra-queue':[\s\S]*<TerraQueue\s*\/>/);
  });
});