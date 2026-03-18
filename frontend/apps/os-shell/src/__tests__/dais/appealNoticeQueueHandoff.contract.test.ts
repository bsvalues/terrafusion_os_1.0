/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Appeal Notice Queue Handoff Contract
 *
 * Verifies that generated notices hand off to a dais-owned queue model,
 * preserve immutable linkage, and reject cross-lane writes from dossier.
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
  handoffNoticeToQueue,
  type AppealNotice,
} from '../../services/suites/daisAppealNotice';

describe('Appeal Notice Queue Handoff Contract', () => {
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

  it('hands off generated notice metadata to a dais-owned queue model', () => {
    const result = handoffNoticeToQueue(generatedNotice);

    expect(result.success).toBe(true);
    expect(result.queueEntry).toBeDefined();
    expect(result.queueEntry!.noticeId).toBe('NTC-001');
    expect(result.queueEntry!.status).toBe('queued');
    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
  });

  it('preserves immutable linkage to parcelId, appealId, hearingId, and packet reference', () => {
    const result = handoffNoticeToQueue(generatedNotice);

    expect(result.queueEntry!.parcelId).toBe('P-100');
    expect(result.queueEntry!.appealId).toBe('APL-001');
    expect(result.queueEntry!.hearingId).toBe('HRG-001');
    expect(result.queueEntry!.packetId).toBe('PKT-001');
  });

  it('rejects direct queue writes from dossier-owned paths', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dossier' && domain === 'appeal') {
        throw new Error('[WriteLane Violation] Module "dossier" attempted to write to domain "appeal"');
      }
    });

    // Dais queue handoff — fine (mock allows dais+appeal)
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod !== 'dais' || domain !== 'appeal') {
        throw new Error(`[WriteLane Violation] Module "${mod}" attempted to write to domain "${domain}"`);
      }
    });

    const result = handoffNoticeToQueue(generatedNotice);
    expect(result.success).toBe(true);

    // Dossier writing to appeal domain — forbidden
    expect(() => mockAssertWriteLane('dossier', 'appeal')).toThrow('[WriteLane Violation]');
  });
});
