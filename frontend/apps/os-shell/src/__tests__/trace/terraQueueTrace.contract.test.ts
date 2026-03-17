/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Terra Queue Trace Contract
 *
 * Verifies append-only trace emission for assignment, reassignment,
 * escalation, blocked mutations, and cross-lane rejection.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

import {
  assignQueueItem,
  reassignQueueItem,
  computeEscalationState,
  type QueueItem,
} from '../../services/suites/daisQueue';

describe('Terra Queue Trace Contract', () => {
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

  it('emits append-only action_started and action_completed for assign, reassign, and escalate', () => {
    const assigned = assignQueueItem(queueItem, 'appraiser-jones');

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'queue_item_assigned',
      'queue',
      'QI-001',
      undefined,
      expect.objectContaining({
        assignedTo: 'appraiser-jones',
        parcelId: 'P-100',
      }),
    );

    mockEmitTraceEvent.mockClear();

    reassignQueueItem(assigned.item!, 'appraiser-smith');

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'queue_item_reassigned',
      'queue',
      'QI-001',
      expect.objectContaining({ assignedTo: 'appraiser-jones' }),
      expect.objectContaining({ assignedTo: 'appraiser-smith' }),
    );

    mockEmitTraceEvent.mockClear();

    const overdueItem: QueueItem = { ...queueItem, dueAt: '2026-03-15T10:00:00Z', blockerSummary: ['drift'] };
    computeEscalationState(overdueItem, '2026-03-16T10:00:00Z');

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'queue_item_escalated',
      'queue',
      'QI-001',
      undefined,
      expect.objectContaining({
        escalationLevel: 'escalated',
      }),
    );
  });

  it('emits action_failed for blocked or forbidden queue mutations', () => {
    const unassignableItem: QueueItem = { ...queueItem, assignedTo: undefined };

    // Reassigning an unassigned item
    const result = reassignQueueItem(unassignableItem, 'appraiser-smith');
    expect(result.success).toBe(false);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'queue_action_blocked',
      'queue',
      'QI-001',
      undefined,
      expect.objectContaining({
        reason: expect.any(String),
      }),
    );
  });

  it('does not emit success traces for cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => assignQueueItem(queueItem, 'appraiser-jones')).toThrow('[WriteLane Violation]');

    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'queue_item_assigned',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
