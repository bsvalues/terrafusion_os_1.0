/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Appeal Deadline State Contract
 *
 * Verifies hearing state tracking (unscheduled/scheduled/blocked),
 * blocker surfacing, and deadline drift on packet revision.
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
  createDeadlineState,
  computeHearingStatus,
  checkDeadlineDrift,
  type AppealIntakeRecord,
  type DeadlineState,
} from '../../services/suites/daisAppealDeadline';

describe('Appeal Deadline State Contract', () => {
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

  it('tracks unscheduled vs scheduled vs blocked hearing state', () => {
    const result = createDeadlineState(validIntake);
    const deadline = result.deadline!;

    // Initially unscheduled
    const unscheduled = computeHearingStatus(deadline);
    expect(unscheduled.hearingState).toBe('unscheduled');

    // Schedule it
    const scheduled: DeadlineState = {
      ...deadline,
      hearingScheduledAt: '2026-04-15T14:00:00Z',
    };
    const scheduledStatus = computeHearingStatus(scheduled);
    expect(scheduledStatus.hearingState).toBe('scheduled');

    // Block it by removing packet reference
    const blocked: DeadlineState = {
      ...deadline,
      packetValid: false,
    };
    const blockedStatus = computeHearingStatus(blocked);
    expect(blockedStatus.hearingState).toBe('blocked');
  });

  it('surfaces blockers when required packet or appeal fields are missing', () => {
    const result = createDeadlineState(validIntake);
    const deadline = result.deadline!;

    const blocked: DeadlineState = {
      ...deadline,
      packetValid: false,
    };

    const status = computeHearingStatus(blocked);
    expect(status.hearingState).toBe('blocked');
    expect(status.blockers.length).toBeGreaterThan(0);
    expect(status.blockers).toContain('packet reference is invalid or revised');
  });

  it('marks deadline drift when the referenced packet is revised', () => {
    const result = createDeadlineState(validIntake);
    const deadline = result.deadline!;

    const drift = checkDeadlineDrift(deadline, 'draft');

    expect(drift.drifted).toBe(true);
    expect(drift.reason).toContain('packet has been revised');
  });
});
