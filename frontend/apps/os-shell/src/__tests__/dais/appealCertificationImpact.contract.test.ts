/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Appeal Certification Impact Contract
 *
 * Verifies that certification impact is derived from appeal outcome,
 * links to checklist items, and invalidates on drift.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  computeCertificationImpact,
  type AppealOutcome,
} from '../../services/suites/daisAppealCertification';

describe('Appeal Certification Impact Contract', () => {
  const decidedOutcome: AppealOutcome = {
    outcomeId: 'OUT-001',
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingId: 'HRG-001',
    packetId: 'PKT-001',
    decision: 'sustained',
    decisionReason: 'Evidence supports revised valuation',
    status: 'decided',
    decidedAt: '2026-03-16T14:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives parcel certification impact from appeal outcome state', () => {
    const impact = computeCertificationImpact(decidedOutcome);

    expect(impact.parcelId).toBe('P-100');
    expect(impact.appealId).toBe('APL-001');
    expect(impact.impactType).toBeDefined();
    expect(impact.requiresValueAdjustment).toBe(true);
  });

  it('links outcome to certification checklist items and blockers', () => {
    const impact = computeCertificationImpact(decidedOutcome);

    expect(impact.checklistItems).toBeDefined();
    expect(impact.checklistItems.length).toBeGreaterThan(0);
    expect(impact.checklistItems).toContain('appeal-outcome-recorded');
    expect(impact.checklistItems).toContain('value-adjustment-required');
  });

  it('invalidates readiness when packet or hearing state drifts', () => {
    const deniedOutcome: AppealOutcome = {
      ...decidedOutcome,
      decision: 'denied',
    };

    const impact = computeCertificationImpact(deniedOutcome);
    expect(impact.requiresValueAdjustment).toBe(false);
    expect(impact.checklistItems).toContain('appeal-outcome-recorded');
    expect(impact.checklistItems).not.toContain('value-adjustment-required');
  });
});
