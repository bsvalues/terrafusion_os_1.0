/**
 * Income Approach Unit Tests
 * Tests direct capitalization method for USPAP compliance
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  runIncomeApproach,
  extractCapRate,
  type IncomeApproachInput,
  type IncomeApproachOutput,
} from '../src/approaches/income.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load schemas
const inputSchemaPath = join(__dirname, '../../contracts/schemas/income_approach_input.json');
const outputSchemaPath = join(__dirname, '../../contracts/schemas/income_approach_output.json');
const inputSchema = JSON.parse(readFileSync(inputSchemaPath, 'utf-8'));
const outputSchema = JSON.parse(readFileSync(outputSchemaPath, 'utf-8'));

// Load fixture
const fixturePath = join(__dirname, '../fixtures/income_approach/standard_commercial.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'));

// Setup Ajv
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);
const validateOutput = ajv.compile(outputSchema);

describe('Income Approach - Schema Validation', () => {
  it('fixture input validates against input schema', () => {
    const valid = validateInput(fixture.input);
    expect(valid).toBe(true);
    if (!valid) console.error(validateInput.errors);
  });

  it('runIncomeApproach output validates against output schema', () => {
    const result = runIncomeApproach(fixture.input);
    const valid = validateOutput(result.output);
    expect(valid).toBe(true);
    if (!valid) console.error(validateOutput.errors);
  });

  it('rejects input missing required fields', () => {
    const invalid = { subjectId: 'TEST' };
    expect(validateInput(invalid)).toBe(false);
  });

  it('rejects cap rate outside valid range', () => {
    const invalid = {
      ...fixture.input,
      capitalizationRate: { rate: 0.0001 }, // too low
    };
    expect(validateInput(invalid)).toBe(false);
  });
});

describe('Income Approach - Direct Capitalization', () => {
  it('produces expected indicated value from fixture', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.indicatedValue).toBe(fixture.expected.indicatedValue);
  });

  it('calculates vacancy loss correctly', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.incomeAnalysis.vacancyLoss).toBe(fixture.expected.incomeAnalysis.vacancyLoss);
  });

  it('calculates EGI correctly', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.incomeAnalysis.effectiveGrossIncome).toBe(
      fixture.expected.incomeAnalysis.effectiveGrossIncome
    );
  });

  it('calculates total operating expenses correctly', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.incomeAnalysis.totalOperatingExpenses).toBe(
      fixture.expected.incomeAnalysis.totalOperatingExpenses
    );
  });

  it('calculates NOI correctly', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.incomeAnalysis.netOperatingIncome).toBe(
      fixture.expected.incomeAnalysis.netOperatingIncome
    );
  });

  it('includes all expense breakdown items', () => {
    const result = runIncomeApproach(fixture.input);
    const breakdown = result.output.incomeAnalysis.operatingExpenseBreakdown;
    expect(breakdown.taxes).toBe(1200000);
    expect(breakdown.insurance).toBe(300000);
    expect(breakdown.utilities).toBe(0);
    expect(breakdown.maintenance).toBe(600000);
    expect(breakdown.management).toBe(1200000);
    expect(breakdown.reserves).toBe(300000);
    expect(breakdown.other).toBe(0);
  });

  it('applies default vacancy rate when not provided', () => {
    const input: IncomeApproachInput = {
      subjectId: 'TEST-001',
      effectiveDate: '2026-01-15',
      incomeData: {
        potentialGrossIncome: 10000000,
        // vacancyRate not provided - should default to 0.05
        operatingExpenses: {
          taxes: 500000,
          insurance: 200000,
          maintenance: 300000,
        },
      },
      capitalizationRate: { rate: 0.10 },
    };

    const result = runIncomeApproach(input);
    // 10000000 * 0.05 = 500000
    expect(result.output.incomeAnalysis.vacancyLoss).toBe(500000);
  });
});

describe('Income Approach - Determinism', () => {
  it('produces identical results across multiple runs', () => {
    const results = Array.from({ length: 10 }, () => runIncomeApproach(fixture.input));

    const firstValue = results[0].output.indicatedValue;
    const firstNOI = results[0].output.incomeAnalysis.netOperatingIncome;

    for (const result of results) {
      expect(result.output.indicatedValue).toBe(firstValue);
      expect(result.output.incomeAnalysis.netOperatingIncome).toBe(firstNOI);
    }
  });

  it('produces integer indicated value (no floating point)', () => {
    const result = runIncomeApproach(fixture.input);
    expect(Number.isInteger(result.output.indicatedValue)).toBe(true);
  });
});

describe('Income Approach - Quality Indicators', () => {
  it('returns high confidence for complete data with cap rate support', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.qualityIndicators.confidenceLevel).toBe('high');
    expect(result.output.qualityIndicators.dataQuality).toBe('verified');
    expect(result.output.qualityIndicators.capRateSupport).toBe('strong');
  });

  it('warns when expense ratio is below typical range', () => {
    const input: IncomeApproachInput = {
      subjectId: 'LOW-EXPENSE',
      effectiveDate: '2026-01-15',
      incomeData: {
        potentialGrossIncome: 10000000,
        vacancyRate: 0.05,
        operatingExpenses: {
          taxes: 100000, // Very low expenses
        },
      },
      capitalizationRate: { rate: 0.08 },
      analysisParameters: {
        expenseRatioCheck: true,
        typicalExpenseRatioMin: 0.30,
        typicalExpenseRatioMax: 0.50,
      },
    };

    const result = runIncomeApproach(input);
    expect(result.output.qualityIndicators.warnings.some((w) => w.includes('below typical range'))).toBe(true);
  });

  it('warns when no operating expenses provided', () => {
    const input: IncomeApproachInput = {
      subjectId: 'NO-EXPENSE',
      effectiveDate: '2026-01-15',
      incomeData: {
        potentialGrossIncome: 10000000,
      },
      capitalizationRate: { rate: 0.08 },
    };

    const result = runIncomeApproach(input);
    expect(result.output.qualityIndicators.warnings.some((w) => w.includes('No operating expenses'))).toBe(true);
    expect(result.output.qualityIndicators.dataQuality).toBe('incomplete');
    expect(result.output.qualityIndicators.confidenceLevel).toBe('low');
  });

  it('rates cap rate support based on number of comps', () => {
    // No comps = weak
    const inputWeak: IncomeApproachInput = {
      subjectId: 'WEAK',
      effectiveDate: '2026-01-15',
      incomeData: { potentialGrossIncome: 10000000, operatingExpenses: { taxes: 1500000, maintenance: 2000000 } },
      capitalizationRate: { rate: 0.08, source: 'provided', supportingData: [] },
    };
    expect(runIncomeApproach(inputWeak).output.qualityIndicators.capRateSupport).toBe('weak');

    // 1-2 comps = moderate
    const inputModerate: IncomeApproachInput = {
      ...inputWeak,
      capitalizationRate: {
        rate: 0.08,
        source: 'market_extraction',
        supportingData: [{ propertyId: 'A', salePrice: 100000000, noi: 8000000 }],
      },
    };
    expect(runIncomeApproach(inputModerate).output.qualityIndicators.capRateSupport).toBe('moderate');

    // 3+ comps = strong
    expect(runIncomeApproach(fixture.input).output.qualityIndicators.capRateSupport).toBe('strong');
  });
});

describe('Income Approach - Audit Events', () => {
  it('produces audit event with correct type', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.auditEvent.type).toBe('approach_income_completed');
  });

  it('audit event includes subject ID', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.auditEvent.subjectId).toBe(fixture.input.subjectId);
  });

  it('audit event includes key metrics', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.auditEvent.details.method).toBe('direct_capitalization');
    expect(result.auditEvent.details.indicatedValue).toBe(fixture.expected.indicatedValue);
    expect(result.auditEvent.details.noi).toBe(fixture.expected.incomeAnalysis.netOperatingIncome);
    expect(result.auditEvent.details.capRate).toBe(0.08);
  });
});

describe('Income Approach - Explanation Generation', () => {
  it('generates human-readable explanation', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.explanation).toContain('Income Approach Analysis');
    expect(result.output.explanation).toContain('COMMERCIAL-001');
    expect(result.output.explanation).toContain('Potential Gross Income');
    expect(result.output.explanation).toContain('Net Operating Income');
    expect(result.output.explanation).toContain('Cap Rate');
  });

  it('explanation includes the indicated value', () => {
    const result = runIncomeApproach(fixture.input);
    expect(result.output.explanation).toContain('Indicated Value');
    expect(result.output.explanation).toContain('$975,000');
  });
});

describe('extractCapRate utility', () => {
  it('calculates average cap rate from comparables', () => {
    const comps = [
      { salePrice: 100000000, noi: 8000000 }, // 8%
      { salePrice: 120000000, noi: 9600000 }, // 8%
      { salePrice: 110000000, noi: 7700000 }, // 7%
    ];

    const rate = extractCapRate(comps);
    expect(rate).toBeCloseTo(0.0767, 3); // average of 8%, 8%, 7%
  });

  it('throws error with no comparables', () => {
    expect(() => extractCapRate([])).toThrow('At least one comparable required');
  });
});
