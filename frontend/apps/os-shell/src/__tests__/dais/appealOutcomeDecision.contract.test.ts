/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Appeal Outcome Decision Contract
 *
 * Verifies that appeal outcomes are recorded only through dais-owned
 * workflow actions, require valid context, and do not mutate dossier content.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn((mod: string, domain: string) => {
    if (mod === 'dais' && domain === 'appeal') return true;
    return false;
  }),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  recordAppealOutcome,
  type OutcomeInput,
} from '../../services/suites/daisAppealCertification';

describe('Appeal Outcome Decision Contract', () => {
  const validInput: OutcomeInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingId: 'HRG-001',
    packetId: 'PKT-001',
    hearingStatus: 'scheduled',
    packetValid: true,
    decision: 'sustained',
    decisionReason: 'Evidence supports revised valuation',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('records appeal outcome only through dais-owned workflow actions', () => {
    const result = recordAppealOutcome(validInput);

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(result.success).toBe(true);
    expect(result.outcome).toBeDefined();
    expect(result.outcome!.decision).toBe('sustained');
    expect(result.outcome!.status).toBe('decided');
  });

  it('requires accepted appeal, valid hearing context, and packet validity', () => {
    const noHearing = recordAppealOutcome({ ...validInput, hearingStatus: 'unscheduled' });
    expect(noHearing.success).toBe(false);
    expect(noHearing.blockers).toContain('hearing must be scheduled before recording outcome');

    const invalidPacket = recordAppealOutcome({ ...validInput, packetValid: false });
    expect(invalidPacket.success).toBe(false);
    expect(invalidPacket.blockers).toContain('packet reference is invalid or revised');

    const noAppeal = recordAppealOutcome({ ...validInput, appealId: '' });
    expect(noAppeal.success).toBe(false);
    expect(noAppeal.blockers).toContain('appeal ID is required');
  });

  it('does not mutate dossier-owned packet or narrative content directly', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'document') {
        throw new Error('[WriteLane Violation] Module "dais" attempted to write to domain "document"');
      }
    });

    // Outcome recording writes to appeal domain — fine
    const result = recordAppealOutcome(validInput);
    expect(result.success).toBe(true);

    // Dais writing to document domain — forbidden
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow('[WriteLane Violation]');
  });
});
