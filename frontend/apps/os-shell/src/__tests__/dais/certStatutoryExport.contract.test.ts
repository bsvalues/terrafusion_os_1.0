/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Cert Statutory Export Contract
 *
 * Verifies that export models are built only from signed batches,
 * include immutable references, and block on drifted sign-off state.
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
  buildStatutoryExportModel,
  type SignedCertBatch,
} from '../../services/suites/daisCertRoll';

describe('Cert Statutory Export Contract', () => {
  const signedBatch: SignedCertBatch = {
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
    status: 'signed',
    createdAt: '2026-03-16T10:00:00Z',
    signedBy: 'assessor-smith',
    signedAt: '2026-03-16T11:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('builds a deterministic statutory export model only from signed certification batches', () => {
    const result = buildStatutoryExportModel(signedBatch);

    expect(result.success).toBe(true);
    expect(result.exportModel).toBeDefined();
    expect(result.exportModel!.batchId).toBe('CBATCH-001');
    expect(result.exportModel!.status).toBe('ready');
  });

  it('includes immutable parcel and certification references', () => {
    const result = buildStatutoryExportModel(signedBatch);

    expect(result.exportModel!.parcelIds).toContain('P-100');
    expect(result.exportModel!.signedBy).toBe('assessor-smith');
    expect(result.exportModel!.signedAt).toBe('2026-03-16T11:00:00Z');
    expect(result.exportModel!.exportId).toBeDefined();
  });

  it('blocks export generation when sign-off state or readiness facts drift', () => {
    const unsignedBatch: SignedCertBatch = {
      ...signedBatch,
      status: 'pending' as 'signed',
    };

    const result = buildStatutoryExportModel(unsignedBatch);

    expect(result.success).toBe(false);
    expect(result.blockers).toContain('batch is not signed');
  });
});
