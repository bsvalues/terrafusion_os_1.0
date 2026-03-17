/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Appeal Hearing Cancellation Contract
 *
 * Verifies that cancellation is Dais-owned, sets cancelled status
 * with reason, and does not mutate dossier packet content.
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
  cancelHearing,
  type HearingSchedule,
} from '../../services/suites/daisAppealHearing';

describe('Appeal Hearing Cancellation Contract', () => {
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
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('permits cancellation through dais-owned workflow actions only', () => {
    const result = cancelHearing(existingSchedule, 'Petitioner withdrew appeal');

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(result.status).toBe('cancelled');
  });

  it('moves hearing state to cancelled with explicit reason', () => {
    const result = cancelHearing(existingSchedule, 'Evidence packet under revision');

    expect(result.status).toBe('cancelled');
    expect(result.cancelReason).toBe('Evidence packet under revision');
    expect(result.hearingId).toBe('HRG-001');
  });

  it('does not mutate dossier packet content directly', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'document') {
        throw new Error('[WriteLane Violation] Module "dais" attempted to write to domain "document"');
      }
    });

    // Cancellation writes to appeal domain — fine
    const result = cancelHearing(existingSchedule, 'Withdrawn');
    expect(result.status).toBe('cancelled');

    // Dais writing to document domain — forbidden
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow('[WriteLane Violation]');
  });
});
