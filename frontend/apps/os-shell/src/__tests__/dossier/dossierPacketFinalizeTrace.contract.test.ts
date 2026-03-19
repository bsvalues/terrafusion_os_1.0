/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Packet Finalize Trace Contract
 *
 * Verifies trace emission for finalize and revise actions.
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
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

import {
  finalizePacketModel,
  revisePacket,
  type FinalizationInput,
  type FinalizedSnapshot,
} from '../../services/suites/dossierPacketFinalization';

describe('Dossier Packet Finalize Trace Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits append-only trace for successful finalize', () => {
    const input: FinalizationInput = {
      parcelId: 'P-100',
      packetId: 'PKT-001',
      title: 'Defense Packet',
      packetType: 'defense',
      sections: [{ sectionType: 'documents', itemIds: ['DOC-001'] }],
      narrativeSummary: 'Summary text.',
      finalizedBy: 'jsmith',
    };

    finalizePacketModel(input);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'packet_finalized',
      'packet',
      'PKT-001',
      expect.objectContaining({ status: 'draft' }),
      expect.objectContaining({ status: 'finalized' }),
    );
  });

  it('emits action_failed when finalization is blocked', () => {
    const incomplete: FinalizationInput = {
      parcelId: 'P-200',
      packetId: 'PKT-002',
      title: '',
      packetType: 'defense',
      sections: [],
      narrativeSummary: '',
      finalizedBy: 'jsmith',
    };

    finalizePacketModel(incomplete);

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'packet_finalization_blocked',
      'packet',
      'PKT-002',
      undefined,
      expect.objectContaining({ blockers: expect.any(Array) }),
    );
  });

  it('does not emit finalize trace for forbidden direct writes', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    const input: FinalizationInput = {
      parcelId: 'P-300',
      packetId: 'PKT-003',
      title: 'Packet',
      packetType: 'defense',
      sections: [{ sectionType: 'documents', itemIds: ['DOC-001'] }],
      narrativeSummary: 'Summary.',
      finalizedBy: 'forge-agent',
    };

    expect(() => finalizePacketModel(input)).toThrow('[WriteLane Violation]');
    expect(mockEmitTraceEvent).not.toHaveBeenCalled();
  });

  it('emits trace for revise action', () => {
    const snapshot: FinalizedSnapshot = {
      parcelId: 'P-100',
      packetId: 'PKT-001',
      title: 'Defense Packet',
      packetType: 'defense',
      status: 'finalized',
      finalizedBy: 'jsmith',
      finalizedAt: '2026-03-01T00:00:00Z',
      sectionCount: 2,
      totalItems: 3,
      frozen: true,
      narrativeSummary: 'Summary.',
    };

    revisePacket(snapshot, 'assessor1', 'New evidence');

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'packet_revised',
      'packet',
      'PKT-001',
      expect.objectContaining({ status: 'finalized' }),
      expect.objectContaining({ status: 'draft', revisionReason: 'New evidence' }),
    );
  });
});
