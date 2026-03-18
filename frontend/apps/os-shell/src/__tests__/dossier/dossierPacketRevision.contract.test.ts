/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Packet Revision Contract
 *
 * Verifies that finalized packets cannot be silently mutated,
 * require explicit revise action, and invalidate on material changes.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  revisePacket,
  checkFinalizedMutability,
  checkSectionDrift,
  type FinalizedSnapshot,
  type PacketSection,
} from '../../services/suites/dossierPacketFinalization';

describe('Dossier Packet Revision Contract', () => {
  const frozenSnapshot: FinalizedSnapshot = {
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
    narrativeSummary: 'Defense summary',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents silent mutation of finalized packets', () => {
    const result = checkFinalizedMutability(frozenSnapshot);

    expect(result.mutable).toBe(false);
    expect(result.reason).toContain('finalized');
  });

  it('requires an explicit revise action to reopen a finalized packet', () => {
    const revised = revisePacket(frozenSnapshot, 'assessor1', 'New evidence discovered');

    expect(revised.status).toBe('draft');
    expect(revised.frozen).toBe(false);
    expect(revised.revisionReason).toBe('New evidence discovered');
    expect(revised.revisedBy).toBe('assessor1');
    expect(typeof revised.revisedAt).toBe('string');
  });

  it('invalidates finalized state when material evidence changes', () => {
    const originalSections: PacketSection[] = [
      { sectionType: 'documents', itemIds: ['DOC-001', 'DOC-002'] },
      { sectionType: 'evidence', itemIds: ['EV-001'] },
    ];

    const changedSections: PacketSection[] = [
      { sectionType: 'documents', itemIds: ['DOC-001'] }, // DOC-002 removed
    ];

    const stable = checkSectionDrift(frozenSnapshot, originalSections);
    const drifted = checkSectionDrift(frozenSnapshot, changedSections);

    expect(stable.drifted).toBe(false);
    expect(drifted.drifted).toBe(true);
    expect(drifted.reason).toContain('material change');
  });
});
