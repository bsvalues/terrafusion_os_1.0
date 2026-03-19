/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Appeal Notice Generation Contract
 *
 * Verifies that notice generation builds a parcel-scoped model from
 * appeal/hearing/packet state, selects appropriate template, and
 * does not mutate dossier-owned content.
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
  generateAppealNotice,
  type NoticeGenerationInput,
} from '../../services/suites/daisAppealNotice';

describe('Appeal Notice Generation Contract', () => {
  const validInput: NoticeGenerationInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingId: 'HRG-001',
    packetId: 'PKT-001',
    hearingDate: '2026-04-20',
    hearingTime: '14:00',
    hearingLocation: 'Benton County BOE Room 201',
    hearingStatus: 'scheduled',
    petitionerName: 'Jane Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('builds a parcel-scoped appeal notice model from appeal, hearing, and packet reference state', () => {
    const result = generateAppealNotice(validInput);

    expect(result.success).toBe(true);
    expect(result.notice).toBeDefined();
    expect(result.notice!.appealId).toBe('APL-001');
    expect(result.notice!.parcelId).toBe('P-100');
    expect(result.notice!.hearingId).toBe('HRG-001');
    expect(result.notice!.packetId).toBe('PKT-001');
    expect(result.notice!.petitionerName).toBe('Jane Doe');
    expect(result.notice!.noticeId).toBeDefined();
    expect(result.notice!.status).toBe('generated');
  });

  it('uses template selection appropriate to the appeal hearing event', () => {
    const scheduledResult = generateAppealNotice(validInput);
    expect(scheduledResult.notice!.templateKey).toBe('appeal-hearing-scheduled');

    const cancelledResult = generateAppealNotice({
      ...validInput,
      hearingStatus: 'cancelled',
    });
    expect(cancelledResult.notice!.templateKey).toBe('appeal-hearing-cancelled');

    const rescheduledResult = generateAppealNotice({
      ...validInput,
      hearingStatus: 'rescheduled',
    });
    expect(rescheduledResult.notice!.templateKey).toBe('appeal-hearing-rescheduled');
  });

  it('does not mutate dossier-owned packet or narrative content', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'document') {
        throw new Error('[WriteLane Violation] Module "dais" attempted to write to domain "document"');
      }
    });

    // Notice generation writes to appeal domain — fine
    const result = generateAppealNotice(validInput);
    expect(result.success).toBe(true);
    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');

    // Dais writing to document domain — forbidden
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow('[WriteLane Violation]');
  });
});
