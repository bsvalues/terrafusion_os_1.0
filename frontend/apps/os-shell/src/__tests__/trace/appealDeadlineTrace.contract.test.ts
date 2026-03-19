/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Appeal Deadline Trace Contract
 *
 * Verifies trace emission for deadline create, update, and failure paths.
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
  createDeadlineState,
  type AppealIntakeRecord,
} from '../../services/suites/daisAppealDeadline';

describe('Appeal Deadline Trace Contract', () => {
  const validIntake: AppealIntakeRecord = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    packetSnapshotStatus: 'finalized',
    status: 'pending',
    narrativeIncluded: true,
    coverSheetIncluded: true,
    sectionCount: 3,
    totalItems: 5,
    createdAt: '2026-03-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits append-only action_started and action_completed for deadline create/update', () => {
    createDeadlineState(validIntake);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_deadline_created',
      'appeal',
      'APL-001',
      undefined,
      expect.objectContaining({
        parcelId: 'P-100',
        packetId: 'PKT-001',
        hearingState: 'unscheduled',
      }),
    );
  });

  it('emits action_failed when deadline state is blocked', () => {
    const incomplete: AppealIntakeRecord = {
      ...validIntake,
      packetSnapshotStatus: 'draft',
    };

    createDeadlineState(incomplete);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_deadline_blocked',
      'appeal',
      'APL-001',
      undefined,
      expect.objectContaining({ blockers: expect.any(Array) }),
    );
  });

  it('does not emit success trace for forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => createDeadlineState(validIntake)).toThrow('[WriteLane Violation]');
    expect(mockEmitTraceEvent).not.toHaveBeenCalled();
  });
});
