/**
 * TerraForge Sales Approach - Unit Tests
 *
 * Tests the USPAP-aligned Sales Comparison Approach:
 * - Adjustment calculations
 * - Deterministic output
 * - Schema compliance
 * - Edge cases
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { beforeAll, describe, expect, it } from 'vitest';

import { runSalesApproach, SalesApproachInput } from '../src/approaches/sales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// FIXTURES & SCHEMA SETUP
// ============================================================

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/sales_approach');
const SCHEMAS_DIR = path.resolve(__dirname, '../../contracts/schemas');

let ajv: Ajv;
let validateInput: ReturnType<Ajv['compile']>;
let validateOutput: ReturnType<Ajv['compile']>;
let validateAudit: ReturnType<Ajv['compile']>;

beforeAll(() => {
  ajv = new Ajv();
  addFormats(ajv);

  const inputSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'sales_approach_input.json'), 'utf-8')
  );
  const outputSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'sales_approach_output.json'), 'utf-8')
  );
  const auditSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'audit_event.json'), 'utf-8')
  );

  validateInput = ajv.compile(inputSchema);
  validateOutput = ajv.compile(outputSchema);
  validateAudit = ajv.compile(auditSchema);
});

// ============================================================
// HELPER: Load fixture
// ============================================================

function loadFixture(name: string): { input: SalesApproachInput; expectedOutput: any } {
  const fixturePath = path.join(FIXTURES_DIR, name);
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  return { input: fixture.input, expectedOutput: fixture.expectedOutput };
}

// ============================================================
// TEST SUITES
// ============================================================

describe('Sales Comparison Approach', () => {
  describe('Standard 3-comp fixture', () => {
    it('should produce deterministic indicated value', async () => {
      const { input, expectedOutput } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.indicatedValue).toBe(expectedOutput.indicatedValue);
    });

    it('should calculate correct adjustments for each comparable', async () => {
      const { input, expectedOutput } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      const analysis = result.data!.comparableAnalysis;

      // Check COMP-001 adjustments
      const comp1 = analysis.find(a => a.compId === 'COMP-001');
      expect(comp1).toBeDefined();
      expect(comp1!.adjustments.gla).toBe(expectedOutput.comparableAnalysis[0].adjustments.gla);
      expect(comp1!.adjustments.lotSize).toBe(
        expectedOutput.comparableAnalysis[0].adjustments.lotSize
      );
      expect(comp1!.adjustments.total).toBe(expectedOutput.comparableAnalysis[0].adjustments.total);
      expect(comp1!.adjustedPrice).toBe(expectedOutput.comparableAnalysis[0].adjustedPrice);

      // Check COMP-002 adjustments (negative - superior comp)
      const comp2 = analysis.find(a => a.compId === 'COMP-002');
      expect(comp2).toBeDefined();
      expect(comp2!.adjustments.gla).toBe(expectedOutput.comparableAnalysis[1].adjustments.gla);
      expect(comp2!.adjustments.condition).toBe(
        expectedOutput.comparableAnalysis[1].adjustments.condition
      );
      expect(comp2!.adjustments.location).toBe(
        expectedOutput.comparableAnalysis[1].adjustments.location
      );
      expect(comp2!.adjustedPrice).toBe(expectedOutput.comparableAnalysis[1].adjustedPrice);

      // Check COMP-003 adjustments
      const comp3 = analysis.find(a => a.compId === 'COMP-003');
      expect(comp3).toBeDefined();
      expect(comp3!.adjustedPrice).toBe(expectedOutput.comparableAnalysis[2].adjustedPrice);
    });

    it('should produce correct statistics', async () => {
      const { input, expectedOutput } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      const stats = result.data!.statistics;

      expect(stats.adjustedPriceRange.min).toBe(expectedOutput.statistics.adjustedPriceRange.min);
      expect(stats.adjustedPriceRange.max).toBe(expectedOutput.statistics.adjustedPriceRange.max);
      expect(stats.adjustedPriceMedian).toBe(expectedOutput.statistics.adjustedPriceMedian);
    });

    it('should use weighted_average method for 3+ comps', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      expect(result.data!.valueMethod).toBe('weighted_average');
    });

    it('should generate High confidence for well-matched comps', async () => {
      const { input, expectedOutput } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      expect(result.data!.qualityIndicators.confidenceLevel).toBe(
        expectedOutput.qualityIndicators.confidenceLevel
      );
    });
  });

  describe('Schema validation', () => {
    it('should produce input that validates against input schema', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const valid = validateInput(input);

      expect(valid).toBe(true);
      if (!valid) {
        console.error(validateInput.errors);
      }
    });

    it('should produce output that validates against output schema', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      const valid = validateOutput(result.data);

      expect(valid).toBe(true);
      if (!valid) {
        console.error(validateOutput.errors);
      }
    });

    it('should produce audit event that validates against audit schema', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      expect(result.auditEvent).toBeDefined();

      const valid = validateAudit(result.auditEvent);

      expect(valid).toBe(true);
      if (!valid) {
        console.error(validateAudit.errors);
      }
    });
  });

  describe('Audit event', () => {
    it('should emit approach_sales_completed action', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.auditEvent).toBeDefined();
      expect(result.auditEvent!.action).toBe('approach_sales_completed');
      expect(result.auditEvent!.module).toBe('terraforge.approach.sales');
      expect(result.auditEvent!.resourceId).toBe(input.subjectParcelId);
    });

    it('should include integrity hash', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.auditEvent!.hash).toBeDefined();
      expect(result.auditEvent!.hash.length).toBe(16);
    });
  });

  describe('Edge cases', () => {
    it('should fail with no comparables', async () => {
      const { input } = loadFixture('standard_3comp.json');
      const badInput = { ...input, comparables: [] };

      const result = await runSalesApproach(badInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one comparable');
    });

    it('should use median method for fewer than 3 comps', async () => {
      const { input } = loadFixture('standard_3comp.json');
      const twoCompInput = { ...input, comparables: input.comparables.slice(0, 2) };

      const result = await runSalesApproach(twoCompInput);

      expect(result.success).toBe(true);
      expect(result.data!.valueMethod).toBe('median');
    });

    it('should generate flag for limited comparables', async () => {
      const { input } = loadFixture('standard_3comp.json');
      const twoCompInput = { ...input, comparables: input.comparables.slice(0, 2) };

      const result = await runSalesApproach(twoCompInput);

      expect(result.success).toBe(true);
      const flags = result.data!.qualityIndicators.flags;
      expect(flags.some(f => f.includes('Limited comparable sales'))).toBe(true);
    });

    it('should handle single comparable', async () => {
      const { input } = loadFixture('standard_3comp.json');
      const singleCompInput = { ...input, comparables: [input.comparables[0]] };

      const result = await runSalesApproach(singleCompInput);

      expect(result.success).toBe(true);
      expect(result.data!.valueMethod).toBe('median');
      // Single comp = indicated value equals that comp's adjusted price
      expect(result.data!.indicatedValue).toBe(result.data!.comparableAnalysis[0].adjustedPrice);
    });

    it('should assign lower weight to high-adjustment comps', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(result.success).toBe(true);
      const analysis = result.data!.comparableAnalysis;

      // COMP-002 has highest gross adjustment, should have lowest weight
      const comp1 = analysis.find(a => a.compId === 'COMP-001')!;
      const comp2 = analysis.find(a => a.compId === 'COMP-002')!;
      const comp3 = analysis.find(a => a.compId === 'COMP-003')!;

      // COMP-003 has lowest gross adjustment (5.88%), highest weight
      // COMP-002 has highest gross adjustment (15.46%), lowest weight
      expect(comp3.weight).toBeGreaterThan(comp2.weight);
      expect(comp1.weight).toBeGreaterThan(comp2.weight);
    });
  });

  describe('Determinism', () => {
    it('should produce identical results on repeated runs', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result1 = await runSalesApproach(input);
      const result2 = await runSalesApproach(input);

      expect(result1.data!.indicatedValue).toBe(result2.data!.indicatedValue);
      expect(result1.data!.statistics.adjustedPriceMean).toBe(
        result2.data!.statistics.adjustedPriceMean
      );
      expect(result1.data!.statistics.adjustedPriceMedian).toBe(
        result2.data!.statistics.adjustedPriceMedian
      );

      // Comparable analysis should be identical
      result1.data!.comparableAnalysis.forEach((comp, i) => {
        expect(comp.adjustedPrice).toBe(result2.data!.comparableAnalysis[i].adjustedPrice);
        expect(comp.adjustments.total).toBe(result2.data!.comparableAnalysis[i].adjustments.total);
      });
    });

    it('should produce integer values only (no floating point)', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      expect(Number.isInteger(result.data!.indicatedValue)).toBe(true);
      expect(Number.isInteger(result.data!.statistics.adjustedPriceMean)).toBe(true);
      expect(Number.isInteger(result.data!.statistics.adjustedPriceMedian)).toBe(true);

      result.data!.comparableAnalysis.forEach(comp => {
        expect(Number.isInteger(comp.adjustedPrice)).toBe(true);
        expect(Number.isInteger(comp.adjustments.total)).toBe(true);
      });
    });
  });

  describe('Explanation generation', () => {
    it('should include subject characteristics in explanation', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      const explanation = result.data!.explanation;
      expect(explanation).toContain(input.subjectParcelId);
      expect(explanation).toContain('2,000 SF GLA');
      expect(explanation).toContain('Good condition');
    });

    it('should include value range in explanation', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      const explanation = result.data!.explanation;
      expect(explanation).toContain('$326,250');
      expect(explanation).toContain('$374,000');
    });

    it('should include final indicated value in explanation', async () => {
      const { input } = loadFixture('standard_3comp.json');

      const result = await runSalesApproach(input);

      const explanation = result.data!.explanation;
      expect(explanation).toContain(`$${result.data!.indicatedValue.toLocaleString()}`);
    });
  });
});
