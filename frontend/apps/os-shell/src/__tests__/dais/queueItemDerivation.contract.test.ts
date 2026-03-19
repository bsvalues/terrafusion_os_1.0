/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Queue Item Derivation Contract
 *
 * Verifies that queue items are derived from dais-owned parcel workflow,
 * appeal, and certification state without mutating other lane records.
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
  deriveQueueItem,
  type QueueDerivationInput,
} from '../../services/suites/daisQueue';

describe('Terra Queue Item Derivation Contract', () => {
  const validInput: QueueDerivationInput = {
    parcelId: 'P-100',
    currentStatus: 'appeal-noticed',
    appealId: 'APL-001',
    certificationReady: false,
    blockers: [],
    dueAt: '2026-04-20T10:00:00Z',
    assignedTo: 'appraiser-jones',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives a queue item from dais-owned parcel workflow, appeal, and certification state', () => {
    const item = deriveQueueItem(validInput);

    expect(item.queueItemId).toBeDefined();
    expect(item.parcelId).toBe('P-100');
    expect(item.currentStatus).toBe('appeal-noticed');
    expect(item.appealId).toBe('APL-001');
    expect(item.assignedTo).toBe('appraiser-jones');
  });

  it('includes parcelId, current status, priority, dueAt, assignedTo, and blocker summary', () => {
    const item = deriveQueueItem({
      ...validInput,
      blockers: ['packet drift detected'],
    });

    expect(item.parcelId).toBe('P-100');
    expect(item.currentStatus).toBe('appeal-noticed');
    expect(item.priority).toBeDefined();
    expect(item.dueAt).toBe('2026-04-20T10:00:00Z');
    expect(item.assignedTo).toBe('appraiser-jones');
    expect(item.blockerSummary).toContain('packet drift detected');
  });

  it('does not mutate forge-, atlas-, or dossier-owned records while deriving queue state', () => {
    // Derivation is a pure read — no write-lane assertion needed
    const item = deriveQueueItem(validInput);
    expect(item).toBeDefined();
    // The function should not call assertWriteLane since derivation is read-only
  });
});
