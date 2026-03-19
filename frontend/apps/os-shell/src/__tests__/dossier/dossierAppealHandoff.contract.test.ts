/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dossier Appeal Handoff Contract
 *
 * Verifies that handoff models are created only from finalized packets,
 * include required fields, and reject draft or drifted packets.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { document: 'dossier', appeal: 'dais' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  prepareAppealHandoff,
  type AppealHandoffModel,
  type FinalizedSnapshot,
} from '../../services/suites/dossierAppealHandoff';

describe('Dossier Appeal Handoff Contract', () => {
  const finalizedSnapshot: FinalizedSnapshot = {
    parcelId: 'P-100',
    packetId: 'PKT-001',
    title: 'Defense Packet for P-100',
    packetType: 'defense',
    status: 'finalized',
    finalizedBy: 'jsmith',
    finalizedAt: '2026-03-15T10:00:00Z',
    sectionCount: 3,
    totalItems: 5,
    frozen: true,
    narrativeSummary: 'The assessed value is supported by three comparable sales.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a handoff model only from a finalized packet snapshot', () => {
    const result = prepareAppealHandoff(finalizedSnapshot);

    expect(result.success).toBe(true);
    expect(result.handoff).toBeDefined();
    expect(result.handoff!.packetId).toBe('PKT-001');
    expect(result.handoff!.packetStatus).toBe('finalized');
  });

  it('includes parcelId, packetId, narrative status, cover sheet, and readiness blockers', () => {
    const result = prepareAppealHandoff(finalizedSnapshot);
    const h = result.handoff!;

    expect(h.parcelId).toBe('P-100');
    expect(h.packetId).toBe('PKT-001');
    expect(h.narrativeIncluded).toBe(true);
    expect(h.coverSheetIncluded).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(typeof h.preparedAt).toBe('string');
  });

  it('rejects handoff from draft or drifted packets', () => {
    const draftSnapshot: FinalizedSnapshot = {
      ...finalizedSnapshot,
      status: 'draft',
      frozen: false,
    };

    const result = prepareAppealHandoff(draftSnapshot);

    expect(result.success).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers).toContain('packet must be finalized before appeal handoff');
    expect(result.handoff).toBeUndefined();
  });
});
