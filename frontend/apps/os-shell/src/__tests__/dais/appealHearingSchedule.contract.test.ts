/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Appeal Hearing Schedule Contract
 *
 * Verifies that hearing schedules are created only from valid deadlines
 * with unblocked packet references, require essential fields, and
 * transition hearing state from unscheduled to scheduled.
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
  scheduleHearing,
  validateSchedulingReadiness,
  type HearingInput,
  type DeadlineState,
} from '../../services/suites/daisAppealHearing';

describe('Appeal Hearing Schedule Contract', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates hearing schedule only from valid deadline with unblocked packet', () => {
    const result = scheduleHearing(validInput, validDeadline);

    expect(result.success).toBe(true);
    expect(result.schedule).toBeDefined();
    expect(result.schedule!.appealId).toBe('APL-001');
    expect(result.schedule!.hearingDate).toBe('2026-04-20');
    expect(result.schedule!.status).toBe('scheduled');
  });

  it('requires hearing date, time, and location fields', () => {
    const incomplete: HearingInput = {
      ...validInput,
      hearingDate: '',
      location: '',
    };

    const result = scheduleHearing(incomplete, validDeadline);

    expect(result.success).toBe(false);
    expect(result.blockers).toContain('hearing date is required');
    expect(result.blockers).toContain('hearing location is required');
  });

  it('transitions hearing state from unscheduled to scheduled', () => {
    const readiness = validateSchedulingReadiness(validDeadline);
    expect(readiness.ready).toBe(true);

    const result = scheduleHearing(validInput, validDeadline);
    expect(result.schedule!.status).toBe('scheduled');
  });

  it('rejects scheduling when deadline state is blocked', () => {
    const blockedDeadline: DeadlineState = {
      ...validDeadline,
      packetValid: false,
    };

    const result = scheduleHearing(validInput, blockedDeadline);

    expect(result.success).toBe(false);
    expect(result.blockers).toContain('packet reference is invalid or revised');
  });
});
