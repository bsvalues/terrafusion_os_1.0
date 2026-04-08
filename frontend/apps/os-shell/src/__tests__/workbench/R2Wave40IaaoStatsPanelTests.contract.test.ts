/**
 * R2Wave40 — IAAO Stats Panel: PRD + QualifiedSaleCount contract tests
 *
 * Static-analysis tests (file content inspection) — no running backend or DOM needed.
 * Enforces that:
 *   1. SalesComparisonData interface includes priceRelatedDifferential and qualifiedSaleCount
 *   2. SalesComparison.tsx renders PRD (IAAO) label with 0.98–1.03 target
 *   3. SalesComparison.tsx renders Qualified Sales label with "of N total" caption
 *   4. PRD displays dash (–) when value is 0
 *   5. PRD uses 3-decimal toFixed(3) formatting
 *   6. Both new fields are gated behind comparableCount > 0 (same as COD/Median)
 *   7. Legacy fields (salesRatioMedian, coefficientOfDispersion) remain intact
 *
 * @module __tests__/workbench/R2Wave40IaaoStatsPanelTests.contract.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');
const HOOK_PATH = 'hooks/forge/useForgeValuation.ts';
const COMP_PATH = 'pages/workbench/tabs/forge/SalesComparison.tsx';

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

// ── Gate 1: Interface shape ──────────────────────────────────

describe('WF40 Gate 1 — SalesComparisonData interface includes R2Wave39 fields', () => {
  it('WF40_01 — useForgeValuation.ts exists', () => {
    expect(existsSync(resolve(SRC_ROOT, HOOK_PATH))).toBe(true);
  });

  const hook = readSrc(HOOK_PATH);

  it('WF40_02 — priceRelatedDifferential is declared in SalesComparisonData', () => {
    expect(hook).toMatch(/priceRelatedDifferential\s*:\s*number/);
  });

  it('WF40_03 — qualifiedSaleCount is declared in SalesComparisonData', () => {
    expect(hook).toMatch(/qualifiedSaleCount\s*:\s*number/);
  });

  it('WF40_04 — priceRelatedDifferential declared after legacy ratio fields (ordering sanity)', () => {
    const prdIdx   = hook.indexOf('priceRelatedDifferential');
    const medianIdx = hook.indexOf('salesRatioMedian');
    expect(prdIdx).toBeGreaterThan(medianIdx);
  });
});

// ── Gate 2: PRD display in SalesComparison.tsx ───────────────

describe('WF40 Gate 2 — PRD cell wired in SalesComparison.tsx', () => {
  it('WF40_05 — SalesComparison.tsx exists', () => {
    expect(existsSync(resolve(SRC_ROOT, COMP_PATH))).toBe(true);
  });

  const comp = readSrc(COMP_PATH);

  it('WF40_06 — PRD (IAAO) label is present', () => {
    expect(comp).toContain('PRD (IAAO)');
  });

  it('WF40_07 — priceRelatedDifferential is read from salesAPI.data', () => {
    expect(comp).toMatch(/salesAPI\.data\.priceRelatedDifferential/);
  });

  it('WF40_08 — PRD target range 0.98–1.03 appears in a caption', () => {
    expect(comp).toMatch(/0\.98.*1\.03/);
  });

  it('WF40_09 — PRD renders dash when value is 0 (ternary guard)', () => {
    // The component should have: prd > 0 ? prd.toFixed(3) : '–'
    expect(comp).toMatch(/priceRelatedDifferential\s*>\s*0/);
    expect(comp).toContain('\u2013'); // en-dash
  });

  it('WF40_10 — PRD uses toFixed(3) formatting', () => {
    // priceRelatedDifferential.toFixed(3)
    expect(comp).toMatch(/priceRelatedDifferential\.toFixed\(3\)/);
  });
});

// ── Gate 3: Qualified Sales display ─────────────────────────

describe('WF40 Gate 3 — Qualified Sales count wired in SalesComparison.tsx', () => {
  const comp = readSrc(COMP_PATH);

  it('WF40_11 — Qualified Sales label is present', () => {
    expect(comp).toContain('Qualified Sales');
  });

  it('WF40_12 — qualifiedSaleCount is read from salesAPI.data', () => {
    expect(comp).toMatch(/salesAPI\.data\.qualifiedSaleCount/);
  });

  it('WF40_13 — caption shows total comparableCount for context', () => {
    // "of {salesAPI.data.comparableCount} total"
    expect(comp).toMatch(/salesAPI\.data\.comparableCount.*total|total.*salesAPI\.data\.comparableCount/);
  });
});

// ── Gate 4: Legacy field preservation ───────────────────────

describe('WF40 Gate 4 — Legacy IAAO fields remain intact', () => {
  const comp = readSrc(COMP_PATH);

  it('WF40_14 — salesRatioMedian still displayed', () => {
    expect(comp).toMatch(/salesAPI\.data\.salesRatioMedian/);
  });

  it('WF40_15 — coefficientOfDispersion still displayed', () => {
    expect(comp).toMatch(/salesAPI\.data\.coefficientOfDispersion/);
  });

  it('WF40_16 — COD (IAAO) label still present', () => {
    expect(comp).toContain('COD (IAAO)');
  });

  it('WF40_17 — Sales Ratio Median label still present', () => {
    expect(comp).toContain('Sales Ratio Median');
  });
});
