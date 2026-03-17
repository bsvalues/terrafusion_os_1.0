/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Appeal Certification Readiness Contract
 *
 * Verifies that certification readiness is computed correctly,
 * blockers are enumerated, and sign-off requires complete facts.
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
  checkCertificationReadiness,
  type CertificationReadinessInput,
} from '../../services/suites/daisAppealCertification';

describe('Appeal Certification Readiness Contract', () => {
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
  });

  it('computes ready vs blocked certification state for a parcel appeal', () => {
    const ready = checkCertificationReadiness(readyInput);
    expect(ready.ready).toBe(true);
    expect(ready.blockers).toHaveLength(0);

    const blocked = checkCertificationReadiness({ ...readyInput, outcomeRecorded: false });
    expect(blocked.ready).toBe(false);
  });

  it('enumerates blockers explicitly', () => {
    const result = checkCertificationReadiness({
      ...readyInput,
      outcomeRecorded: false,
      hearingCompleted: false,
      noticeGenerated: false,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('appeal outcome must be recorded');
    expect(result.blockers).toContain('hearing must be completed');
    expect(result.blockers).toContain('notice must be generated');
  });

  it('permits sign-off readiness only when required appeal facts are complete', () => {
    const noPacket = checkCertificationReadiness({ ...readyInput, packetValid: false });
    expect(noPacket.ready).toBe(false);
    expect(noPacket.blockers).toContain('packet reference is invalid or revised');

    const noAppeal = checkCertificationReadiness({ ...readyInput, appealId: '' });
    expect(noAppeal.ready).toBe(false);
    expect(noAppeal.blockers).toContain('appeal ID is required');
  });
});
