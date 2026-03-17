/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dossier Appeal Handoff Trace Contract
 *
 * Verifies trace emission for handoff prepare, accept, and failure paths.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();
const mockAssertWriteLane = vi.fn();

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { document: 'dossier', appeal: 'dais' },
}));

import {
  prepareAppealHandoff,
  type FinalizedSnapshot,
} from '../../services/suites/dossierAppealHandoff';

import { acceptAppealHandoff } from '../../services/suites/daisAppealIntake';

describe('Dossier Appeal Handoff Trace Contract', () => {
  const finalizedSnapshot: FinalizedSnapshot = {
    parcelId: 'P-100',
    packetId: 'PKT-001',
    title: 'Defense Packet',
    packetType: 'defense',
    status: 'finalized',
    finalizedBy: 'jsmith',
    finalizedAt: '2026-03-15T10:00:00Z',
    sectionCount: 2,
    totalItems: 3,
    frozen: true,
    narrativeSummary: 'Summary.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits append-only action_started and action_completed for handoff prepare/request', () => {
    const result = prepareAppealHandoff(finalizedSnapshot);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_handoff_prepared',
      'packet',
      'PKT-001',
      expect.objectContaining({ status: 'finalized' }),
      expect.objectContaining({ handoffReady: true }),
    );

    // Accept the handoff on the Dais side
    mockEmitTraceEvent.mockClear();
    acceptAppealHandoff(result.handoff!);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_handoff_accepted',
      'appeal',
      expect.any(String),
      undefined,
      expect.objectContaining({ packetId: 'PKT-001', status: 'pending' }),
    );
  });

  it('emits action_failed when handoff readiness is blocked', () => {
    const draftSnapshot: FinalizedSnapshot = {
      ...finalizedSnapshot,
      status: 'draft',
      frozen: false,
    };

    prepareAppealHandoff(draftSnapshot);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'appeal_handoff_blocked',
      'packet',
      'PKT-001',
      undefined,
      expect.objectContaining({ blockers: expect.any(Array) }),
    );
  });

  it('does not emit success trace for forbidden direct writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() => prepareAppealHandoff(finalizedSnapshot)).toThrow('[WriteLane Violation]');
    expect(mockEmitTraceEvent).not.toHaveBeenCalled();
  });
});
