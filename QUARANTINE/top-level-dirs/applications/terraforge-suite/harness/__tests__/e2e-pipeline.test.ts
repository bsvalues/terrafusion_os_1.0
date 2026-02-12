/**
 * E2E Pipeline Tests
 *
 * Validates the single-command proof orchestrator.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { runE2EPipeline } from '../src/e2e-pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('E2E Pipeline Orchestrator', () => {
  describe('success scenarios', () => {
    it('should complete full pipeline in stub mode with GREEN status', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('stub');
      expect(result.errors).toHaveLength(0);

      // All checks should pass
      expect(result.checks.costKernel).toBe(true);
      expect(result.checks.valuationKernel).toBe(true);
      expect(result.checks.defenseStudio).toBe(true);
      expect(result.checks.schemaValidation).toBe(true);
      expect(result.checks.determinism).toBe(true);
      expect(result.checks.auditEvents).toBe(true);
    });

    it('should produce expected deterministic values', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      // Core determinism values
      expect(result.values.totalValue).toBe(370625);
      expect(result.values.land).toBe(50000);
      expect(result.values.building).toBe(320625);

      // Cost breakdown
      expect(result.values.rcn).toBe(356250);
      expect(result.values.depreciation).toBe(35625);
      expect(result.values.rcnld).toBe(320625);

      // Defense values
      expect(result.values.ratio).toBe(0.96);
      expect(result.values.defenseStatus).toBe('OK');
    });

    it('should produce correct audit event count', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      expect(result.auditEventCount).toBe(3);
    });

    it('should write artifacts to disk', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      expect(fs.existsSync(result.artifactPath)).toBe(true);

      // Check all expected artifacts exist
      const expectedFiles = [
        'input.json',
        'cost-output.json',
        'valuation-output.json',
        'defense-output.json',
        'audit-log.json',
        'summary.json',
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(result.artifactPath, file);
        expect(fs.existsSync(filePath), `Expected ${file} to exist`).toBe(true);
      }
    });

    it('should include run metadata in summary', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      expect(result.runId).toContain('stub-');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('failure scenarios', () => {
    it('should fail when expected totalValue does not match', async () => {
      const result = await runE2EPipeline({
        mode: 'stub',
        expectedValues: { totalValue: 999999 }, // Force mismatch
      });

      expect(result.success).toBe(false);
      expect(result.checks.determinism).toBe(false);
      expect(result.errors.some(e => e.includes('Determinism mismatch'))).toBe(true);
    });

    it('should fail when expected audit count does not match', async () => {
      const result = await runE2EPipeline({
        mode: 'stub',
        expectedValues: { auditEventCount: 10 }, // Force mismatch
      });

      expect(result.success).toBe(false);
      expect(result.checks.auditEvents).toBe(false);
      expect(result.errors.some(e => e.includes('Audit count mismatch'))).toBe(true);
    });

    it('should still write artifacts on failure', async () => {
      const result = await runE2EPipeline({
        mode: 'stub',
        expectedValues: { totalValue: 999999 },
      });

      expect(result.success).toBe(false);

      // Artifacts should still exist
      expect(fs.existsSync(result.artifactPath)).toBe(true);
      expect(fs.existsSync(path.join(result.artifactPath, 'summary.json'))).toBe(true);

      // Summary should show failure
      const summary = JSON.parse(
        fs.readFileSync(path.join(result.artifactPath, 'summary.json'), 'utf-8')
      );
      expect(summary.success).toBe(false);
    });

    it('should fail when defense status expectation does not match', async () => {
      const result = await runE2EPipeline({
        mode: 'stub',
        expectedValues: { defenseStatus: 'Appeal Likely' as const }, // Force mismatch
      });

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Defense status mismatch'))).toBe(true);
    });
  });

  describe('artifact contents', () => {
    it('should write valid JSON in all artifact files', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      const files = [
        'input.json',
        'cost-output.json',
        'valuation-output.json',
        'defense-output.json',
        'audit-log.json',
        'summary.json',
      ];

      for (const file of files) {
        const content = fs.readFileSync(path.join(result.artifactPath, file), 'utf-8');
        expect(() => JSON.parse(content), `${file} should be valid JSON`).not.toThrow();
      }
    });

    it('should include all audit events in audit-log.json', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      const auditLog = JSON.parse(
        fs.readFileSync(path.join(result.artifactPath, 'audit-log.json'), 'utf-8')
      );

      expect(auditLog).toHaveLength(3);

      // Check audit event structure
      for (const event of auditLog) {
        expect(event.eventId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.actor).toBe('system');
        expect(event.action).toBeDefined();
        expect(event.resourceId).toBeDefined();
        expect(event.module).toBeDefined();
        expect(event.hash).toBeDefined();
      }

      // Verify modules in order
      expect(auditLog[0].module).toBe('terraforge.kernel.cost');
      expect(auditLog[1].module).toBe('terraforge.kernel.valuation');
      expect(auditLog[2].module).toBe('terraforge.studio.defense');
    });

    it('should include full result structure in summary.json', async () => {
      const result = await runE2EPipeline({ mode: 'stub' });

      const summary = JSON.parse(
        fs.readFileSync(path.join(result.artifactPath, 'summary.json'), 'utf-8')
      );

      expect(summary.success).toBe(true);
      expect(summary.mode).toBe('stub');
      expect(summary.values).toBeDefined();
      expect(summary.checks).toBeDefined();
      expect(summary.errors).toBeDefined();
      expect(summary.artifactPath).toBeDefined();
    });
  });
});
