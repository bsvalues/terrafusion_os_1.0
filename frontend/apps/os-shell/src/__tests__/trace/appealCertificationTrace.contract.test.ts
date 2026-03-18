/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Appeal Certification Trace Contract
 *
 * Verifies append-only trace emission for outcome recording,
 * certification readiness, and cross-lane rejection.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

import {
  recordAppealOutcome,
  checkCertificationReadiness,
  type OutcomeInput,
  type CertificationReadinessInput,
} from '../../services/suites/daisAppealCertification';

describe('Appeal Certification Trace Contract', () => {
  const validOutcomeInput: OutcomeInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingId: 'HRG-001',
    packetId: 'PKT-001',
    hearingStatus: 'scheduled',
    packetValid: true,
    decision: 'sustained',
    decisionReason: 'Evidence supports revised valuation',
  };

  const readyInput: CertificationReadinessInput = {
    parcelId: 'P-100',
    appealId: 'APL-001',
    outcomeRecorded: true,
    decision: 'sustained',
    packetValid: true,
    hearingCompleted: true,
    noticeGenerated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('emits append-only action_started and action_completed for outcome + readiness actions', () => {
    recordAppealOutcome(validOutcomeInput);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_outcome_recorded',
      'certification',
      expect.any(String),
      undefined,
      expect.objectContaining({
        appealId: 'APL-001',
        decision: 'sustained',
      }),
    );

    mockEmitTraceEvent.mockClear();

    checkCertificationReadiness(readyInput);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'certification_readiness_checked',
      'certification',
      'P-100',
      undefined,
      expect.objectContaining({
        ready: true,
      }),
    );
  });

  it('emits action_failed when certification readiness is blocked', () => {
    const blockedInput: CertificationReadinessInput = {
      ...readyInput,
      outcomeRecorded: false,
    };

    checkCertificationReadiness(blockedInput);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'certification_readiness_blocked',
      'certification',
      'P-100',
      undefined,
      expect.objectContaining({
        blockers: expect.arrayContaining(['appeal outcome must be recorded']),
      }),
    );
  });

  it('does not emit success trace for forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => recordAppealOutcome(validOutcomeInput)).toThrow('[WriteLane Violation]');

    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'appeal_outcome_recorded',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
