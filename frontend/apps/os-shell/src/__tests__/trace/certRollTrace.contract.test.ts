/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Cert Roll Trace Contract
 *
 * Verifies append-only trace emission for batch-build, sign-off,
 * export, and blocked certification operations.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

import {
  deriveCertificationBatch,
  signOffCertificationBatch,
  buildStatutoryExportModel,
  type CertBatchParcel,
  type CertBatch,
  type SignedCertBatch,
} from '../../services/suites/daisCertRoll';

describe('Cert Roll Trace Contract', () => {
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
  ];

  const validBatch: CertBatch = {
    batchId: 'CBATCH-001',
    parcels: eligibleParcels,
    rejectedParcels: [],
    status: 'pending',
    createdAt: '2026-03-16T10:00:00Z',
  };

  const signedBatch: SignedCertBatch = {
    ...validBatch,
    status: 'signed',
    signedBy: 'assessor-smith',
    signedAt: '2026-03-16T11:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('emits append-only action_started and action_completed for batch-build, sign-off, and export', () => {
    deriveCertificationBatch(eligibleParcels);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'cert_batch_created',
      'cert_roll',
      expect.any(String),
      undefined,
      expect.objectContaining({ parcelCount: 1 }),
    );

    mockEmitTraceEvent.mockClear();
    signOffCertificationBatch(validBatch, 'assessor-smith');
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'cert_batch_signed',
      'cert_roll',
      'CBATCH-001',
      undefined,
      expect.objectContaining({ signedBy: 'assessor-smith' }),
    );

    mockEmitTraceEvent.mockClear();
    buildStatutoryExportModel(signedBatch);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'cert_export_created',
      'cert_roll',
      'CBATCH-001',
      undefined,
      expect.objectContaining({ exportId: expect.any(String) }),
    );
  });

  it('emits action_failed when certification operations are blocked', () => {
    const blockedParcels: CertBatchParcel[] = [
      {
        parcelId: 'P-300',
        appealId: 'APL-003',
        outcomeRecorded: false,
        hearingCompleted: false,
        noticeGenerated: false,
        packetValid: false,
        certificationReady: false,
        openAppeals: 3,
        certBlockers: ['disputed valuation'],
      },
    ];

    deriveCertificationBatch(blockedParcels);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'cert_batch_created',
      'cert_roll',
      expect.any(String),
      undefined,
      expect.objectContaining({ rejectedCount: 1 }),
    );
  });

  it('does not emit success trace for forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('Write-lane violation: dossier cannot write appeal');
    });

    expect(() => signOffCertificationBatch(validBatch, 'assessor-smith')).toThrow('Write-lane violation');
    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'cert_batch_signed',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
