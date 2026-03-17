/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Appeal Hearing Reschedule Contract
 *
 * Verifies that rescheduling is Dais-owned, preserves prior hearing
 * reference, and recomputes blocked state on packet drift.
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
  scheduleHearing,
  rescheduleHearing,
  type HearingInput,
  type HearingSchedule,
  type DeadlineState,
} from '../../services/suites/daisAppealHearing';

describe('Appeal Hearing Reschedule Contract', () => {
  const validDeadline: DeadlineState = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    packetValid: true,
    filingDeadline: '2026-04-14T10:00:00Z',
    hearingDeadline: '2026-05-14T10:00:00Z',
    createdAt: '2026-03-15T10:00:00Z',
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

  const newInput: HearingInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    hearingDate: '2026-04-25',
    hearingTime: '10:00',
    location: 'Benton County BOE Room 301',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('permits reschedule through dais-owned workflow actions only', () => {
    const result = rescheduleHearing(existingSchedule, newInput, validDeadline);

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(result.success).toBe(true);
    expect(result.schedule!.hearingDate).toBe('2026-04-25');
    expect(result.schedule!.status).toBe('rescheduled');
  });

  it('preserves immutable prior hearing reference in trace/history model', () => {
    const result = rescheduleHearing(existingSchedule, newInput, validDeadline);

    expect(result.schedule!.priorHearingId).toBe('HRG-001');
  });

  it('recomputes blocked state when packet drift invalidates the appeal packet', () => {
    const driftedDeadline: DeadlineState = {
      ...validDeadline,
      packetValid: false,
    };

    const result = rescheduleHearing(existingSchedule, newInput, driftedDeadline);

    expect(result.success).toBe(false);
    expect(result.blockers).toContain('packet reference is invalid or revised');
  });
});
