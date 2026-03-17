/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Appeal Notice Eligibility Contract
 *
 * Verifies that notice generation is only permitted for valid appeals
 * with scheduled or cancelled hearing state, blocked by packet drift
 * or deadline blockers, and requires dais-owned appeal + parcel context.
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
  checkNoticeEligibility,
  type NoticeEligibilityInput,
} from '../../services/suites/daisAppealNotice';

describe('Appeal Notice Eligibility Contract', () => {
  const validInput: NoticeEligibilityInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingStatus: 'scheduled',
    packetValid: true,
    deadlineBlockers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows notice generation only for a valid appeal with scheduled or cancelled hearing state', () => {
    const scheduled = checkNoticeEligibility(validInput);
    expect(scheduled.eligible).toBe(true);
    expect(scheduled.blockers).toHaveLength(0);

    const cancelled = checkNoticeEligibility({ ...validInput, hearingStatus: 'cancelled' });
    expect(cancelled.eligible).toBe(true);

    const unscheduled = checkNoticeEligibility({ ...validInput, hearingStatus: 'unscheduled' });
    expect(unscheduled.eligible).toBe(false);
    expect(unscheduled.blockers).toContain('hearing must be scheduled or cancelled before notice generation');
  });

  it('blocks notice generation when packet drift or deadline blockers exist', () => {
    const drifted = checkNoticeEligibility({ ...validInput, packetValid: false });
    expect(drifted.eligible).toBe(false);
    expect(drifted.blockers).toContain('packet reference is invalid or revised');

    const blocked = checkNoticeEligibility({
      ...validInput,
      deadlineBlockers: ['filing deadline exceeded'],
    });
    expect(blocked.eligible).toBe(false);
    expect(blocked.blockers).toContain('filing deadline exceeded');
  });

  it('requires dais-owned appeal context and parcel context', () => {
    const noAppeal = checkNoticeEligibility({ ...validInput, appealId: '' });
    expect(noAppeal.eligible).toBe(false);
    expect(noAppeal.blockers).toContain('appeal ID is required');

    const noParcel = checkNoticeEligibility({ ...validInput, parcelId: '' });
    expect(noParcel.eligible).toBe(false);
    expect(noParcel.blockers).toContain('parcel ID is required');
  });
});
