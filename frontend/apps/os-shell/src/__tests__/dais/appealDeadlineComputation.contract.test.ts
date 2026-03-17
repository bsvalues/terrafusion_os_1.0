/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Appeal Deadline Computation Contract
 *
 * Verifies that deadline state is created only from valid accepted
 * appeal intakes, milestones are computed deterministically, and
 * invalid inputs are rejected.
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
  type AppealIntakeRecord,
  type DeadlineState,
} from '../../services/suites/daisAppealDeadline';

describe('Appeal Deadline Computation Contract', () => {
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

  it('creates deadline state only from a valid accepted appeal intake', () => {
    const result = createDeadlineState(validIntake);

    expect(result.success).toBe(true);
    expect(result.deadline).toBeDefined();
    expect(result.deadline!.appealId).toBe('APL-001');
    expect(result.deadline!.parcelId).toBe('P-100');
    expect(result.deadline!.packetId).toBe('PKT-001');
  });

  it('computes filing/hearing milestones deterministically from appeal metadata', () => {
    const result = createDeadlineState(validIntake);
    const d = result.deadline!;

    expect(typeof d.filingDeadline).toBe('string');
    expect(typeof d.hearingDeadline).toBe('string');
    // Filing deadline should be after creation
    expect(new Date(d.filingDeadline).getTime()).toBeGreaterThan(
      new Date(validIntake.createdAt).getTime()
    );
    // Hearing deadline should be after filing deadline
    expect(new Date(d.hearingDeadline).getTime()).toBeGreaterThan(
      new Date(d.filingDeadline).getTime()
    );
  });

  it('rejects invalid or incomplete appeal inputs', () => {
    const incomplete: AppealIntakeRecord = {
      ...validIntake,
      packetSnapshotStatus: 'draft',
    };

    const result = createDeadlineState(incomplete);

    expect(result.success).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers).toContain('appeal must reference a finalized packet');
    expect(result.deadline).toBeUndefined();
  });
});
