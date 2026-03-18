/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Cert Roll Batch Selection Contract
 *
 * Verifies that certification batches are built only from eligible
 * dais-owned context, reject blocked parcels, and group deterministically.
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
  deriveCertificationBatch,
  type CertBatchParcel,
} from '../../services/suites/daisCertRoll';

describe('Cert Roll Batch Selection Contract', () => {
  const eligibleParcels: CertBatchParcel[] = [
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
    {
      parcelId: 'P-200',
      appealId: 'APL-002',
      outcomeRecorded: true,
      hearingCompleted: true,
      noticeGenerated: true,
      packetValid: true,
      certificationReady: true,
      openAppeals: 0,
      certBlockers: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a certification batch only from eligible dais-owned certification context', () => {
    const batch = deriveCertificationBatch(eligibleParcels);

    expect(batch.batchId).toBeDefined();
    expect(batch.parcels.length).toBe(2);
    expect(batch.status).toBe('pending');
    expect(batch.rejectedParcels).toHaveLength(0);
  });

  it('rejects parcels blocked by open appeals, unresolved certification blockers, or required notice state', () => {
    const blockedParcels: CertBatchParcel[] = [
      {
        parcelId: 'P-300',
        appealId: 'APL-003',
        outcomeRecorded: false,
        hearingCompleted: false,
        noticeGenerated: false,
        packetValid: true,
        certificationReady: false,
        openAppeals: 2,
        certBlockers: ['unresolved valuation dispute'],
      },
    ];

    const batch = deriveCertificationBatch(blockedParcels);

    expect(batch.rejectedParcels).toHaveLength(1);
    expect(batch.rejectedParcels[0].parcelId).toBe('P-300');
    expect(batch.rejectedParcels[0].reasons.length).toBeGreaterThan(0);
    expect(batch.parcels).toHaveLength(0);
  });

  it('groups selected parcels deterministically for roll operations', () => {
    const batch = deriveCertificationBatch(eligibleParcels);

    expect(batch.parcels).toHaveLength(2);
    expect(batch.parcels[0].parcelId).toBe('P-100');
    expect(batch.parcels[1].parcelId).toBe('P-200');
  });
});
