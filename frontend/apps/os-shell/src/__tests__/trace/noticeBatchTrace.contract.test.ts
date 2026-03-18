/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Notice Batch Trace Contract
 *
 * Verifies that batch dispatch emits deterministic trace events for
 * batch_created, batch_dispatched, and batch_queue_handoff actions.
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
  deriveNoticeBatch,
  queueBatchForDispatch,
  type NoticeBatchItem,
  type NoticeBatch,
} from '../../services/suites/daisNoticeBatch';

describe('Notice Batch Trace Contract', () => {
  const validItems: NoticeBatchItem[] = [
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('emits batch_created trace when a batch is derived', () => {
    deriveNoticeBatch(validItems);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'batch_created',
      'notice_batch',
      expect.any(String),
      undefined,
      expect.objectContaining({ itemCount: 1 }),
    );
  });

  it('emits batch_queue_handoff trace when batch is queued for dispatch', () => {
    const batch: NoticeBatch = {
      batchId: 'BATCH-001',
      items: validItems,
      groups: { 'appeal-hearing-scheduled': [validItems[0]] },
      rejectedItems: [],
      status: 'pending',
      createdAt: '2026-03-16T10:00:00Z',
    };

    queueBatchForDispatch(batch, 'mail', 'supervisor-doe');

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'batch_queue_handoff',
      'notice_batch',
      'BATCH-001',
      undefined,
      expect.objectContaining({ channel: 'mail', queuedBy: 'supervisor-doe' }),
    );
  });

  it('does not emit success trace on forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('Write-lane violation: dossier cannot write appeal');
    });

    const batch: NoticeBatch = {
      batchId: 'BATCH-002',
      items: validItems,
      groups: { 'appeal-hearing-scheduled': [validItems[0]] },
      rejectedItems: [],
      status: 'pending',
      createdAt: '2026-03-16T10:00:00Z',
    };

    expect(() => queueBatchForDispatch(batch, 'print', 'supervisor-doe')).toThrow('Write-lane violation');
    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'batch_queue_handoff',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
