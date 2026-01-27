/**
 * Defense Packet Composer Tests
 *
 * Validates defense packet composition with approach integration
 */

import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { composeDefensePacket, type DefensePacketInput } from '../src/defense-packet-composer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas
const inputSchema = JSON.parse(
  readFileSync(
    join(__dirname, '../../contracts/schemas/defense_packet_input.json'),
    'utf-8'
  )
);
const outputSchema = JSON.parse(
  readFileSync(
    join(__dirname, '../../contracts/schemas/defense_packet_output.json'),
    'utf-8'
  )
);

// Load fixtures
const fixture3Approach = JSON.parse(
  readFileSync(
    join(__dirname, '../fixtures/defense_packet/residential_3approach.json'),
    'utf-8'
  )
);
const fixtureSalesOnly = JSON.parse(
  readFileSync(
    join(__dirname, '../fixtures/defense_packet/sales_only.json'),
    'utf-8'
  )
);

// Setup Ajv
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);
const validateOutput = ajv.compile(outputSchema);

describe('Defense Packet Composer', () => {
  describe('schema validation', () => {
    it('should validate input schema against 3-approach fixture', () => {
      const valid = validateInput(fixture3Approach.input);
      if (!valid) {
        console.error(validateInput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate input schema against sales-only fixture', () => {
      const valid = validateInput(fixtureSalesOnly.input);
      if (!valid) {
        console.error(validateInput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate output schema against composed packet', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const valid = validateOutput(result.output);
      if (!valid) {
        console.error(validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should reject input missing required fields', () => {
      const invalidInput = {
        subjectId: 'TEST-001',
        // Missing effectiveDate, salePrice, finalValue
      } as DefensePacketInput;

      expect(() => composeDefensePacket(invalidInput)).toThrow();
    });
  });

  describe('three approach integration', () => {
    it('should include all three approach sections when all are provided', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.B_sales.developed).toBe(true);
      expect(result.output.sections.C_income.developed).toBe(true);
      expect(result.output.sections.D_reconciliation.finalValue).toBe(fixture3Approach.expected.sections.D_reconciliation.finalValue);
    });

    it('should match sales approach indicated value', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.B_sales.indicatedValue).toBe(
        fixture3Approach.expected.sections.B_sales.indicatedValue
      );
    });

    it('should match income approach indicated value', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.C_income.indicatedValue).toBe(
        fixture3Approach.expected.sections.C_income.indicatedValue
      );
    });

    it('should include comparable sales table', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const salesSection = result.output.sections.B_sales;

      const compTable = salesSection.tables.find(t => t.name === 'Comparable Sales Grid');
      expect(compTable).toBeDefined();
      expect(compTable!.rows.length).toBe(3); // 3 comparables
    });

    it('should include income summary table', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const incomeSection = result.output.sections.C_income;

      const summaryTable = incomeSection.tables.find(t => t.name === 'Income Approach Summary');
      expect(summaryTable).toBeDefined();
    });
  });

  describe('missing approach handling', () => {
    it('should show "Not Developed" for missing income approach', () => {
      const result = composeDefensePacket(fixtureSalesOnly.input);

      expect(result.output.sections.C_income.developed).toBe(false);
      expect(result.output.sections.C_income.indicatedValue).toBeNull();
      expect(result.output.sections.C_income.notDevelopedReason).toContain('Not Developed');
    });

    it('should show "Not Developed" for missing cost approach', () => {
      const result = composeDefensePacket(fixtureSalesOnly.input);

      expect(result.output.sections.B_sales.developed).toBe(true); // Sales is developed
      // Cost is not developed
      const costSection = result.output.sections.A_subject; // Grab any section
      // Actually check cost via the sales-only fixture
      const costResult = composeDefensePacket(fixtureSalesOnly.input);
      
      // The cost section should show "Not Developed" since costApproach is not in input
      expect(costResult.output.sections.E_exhibits.calculationSummary.costApproachDeveloped).toBe(false);
    });

    it('should not have null holes in sections', () => {
      const result = composeDefensePacket(fixtureSalesOnly.input);

      // All sections should exist
      expect(result.output.sections.A_subject).toBeDefined();
      expect(result.output.sections.B_sales).toBeDefined();
      expect(result.output.sections.C_income).toBeDefined();
      expect(result.output.sections.D_reconciliation).toBeDefined();
      expect(result.output.sections.E_exhibits).toBeDefined();

      // Missing approaches should have explicit language
      expect(result.output.sections.C_income.narrative).toBeTruthy();
      expect(result.output.sections.C_income.narrative.length).toBeGreaterThan(0);
    });
  });

  describe('reconciliation conclusion matching', () => {
    it('should ensure reconciliation finalValue matches packet finalValue', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.D_reconciliation.finalValue).toBe(result.output.finalValue);
    });

    it('should include reconciliation method in section', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.D_reconciliation.method).toBe('weighted_average');
    });

    it('should include weights in reconciliation section', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const weights = result.output.sections.D_reconciliation.weights;

      expect(weights.sales).toBe(0.60);
      expect(weights.income).toBe(0.10);
      expect(weights.cost).toBe(0.30);
    });

    it('should generate conclusion narrative', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.sections.D_reconciliation.conclusion).toContain('$370,625');
      expect(result.output.sections.D_reconciliation.conclusion).toContain('weighted average');
    });
  });

  describe('ratio and status calculation', () => {
    it('should calculate correct ratio from finalValue/salePrice', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.ratio).toBe(fixture3Approach.expected.ratio);
    });

    it('should determine correct status based on ratio', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.status).toBe(fixture3Approach.expected.status);
    });

    it('should return "Review Required" for ratio 0.8-0.9', () => {
      const input: DefensePacketInput = {
        ...fixture3Approach.input,
        finalValue: 34000000, // 34M / 38.5M = 0.88
      };

      const result = composeDefensePacket(input);

      expect(result.output.ratio).toBe(0.88);
      expect(result.output.status).toBe('Review Required');
    });

    it('should return "Appeal Likely" for ratio < 0.8', () => {
      const input: DefensePacketInput = {
        ...fixture3Approach.input,
        finalValue: 28000000, // 28M / 38.5M = 0.73
      };

      const result = composeDefensePacket(input);

      expect(result.output.ratio).toBe(0.73);
      expect(result.output.status).toBe('Appeal Likely');
    });
  });

  describe('determinism', () => {
    it('should produce identical output for identical input', () => {
      const result1 = composeDefensePacket(fixture3Approach.input);
      const result2 = composeDefensePacket(fixture3Approach.input);

      expect(result1.output.finalValue).toBe(result2.output.finalValue);
      expect(result1.output.ratio).toBe(result2.output.ratio);
      expect(result1.output.status).toBe(result2.output.status);
      expect(result1.output.packetHash).toBe(result2.output.packetHash);
    });

    it('should produce consistent packet hash', () => {
      const result1 = composeDefensePacket(fixture3Approach.input);
      const result2 = composeDefensePacket(fixture3Approach.input);

      expect(result1.output.packetHash).toBe(result2.output.packetHash);
      expect(result1.output.packetHash).toHaveLength(16);
    });
  });

  describe('subject section', () => {
    it('should include parcel ID and address', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const subject = result.output.sections.A_subject;

      expect(subject.content.parcelId).toBe(fixture3Approach.input.subjectId);
      expect(subject.content.address).toBe(fixture3Approach.input.propertyAddress);
    });

    it('should include assumptions', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const subject = result.output.sections.A_subject;

      expect(subject.content.assumptions).toEqual(fixture3Approach.input.assumptions);
    });

    it('should generate subject narrative', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const subject = result.output.sections.A_subject;

      expect(subject.content.narrative).toContain(fixture3Approach.input.subjectId);
      expect(subject.content.narrative).toContain(fixture3Approach.input.effectiveDate);
    });
  });

  describe('exhibits section', () => {
    it('should include audit trail pointers', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const exhibits = result.output.sections.E_exhibits;

      expect(exhibits.auditEventIds).toContain('audit-sales-001');
      expect(exhibits.auditEventIds).toContain('audit-recon-001');
    });

    it('should include model inputs', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const exhibits = result.output.sections.E_exhibits;

      expect(exhibits.modelInputs.subjectId).toBe(fixture3Approach.input.subjectId);
      expect(exhibits.modelInputs.pipelineVersion).toBe('1.0.0');
    });

    it('should include calculation summary', () => {
      const result = composeDefensePacket(fixture3Approach.input);
      const exhibits = result.output.sections.E_exhibits;

      expect(exhibits.calculationSummary.salesApproachDeveloped).toBe(true);
      expect(exhibits.calculationSummary.incomeApproachDeveloped).toBe(true);
      expect(exhibits.calculationSummary.costApproachDeveloped).toBe(true);
    });
  });

  describe('audit events', () => {
    it('should generate defense_packet_composed audit event', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.auditEvent.type).toBe('defense_packet_composed');
      expect(result.auditEvent.subjectId).toBe(fixture3Approach.input.subjectId);
    });

    it('should include approach status in audit event', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.auditEvent.details.approachesDeveloped).toEqual({
        sales: true,
        income: true,
        cost: true,
      });
    });

    it('should include packet hash in audit event', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.auditEvent.details.packetHash).toBe(result.output.packetHash);
    });
  });

  describe('summary generation', () => {
    it('should generate executive summary', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.summary).toContain('$370,625');
      expect(result.output.summary).toContain('$385,000');
      expect(result.output.summary).toContain('0.96');
      expect(result.output.summary).toContain('OK');
    });

    it('should list approaches used in summary', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.summary).toContain('Sales');
      expect(result.output.summary).toContain('Income');
      expect(result.output.summary).toContain('Cost');
    });
  });

  describe('warnings aggregation', () => {
    it('should collect warnings from all approaches', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      // Income approach has a warning in the fixture
      expect(result.output.warnings).toContain('Limited rental data for single-family in this market');
    });
  });

  describe('version tracking', () => {
    it('should include packet version', () => {
      const result = composeDefensePacket(fixture3Approach.input);

      expect(result.output.version).toBe('1.0.0');
    });
  });
});
