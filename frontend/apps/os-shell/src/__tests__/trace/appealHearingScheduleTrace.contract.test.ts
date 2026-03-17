/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Appeal Hearing Schedule Trace Contract
 *
 * Verifies trace emission for schedule, reschedule, cancel, and blocked paths.
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
  scheduleHearing,
  rescheduleHearing,
  cancelHearing,
  type HearingInput,
  type HearingSchedule,
  type DeadlineState,
} from '../../services/suites/daisAppealHearing';

describe('Appeal Hearing Schedule Trace Contract', () => {
  const validDeadline: DeadlineState = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    packetValid: true,
    filingDeadline: '2026-04-14T10:00:00Z',
    hearingDeadline: '2026-05-14T10:00:00Z',
    createdAt: '2026-03-15T10:00:00Z',
  };

  const validInput: HearingInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    hearingDate: '2026-04-20',
    hearingTime: '14:00',
    location: 'Benton County BOE Room 201',
  };

  const existingSchedule: HearingSchedule = {
    hearingId: 'HRG-001',
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    hearingDate: '2026-04-20',
    hearingTime: '14:00',
    location: 'Benton County BOE Room 201',
    status: 'scheduled',
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits append-only traces for schedule/reschedule/cancel', () => {
    // Schedule
    scheduleHearing(validInput, validDeadline);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_hearing_scheduled',
      'hearing',
      expect.any(String),
      undefined,
      expect.objectContaining({ appealId: 'APL-001', hearingDate: '2026-04-20' }),
    );

    mockEmitTraceEvent.mockClear();

    // Reschedule
    const newInput: HearingInput = { ...validInput, hearingDate: '2026-04-25' };
    rescheduleHearing(existingSchedule, newInput, validDeadline);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_hearing_rescheduled',
      'hearing',
      expect.any(String),
      expect.objectContaining({ hearingId: 'HRG-001', hearingDate: '2026-04-20' }),
      expect.objectContaining({ hearingDate: '2026-04-25' }),
    );

    mockEmitTraceEvent.mockClear();

    // Cancel
    cancelHearing(existingSchedule, 'Withdrawn');
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_hearing_cancelled',
      'hearing',
      'HRG-001',
      expect.objectContaining({ status: 'scheduled' }),
      expect.objectContaining({ status: 'cancelled', cancelReason: 'Withdrawn' }),
    );
  });

  it('emits action_failed when scheduling is blocked', () => {
    const blockedDeadline: DeadlineState = { ...validDeadline, packetValid: false };

    scheduleHearing(validInput, blockedDeadline);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_hearing_blocked',
      'hearing',
      expect.any(String),
      undefined,
      expect.objectContaining({ blockers: expect.any(Array) }),
    );
  });

  it('does not emit success trace for forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => scheduleHearing(validInput, validDeadline)).toThrow('[WriteLane Violation]');
    expect(mockEmitTraceEvent).not.toHaveBeenCalled();
  });
});
