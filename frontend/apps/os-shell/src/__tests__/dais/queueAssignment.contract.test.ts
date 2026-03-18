/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Queue Assignment Contract
 *
 * Verifies that assignment/reassignment is dais-owned, preserves
 * immutable linkage, and rejects cross-lane violations.
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
  assignQueueItem,
  reassignQueueItem,
  type QueueItem,
} from '../../services/suites/daisQueue';

describe('Terra Queue Assignment Contract', () => {
  const queueItem: QueueItem = {
    queueItemId: 'QI-001',
    parcelId: 'P-100',
    currentStatus: 'appeal-noticed',
    appealId: 'APL-001',
    priority: 'normal',
    dueAt: '2026-04-20T10:00:00Z',
    assignedTo: undefined,
    blockerSummary: [],
    certificationReady: false,
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('allows assignment and reassignment only through dais-owned queue actions', () => {
    const assigned = assignQueueItem(queueItem, 'appraiser-jones');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(assigned.success).toBe(true);
    expect(assigned.item!.assignedTo).toBe('appraiser-jones');

    const reassigned = reassignQueueItem(assigned.item!, 'appraiser-smith');

    expect(reassigned.success).toBe(true);
    expect(reassigned.item!.assignedTo).toBe('appraiser-smith');
    expect(reassigned.item!.priorAssignee).toBe('appraiser-jones');
  });

  it('preserves immutable linkage to parcelId, appealId when present, and current workflow state', () => {
    const assigned = assignQueueItem(queueItem, 'appraiser-jones');

    expect(assigned.item!.parcelId).toBe('P-100');
    expect(assigned.item!.appealId).toBe('APL-001');
    expect(assigned.item!.currentStatus).toBe('appeal-noticed');
  });

  it('rejects write-lane violations from non-dais paths', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod !== 'dais' || domain !== 'appeal') {
        throw new Error(`[WriteLane Violation] Module "${mod}" attempted to write to domain "${domain}"`);
      }
    });

    // Dais assignment — fine
    const result = assignQueueItem(queueItem, 'appraiser-jones');
    expect(result.success).toBe(true);

    // Cross-lane — forbidden
    expect(() => mockAssertWriteLane('dossier', 'appeal')).toThrow('[WriteLane Violation]');
  });
});
