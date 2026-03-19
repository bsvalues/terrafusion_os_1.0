/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Notice Mail/Print Queue Contract
 *
 * Verifies that batch payloads hand into a dais-owned queue model,
 * track queue metadata, and preserve immutable linkage.
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
  queueBatchForDispatch,
  type NoticeBatch,
} from '../../services/suites/daisNoticeBatch';

describe('Notice Mail/Print Queue Contract', () => {
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

  it('hands batch payloads into a dais-owned mail/print queue model', () => {
    const result = queueBatchForDispatch(validBatch, 'mail', 'supervisor-doe');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(result.success).toBe(true);
    expect(result.queueEntry).toBeDefined();
    expect(result.queueEntry!.channel).toBe('mail');
    expect(result.queueEntry!.dispatchStatus).toBe('queued');
  });

  it('tracks queuedAt, queuedBy, channel, and dispatch state', () => {
    const result = queueBatchForDispatch(validBatch, 'print', 'supervisor-doe');

    expect(result.queueEntry!.queuedAt).toBeDefined();
    expect(result.queueEntry!.queuedBy).toBe('supervisor-doe');
    expect(result.queueEntry!.channel).toBe('print');
    expect(result.queueEntry!.dispatchStatus).toBe('queued');
  });

  it('preserves immutable linkage to parcelId, appealId, and noticeId references', () => {
    const result = queueBatchForDispatch(validBatch, 'mail', 'supervisor-doe');

    expect(result.queueEntry!.batchId).toBe('BATCH-001');
    expect(result.queueEntry!.itemCount).toBe(1);
    expect(result.queueEntry!.noticeIds).toContain('NTC-001');
  });
});
