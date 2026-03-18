/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Queue Escalation Contract
 *
 * Verifies escalation state computation from due dates and blockers,
 * explicit escalation reasons, and cert-ready parcel protection.
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
  computeEscalationState,
  type QueueItem,
} from '../../services/suites/daisQueue';

describe('Terra Queue Escalation Contract', () => {
  const now = '2026-03-16T10:00:00Z';

  const baseItem: QueueItem = {
    queueItemId: 'QI-001',
    parcelId: 'P-100',
    currentStatus: 'appeal-noticed',
    appealId: 'APL-001',
    priority: 'normal',
    dueAt: '2026-04-20T10:00:00Z',
    assignedTo: 'appraiser-jones',
    blockerSummary: [],
    certificationReady: false,
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes normal, warning, overdue, and escalated states from due date and blockers', () => {
    // Normal — plenty of time
    const normal = computeEscalationState(baseItem, now);
    expect(normal.escalationLevel).toBe('normal');

    // Warning — due within 7 days
    const warningItem = { ...baseItem, dueAt: '2026-03-22T10:00:00Z' };
    const warning = computeEscalationState(warningItem, now);
    expect(warning.escalationLevel).toBe('warning');

    // Overdue — past due
    const overdueItem = { ...baseItem, dueAt: '2026-03-15T10:00:00Z' };
    const overdue = computeEscalationState(overdueItem, now);
    expect(overdue.escalationLevel).toBe('overdue');

    // Escalated — overdue with blockers
    const escalatedItem = { ...baseItem, dueAt: '2026-03-15T10:00:00Z', blockerSummary: ['packet drift'] };
    const escalated = computeEscalationState(escalatedItem, now);
    expect(escalated.escalationLevel).toBe('escalated');
  });

  it('surfaces explicit escalation reasons', () => {
    const overdueItem = { ...baseItem, dueAt: '2026-03-15T10:00:00Z', blockerSummary: ['packet drift'] };
    const result = computeEscalationState(overdueItem, now);

    expect(result.reasons).toBeDefined();
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons).toContain('past due date');
    expect(result.reasons).toContain('packet drift');
  });

  it('prevents certification-ready parcels from being marked blocked without a lawful blocker', () => {
    const certReadyItem: QueueItem = {
      ...baseItem,
      certificationReady: true,
      blockerSummary: [],
    };

    const result = computeEscalationState(certReadyItem, now);
    expect(result.escalationLevel).toBe('normal');
    expect(result.reasons).toHaveLength(0);
  });
});
