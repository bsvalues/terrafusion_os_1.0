/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Packet Finalization Contract
 *
 * Verifies that packets can only be finalized when complete,
 * finalization is blocked by missing requirements, and
 * a frozen snapshot is produced under dossier ownership.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  finalizePacketModel,
  type FinalizationInput,
  type FinalizationResult,
} from '../../services/suites/dossierPacketFinalization';

describe('Dossier Packet Finalization Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks a packet ready for finalization only when required sections are complete', () => {
    const input: FinalizationInput = {
      parcelId: 'P-100',
      packetId: 'PKT-001',
      title: 'Defense Packet for P-100',
      packetType: 'defense',
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001'] },
        { sectionType: 'evidence', itemIds: ['EV-001'] },
      ],
      narrativeSummary: 'Defense narrative summary.',
      finalizedBy: 'jsmith',
    };

    const result = finalizePacketModel(input);

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(result.success).toBe(true);
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot!.status).toBe('finalized');
  });

  it('blocks finalization when blockers exist', () => {
    const incomplete: FinalizationInput = {
      parcelId: 'P-200',
      packetId: 'PKT-002',
      title: '',
      packetType: 'defense',
      sections: [],
      narrativeSummary: '',
      finalizedBy: 'jsmith',
    };

    const result = finalizePacketModel(incomplete);

    expect(result.success).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers).toContain('title is required');
    expect(result.blockers).toContain('at least one section is required');
    expect(result.blockers).toContain('narrative summary is required');
    expect(result.snapshot).toBeUndefined();
  });

  it('produces a frozen finalization snapshot under dossier ownership', () => {
    const input: FinalizationInput = {
      parcelId: 'P-300',
      packetId: 'PKT-003',
      title: 'Appeal Packet for P-300',
      packetType: 'appeal-packet',
      sections: [
        { sectionType: 'documents', itemIds: ['DOC-001', 'DOC-002'] },
        { sectionType: 'evidence', itemIds: ['EV-001'] },
        { sectionType: 'narratives', itemIds: ['NAR-001'] },
      ],
      narrativeSummary: 'Appeal defense summary for P-300.',
      finalizedBy: 'assessor1',
    };

    const result = finalizePacketModel(input);

    expect(result.success).toBe(true);
    expect(result.snapshot).toMatchObject({
      parcelId: 'P-300',
      packetId: 'PKT-003',
      title: 'Appeal Packet for P-300',
      status: 'finalized',
      finalizedBy: 'assessor1',
      sectionCount: 3,
      totalItems: 4,
    });
    expect(typeof result.snapshot!.finalizedAt).toBe('string');
    expect(result.snapshot!.frozen).toBe(true);
  });
});
