/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Hearing Cover Sheet Contract
 *
 * Verifies cover sheet model construction from packet metadata
 * and narrative state.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn((mod: string) => mod === 'dossier'),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  buildCoverSheet,
  type CoverSheet,
  type FinalizedSnapshot,
} from '../../services/suites/dossierPacketFinalization';

describe('Dossier Hearing Cover Sheet Contract', () => {
  const snapshot: FinalizedSnapshot = {
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

  it('builds a cover sheet model from packet metadata and narrative state', () => {
    const sheet = buildCoverSheet(snapshot);

    expect(sheet).toBeDefined();
    expect(sheet.parcelId).toBe('P-100');
    expect(sheet.packetId).toBe('PKT-001');
    expect(sheet.narrativeSummary).toContain('comparable sales');
  });

  it('includes parcel identity, packet type, title, readiness, and hearing summary fields', () => {
    const sheet = buildCoverSheet(snapshot);

    expect(sheet).toMatchObject({
      parcelId: 'P-100',
      packetId: 'PKT-001',
      packetType: 'defense',
      title: 'Defense Packet for P-100',
      readiness: 'finalized',
      sectionCount: 3,
      totalItems: 5,
    });
    expect(sheet.narrativeSummary).toBe('The assessed value is supported by three comparable sales.');
    expect(typeof sheet.generatedAt).toBe('string');
  });

  it('rejects cross-lane writes to hearing packet metadata', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation] Module "forge" attempted to write to domain "document"');
    });

    expect(() => buildCoverSheet(snapshot, { enforceWriteLane: true })).toThrow(
      '[WriteLane Violation]'
    );
  });
});
