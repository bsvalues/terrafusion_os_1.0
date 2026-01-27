/**
 * Reconciliation Module Tests
 *
 * Tests USPAP-aligned multi-approach value synthesis
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runReconciliation, type ReconciliationInput } from '../src/approaches/reconcile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const inputSchema = JSON.parse(
  readFileSync(join(__dirname, '../../contracts/schemas/reconciliation_input.json'), 'utf-8')
);
const outputSchema = JSON.parse(
  readFileSync(join(__dirname, '../../contracts/schemas/reconciliation_output.json'), 'utf-8')
);

// Load fixture
const fixture = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/reconciliation/residential_3approach.json'), 'utf-8')
);

// Setup Ajv
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);
const validateOutput = ajv.compile(outputSchema);

describe('Reconciliation Module', () => {
  describe('schema validation', () => {
    it('should validate input schema against fixture', () => {
      const valid = validateInput(fixture.input);
      if (!valid) {
        console.error(validateInput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate output schema against result', () => {
      const result = runReconciliation(fixture.input);
      const valid = validateOutput(result.output);
      if (!valid) {
        console.error(validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should reject input with no approaches', () => {
      const invalidInput: ReconciliationInput = {
        subjectId: 'TEST-001',
        effectiveDate: '2026-01-15',
        approaches: {},
      };
      expect(() => runReconciliation(invalidInput)).toThrow(
        'At least one approach value is required'
      );
    });
  });

  describe('determinism', () => {
    it('should produce identical output for identical input', () => {
      const result1 = runReconciliation(fixture.input);
      const result2 = runReconciliation(fixture.input);

      expect(result1.output.finalOpinionOfValue).toBe(result2.output.finalOpinionOfValue);
      expect(result1.output.approachSummary).toEqual(result2.output.approachSummary);
      expect(result1.output.reconciliationAnalysis).toEqual(result2.output.reconciliationAnalysis);
      expect(result1.output.qualityIndicators).toEqual(result2.output.qualityIndicators);
    });

    it('should match fixture expected values', () => {
      const result = runReconciliation(fixture.input);

      expect(result.output.finalOpinionOfValue).toBe(fixture.expected.finalOpinionOfValue);
      expect(result.output.approachSummary.sales?.weight).toBe(
        fixture.expected.approachSummary.sales.weight
      );
      expect(result.output.approachSummary.income?.weight).toBe(
        fixture.expected.approachSummary.income.weight
      );
      expect(result.output.approachSummary.cost?.weight).toBe(
        fixture.expected.approachSummary.cost.weight
      );
    });

    it('should calculate value range correctly', () => {
      const result = runReconciliation(fixture.input);

      expect(result.output.reconciliationAnalysis.valueRange.min).toBe(
        fixture.expected.reconciliationAnalysis.valueRange.min
      );
      expect(result.output.reconciliationAnalysis.valueRange.max).toBe(
        fixture.expected.reconciliationAnalysis.valueRange.max
      );
    });
  });

  describe('weighted average method', () => {
    it('should normalize weights to sum to 1.0', () => {
      const result = runReconciliation(fixture.input);
      const summary = result.output.approachSummary;

      const totalWeight =
        (summary.sales?.weight ?? 0) + (summary.income?.weight ?? 0) + (summary.cost?.weight ?? 0);

      expect(totalWeight).toBeCloseTo(1.0, 4);
    });

    it('should calculate contributed values correctly', () => {
      const result = runReconciliation(fixture.input);
      const summary = result.output.approachSummary;

      // Check contributed values match indicatedValue * weight (rounded)
      if (summary.sales) {
        const expected = Math.round(summary.sales.indicatedValue * summary.sales.weight);
        expect(summary.sales.contributedValue).toBe(expected);
      }
    });

    it('should produce final value as sum of contributed values', () => {
      const result = runReconciliation(fixture.input);
      const summary = result.output.approachSummary;

      const total =
        (summary.sales?.contributedValue ?? 0) +
        (summary.income?.contributedValue ?? 0) +
        (summary.cost?.contributedValue ?? 0);

      expect(result.output.finalOpinionOfValue).toBe(total);
    });
  });

  describe('bracketed method', () => {
    it('should calculate midpoint of min and max values', () => {
      const input: ReconciliationInput = {
        ...fixture.input,
        reconciliationMethod: 'bracketed',
      };

      const result = runReconciliation(input);
      const expected = Math.round((32000000 + 35000000) / 2);

      expect(result.output.finalOpinionOfValue).toBe(expected);
    });
  });

  describe('primary approach method', () => {
    it('should select value from highest-weighted approach', () => {
      const input: ReconciliationInput = {
        ...fixture.input,
        reconciliationMethod: 'primary_approach',
      };

      const result = runReconciliation(input);
      // Sales has highest weight for residential, so use sales value
      expect(result.output.finalOpinionOfValue).toBe(35000000);
    });
  });

  describe('forced weights', () => {
    it('should use explicit weights when forcedWeights is true', () => {
      const input: ReconciliationInput = {
        subjectId: 'FORCE-001',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 10000000, weight: 0.5 },
          income: { indicatedValue: 8000000, weight: 0.25 },
          cost: { indicatedValue: 9000000, weight: 0.25 },
        },
        forcedWeights: true,
      };

      const result = runReconciliation(input);

      // After normalization, weights should remain proportional
      expect(result.output.approachSummary.sales?.weight).toBe(0.5);
      expect(result.output.approachSummary.income?.weight).toBe(0.25);
      expect(result.output.approachSummary.cost?.weight).toBe(0.25);
    });
  });

  describe('property type weighting', () => {
    it('should apply commercial weights emphasizing income approach', () => {
      const input: ReconciliationInput = {
        subjectId: 'COMM-001',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 50000000, confidenceLevel: 'high' },
          income: { indicatedValue: 48000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 52000000, confidenceLevel: 'high' },
        },
        propertyType: 'commercial',
      };

      const result = runReconciliation(input);

      // For commercial, income should have highest weight
      expect(result.output.approachSummary.income!.weight).toBeGreaterThan(
        result.output.approachSummary.sales!.weight
      );
      expect(result.output.reconciliationAnalysis.primaryApproach).toBe('income');
    });

    it('should apply special purpose weights emphasizing cost approach', () => {
      const input: ReconciliationInput = {
        subjectId: 'SPEC-001',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 100000000, confidenceLevel: 'high' },
          income: { indicatedValue: 90000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 110000000, confidenceLevel: 'high' },
        },
        propertyType: 'special_purpose',
      };

      const result = runReconciliation(input);

      // For special purpose, cost should have highest weight
      expect(result.output.approachSummary.cost!.weight).toBeGreaterThan(
        result.output.approachSummary.sales!.weight
      );
      expect(result.output.reconciliationAnalysis.primaryApproach).toBe('cost');
    });
  });

  describe('confidence level adjustments', () => {
    it('should reduce weight for low-confidence approaches', () => {
      const highConfidenceInput: ReconciliationInput = {
        subjectId: 'CONF-HIGH',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 30000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 30000000, confidenceLevel: 'high' },
        },
        propertyType: 'residential',
      };

      const lowConfidenceInput: ReconciliationInput = {
        subjectId: 'CONF-LOW',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 30000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 30000000, confidenceLevel: 'low' },
        },
        propertyType: 'residential',
      };

      const highResult = runReconciliation(highConfidenceInput);
      const lowResult = runReconciliation(lowConfidenceInput);

      // Cost weight should be lower when confidence is low
      expect(lowResult.output.approachSummary.cost!.weight).toBeLessThan(
        highResult.output.approachSummary.cost!.weight
      );
    });
  });

  describe('quality indicators', () => {
    it('should set approachAgreement to "weak" when spread exceeds 20%', () => {
      const input: ReconciliationInput = {
        subjectId: 'SPREAD-001',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 50000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 35000000, confidenceLevel: 'high' },
        },
      };

      const result = runReconciliation(input);

      expect(result.output.qualityIndicators.approachAgreement).toBe('weak');
      expect(result.output.qualityIndicators.warnings.length).toBeGreaterThan(0);
    });

    it('should set approachAgreement to "moderate" when spread is 10-20%', () => {
      const input: ReconciliationInput = {
        subjectId: 'SPREAD-002',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 33000000, confidenceLevel: 'high' },
          cost: { indicatedValue: 37000000, confidenceLevel: 'high' },
        },
      };

      const result = runReconciliation(input);

      expect(result.output.qualityIndicators.approachAgreement).toBe('moderate');
    });

    it('should warn when only one approach is available', () => {
      const input: ReconciliationInput = {
        subjectId: 'SINGLE-001',
        effectiveDate: '2026-01-15',
        approaches: {
          sales: { indicatedValue: 30000000 },
        },
      };

      const result = runReconciliation(input);

      expect(result.output.qualityIndicators.warnings).toContain(
        'Only one approach available - limited reconciliation possible'
      );
    });
  });

  describe('audit events', () => {
    it('should generate reconciliation_completed audit event', () => {
      const result = runReconciliation(fixture.input);

      expect(result.auditEvent.type).toBe('reconciliation_completed');
      expect(result.auditEvent.subjectId).toBe(fixture.input.subjectId);
      expect(result.auditEvent.details.method).toBe('weighted_average');
      expect(result.auditEvent.details.finalValue).toBe(fixture.expected.finalOpinionOfValue);
    });

    it('should include all required audit details', () => {
      const result = runReconciliation(fixture.input);

      expect(result.auditEvent.details).toHaveProperty('approachCount');
      expect(result.auditEvent.details).toHaveProperty('primaryApproach');
      expect(result.auditEvent.details).toHaveProperty('spreadPercentage');
      expect(result.auditEvent.details).toHaveProperty('confidenceLevel');
      expect(result.auditEvent.timestamp).toBeTruthy();
    });
  });

  describe('explanation generation', () => {
    it('should generate human-readable explanation', () => {
      const result = runReconciliation(fixture.input);

      expect(result.output.explanation).toContain('RECONCILIATION ANALYSIS');
      expect(result.output.explanation).toContain(fixture.input.subjectId);
      expect(result.output.explanation).toContain('APPROACH VALUES:');
      expect(result.output.explanation).toContain('RECONCILED VALUE:');
    });

    it('should format currency values correctly', () => {
      const result = runReconciliation(fixture.input);

      // Should contain dollar signs from currency formatting
      expect(result.output.explanation).toContain('$');
    });

    it('should show weight percentages', () => {
      const result = runReconciliation(fixture.input);

      // Weights like 61.5% should appear
      expect(result.output.explanation).toMatch(/\d+\.\d+%/);
    });
  });
});
