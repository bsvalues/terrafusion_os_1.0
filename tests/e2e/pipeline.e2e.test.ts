/** @vitest-environment node */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { runE2EPipeline } from '../../scripts/e2e-pipeline.ts';

describe('E2E pipeline orchestrator', () => {
  it('completes the stub pipeline with deterministic values', async () => {
    const result = await runE2EPipeline({ mode: 'stub' });

    expect(result.success).toBe(true);
    expect(result.mode).toBe('stub');
    expect(result.values.totalValue).toBe(370625);
    expect(result.auditEventCount).toBe(3);

    const summaryPath = path.join(result.artifactPath, 'summary.json');
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.success).toBe(true);
    expect(summary.values.totalValue).toBe(370625);
  });

  it('fails when determinism expectations are violated', async () => {
    const result = await runE2EPipeline({
      mode: 'stub',
      expectedValues: { totalValue: 999999 },
    });

    expect(result.success).toBe(false);
    expect(result.checks.determinism).toBe(false);
    expect(result.errors.some(error => error.includes('Determinism mismatch'))).toBe(true);

    const summaryPath = path.join(result.artifactPath, 'summary.json');
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.success).toBe(false);
  });
});
