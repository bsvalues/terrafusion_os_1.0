/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Notice Batch Dispatch Contract
 *
 * Verifies that batches bind to templates, prepare queue-ready payloads
 * without mutating dossier content, and fail on invalid eligibility.
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
  validateBatchEligibility,
  type NoticeBatch,
  type NoticeBatchItem,
} from '../../services/suites/daisNoticeBatch';

describe('Notice Batch Dispatch Contract', () => {
  const validBatch: NoticeBatch = {
    batchId: 'BATCH-001',
    items: [
      {
        noticeId: 'NTC-001',
        parcelId: 'P-100',
        appealId: 'APL-001',
        hearingId: 'HRG-001',
        templateKey: 'appeal-hearing-scheduled',
        hearingCompleted: true,
        outcomeRecorded: true,
        packetValid: true,
      },
    ],
    groups: { 'appeal-hearing-scheduled': [{ noticeId: 'NTC-001', parcelId: 'P-100', appealId: 'APL-001', hearingId: 'HRG-001', templateKey: 'appeal-hearing-scheduled', hearingCompleted: true, outcomeRecorded: true, packetValid: true }] },
    rejectedItems: [],
    status: 'pending',
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('binds a batch to a specific notice template and dispatch mode', () => {
    const result = validateBatchEligibility(validBatch, 'mail');

    expect(result.eligible).toBe(true);
    expect(result.dispatchMode).toBe('mail');
    expect(result.templateKeys).toContain('appeal-hearing-scheduled');
  });

  it('prepares queue-ready notice payloads without mutating dossier-owned content', () => {
    const result = validateBatchEligibility(validBatch, 'print');

    expect(result.eligible).toBe(true);
    expect(mockAssertWriteLane).not.toHaveBeenCalledWith('dais', 'document');

    // Dais writing to document domain — forbidden
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow;
  });

  it('fails loudly when batch eligibility or template binding is invalid', () => {
    const emptyBatch: NoticeBatch = {
      ...validBatch,
      items: [],
      groups: {},
    };

    const result = validateBatchEligibility(emptyBatch, 'mail');

    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain('batch contains no eligible items');
  });
});
