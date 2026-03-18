/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Notice Batch Selection Contract
 *
 * Verifies that batches are created from valid dais-owned context,
 * grouped deterministically by template/event type, and reject
 * items with missing facts.
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
  deriveNoticeBatch,
  type NoticeBatchItem,
} from '../../services/suites/daisNoticeBatch';

describe('Notice Batch Selection Contract', () => {
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
    {
      noticeId: 'NTC-002',
      parcelId: 'P-200',
      appealId: 'APL-002',
      hearingId: 'HRG-002',
      templateKey: 'appeal-hearing-scheduled',
      hearingCompleted: true,
      outcomeRecorded: true,
      packetValid: true,
    },
    {
      noticeId: 'NTC-003',
      parcelId: 'P-300',
      appealId: 'APL-003',
      hearingId: 'HRG-003',
      templateKey: 'appeal-hearing-cancelled',
      hearingCompleted: false,
      outcomeRecorded: false,
      packetValid: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a batch only from valid dais-owned notice/appeal context', () => {
    const batch = deriveNoticeBatch(validItems);

    expect(batch.batchId).toBeDefined();
    expect(batch.items.length).toBe(3);
    expect(batch.status).toBe('pending');
  });

  it('groups eligible notice items deterministically by template/event type', () => {
    const batch = deriveNoticeBatch(validItems);

    const groups = batch.groups;
    expect(groups).toBeDefined();
    expect(groups['appeal-hearing-scheduled']).toHaveLength(2);
    expect(groups['appeal-hearing-cancelled']).toHaveLength(1);
  });

  it('rejects items blocked by missing hearing/outcome/certification facts', () => {
    const blockedItems: NoticeBatchItem[] = [
      {
        noticeId: 'NTC-004',
        parcelId: 'P-400',
        appealId: 'APL-004',
        hearingId: 'HRG-004',
        templateKey: 'appeal-hearing-scheduled',
        hearingCompleted: false,
        outcomeRecorded: false,
        packetValid: false,
      },
    ];

    const batch = deriveNoticeBatch(blockedItems);

    expect(batch.rejectedItems).toHaveLength(1);
    expect(batch.rejectedItems[0].noticeId).toBe('NTC-004');
    expect(batch.rejectedItems[0].reasons.length).toBeGreaterThan(0);
  });
});
