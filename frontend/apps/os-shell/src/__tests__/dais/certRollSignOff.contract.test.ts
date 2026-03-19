/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Cert Roll Sign-Off Contract
 *
 * Verifies that sign-off is dais-owned, records state without dossier
 * mutation, and fails when parcels are not sign-off eligible.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  signOffCertificationBatch,
  type CertBatch,
} from '../../services/suites/daisCertRoll';

describe('Cert Roll Sign-Off Contract', () => {
  const validBatch: CertBatch = {
    batchId: 'CBATCH-001',
    parcels: [
      {
        parcelId: 'P-100',
        appealId: 'APL-001',
        outcomeRecorded: true,
        hearingCompleted: true,
        noticeGenerated: true,
        packetValid: true,
        certificationReady: true,
        openAppeals: 0,
        certBlockers: [],
      },
    ],
    rejectedParcels: [],
    status: 'pending',
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('permits sign-off through dais-owned certification actions only', () => {
    const result = signOffCertificationBatch(validBatch, 'assessor-smith');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(result.success).toBe(true);
    expect(result.signedBatch).toBeDefined();
    expect(result.signedBatch!.status).toBe('signed');
  });

  it('records sign-off state, signer, and signedAt without mutating dossier-owned packet content', () => {
    const result = signOffCertificationBatch(validBatch, 'assessor-smith');

    expect(result.signedBatch!.signedBy).toBe('assessor-smith');
    expect(result.signedBatch!.signedAt).toBeDefined();
    expect(mockAssertWriteLane).not.toHaveBeenCalledWith('dais', 'document');
  });

  it('fails loudly when any parcel in the roll batch is not sign-off eligible', () => {
    const ineligibleBatch: CertBatch = {
      ...validBatch,
      parcels: [
        {
          parcelId: 'P-400',
          appealId: 'APL-004',
          outcomeRecorded: false,
          hearingCompleted: false,
          noticeGenerated: false,
          packetValid: false,
          certificationReady: false,
          openAppeals: 1,
          certBlockers: ['open appeal'],
        },
      ],
    };

    const result = signOffCertificationBatch(ineligibleBatch, 'assessor-smith');

    expect(result.success).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});
