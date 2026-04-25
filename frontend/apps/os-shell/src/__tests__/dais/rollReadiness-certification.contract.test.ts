/// <reference types="vitest" />
/**
 * rollReadiness-certification.contract.test.ts
 *
 * Contract gates for the Roll Readiness certification export gate.
 *
 * GATE 1: RollReadiness imports invokeTool from pilotApi
 * GATE 2: uses export_equalization_package tool ID
 * GATE 3: human-gate checkbox is required before action fires
 * GATE 4: draft version state is present and wired to input
 * GATE 5: cert-gate data-testid exists
 * GATE 6: overdue warning testid present (hazard disclosure)
 * GATE 7: success/error states have distinct testids
 * GATE 8: correlationId is surfaced on error
 * GATE 9: checklist is rendered in success state
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const SRC = fs.readFileSync(
  path.join(ROOT, 'src/pages/dais/RollReadiness.tsx'),
  'utf8',
);

describe('RollReadiness — certification export gate contract', () => {
  it('GATE 1: imports invokeTool from pilotApi', () => {
    expect(SRC).toContain("from '@/api/pilotApi'");
    expect(SRC).toContain('invokeTool');
  });

  it('GATE 2: uses export_equalization_package as toolId', () => {
    expect(SRC).toContain("'export_equalization_package'");
  });

  it('GATE 3: certConfirmed checkbox gates the export button (disabled when not confirmed)', () => {
    expect(SRC).toContain('certConfirmed');
    expect(SRC).toContain('data-testid="cert-gate-checkbox"');
    expect(SRC).toContain('disabled={!certConfirmed');
  });

  it('GATE 4: draftVersion state is present and wired to input', () => {
    expect(SRC).toContain('draftVersion');
    expect(SRC).toContain('data-testid="cert-draft-version-input"');
  });

  it('GATE 5: certification gate card has correct testid', () => {
    expect(SRC).toContain('data-testid="roll-certification-gate"');
  });

  it('GATE 6: overdue warning hazard disclosure is present', () => {
    expect(SRC).toContain('data-testid="cert-gate-overdue-warning"');
    expect(SRC).toContain('hasOverdue');
  });

  it('GATE 7: success and error states have distinct data-testids', () => {
    expect(SRC).toContain('data-testid="cert-gate-success"');
    expect(SRC).toContain('data-testid="cert-gate-error"');
  });

  it('GATE 8: correlationId is surfaced on both error and success states', () => {
    expect(SRC).toContain('certState.correlationId');
  });

  it('GATE 9: checklist is rendered in success state', () => {
    expect(SRC).toContain('data-testid="cert-gate-checklist"');
    expect(SRC).toContain('certState.result.checklist');
  });
});
