/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Appeal Notice Trace Contract
 *
 * Verifies append-only trace emission for notice generation,
 * queue handoff, eligibility blocks, and cross-lane rejection.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

import {
  checkNoticeEligibility,
  generateAppealNotice,
  handoffNoticeToQueue,
  type NoticeEligibilityInput,
  type NoticeGenerationInput,
  type AppealNotice,
} from '../../services/suites/daisAppealNotice';

describe('Appeal Notice Trace Contract', () => {
  const eligibleInput: NoticeEligibilityInput = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingStatus: 'scheduled',
    packetValid: true,
    deadlineBlockers: [],
  };

  const generationInput: NoticeGenerationInput = {
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

  const generatedNotice: AppealNotice = {
    noticeId: 'NTC-001',
    appealId: 'APL-001',
    parcelId: 'P-100',
    hearingId: 'HRG-001',
    packetId: 'PKT-001',
    hearingDate: '2026-04-20',
    hearingTime: '14:00',
    hearingLocation: 'Benton County BOE Room 201',
    petitionerName: 'Jane Doe',
    templateKey: 'appeal-hearing-scheduled',
    status: 'generated',
    createdAt: '2026-03-16T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('emits append-only action_started and action_completed for notice generation and queue handoff', () => {
    generateAppealNotice(generationInput);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_notice_generated',
      'notice',
      expect.any(String),
      undefined,
      expect.objectContaining({
        appealId: 'APL-001',
        parcelId: 'P-100',
        templateKey: 'appeal-hearing-scheduled',
      }),
    );

    mockEmitTraceEvent.mockClear();

    handoffNoticeToQueue(generatedNotice);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_notice_queued',
      'notice',
      'NTC-001',
      undefined,
      expect.objectContaining({
        appealId: 'APL-001',
        status: 'queued',
      }),
    );
  });

  it('emits action_failed when eligibility is blocked', () => {
    const blockedInput: NoticeEligibilityInput = {
      ...eligibleInput,
      packetValid: false,
    };

    checkNoticeEligibility(blockedInput);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_notice_blocked',
      'notice',
      'APL-001',
      undefined,
      expect.objectContaining({
        blockers: expect.arrayContaining(['packet reference is invalid or revised']),
      }),
    );
  });

  it('does not emit success trace for forbidden cross-lane writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => generateAppealNotice(generationInput)).toThrow('[WriteLane Violation]');

    // No success trace should have been emitted
    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'appeal_notice_generated',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
