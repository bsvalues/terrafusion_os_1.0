/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 3
 * Dossier Narrative Assembly Contract
 *
 * Verifies that narrative drafts are created under dossier ownership,
 * require packet and parcel context, and reject cross-lane writes.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();
const mockCheckWriteLane = vi.fn((mod: string) => mod === 'dossier');

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: (...args: unknown[]) => mockCheckWriteLane(...args),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  createNarrativeDraft,
  type NarrativeDraft,
} from '../../services/suites/dossierNarrative';

describe('Dossier Narrative Assembly Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a narrative draft from packet evidence under dossier ownership', () => {
    const draft = createNarrativeDraft({
      parcelId: 'P-100',
      packetId: 'PKT-001',
      narrativeType: 'defense',
      createdBy: 'jsmith',
    });

    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(draft.parcelId).toBe('P-100');
    expect(draft.packetId).toBe('PKT-001');
    expect(draft.narrativeType).toBe('defense');
    expect(draft.status).toBe('draft');
    expect(typeof draft.createdAt).toBe('string');
    expect(draft.sections).toEqual([]);
  });

  it('requires packet context and parcel context', () => {
    expect(() =>
      createNarrativeDraft({
        parcelId: '',
        packetId: 'PKT-001',
        narrativeType: 'defense',
        createdBy: 'jsmith',
      })
    ).toThrow('parcelId is required');

    expect(() =>
      createNarrativeDraft({
        parcelId: 'P-100',
        packetId: '',
        narrativeType: 'defense',
        createdBy: 'jsmith',
      })
    ).toThrow('packetId is required');
  });

  it('rejects cross-lane writes from forge/dais/atlas', () => {
    // assertWriteLane is called — if it throws, creation is blocked
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation] Module "forge" attempted to write to domain "document"');
    });

    expect(() =>
      createNarrativeDraft({
        parcelId: 'P-100',
        packetId: 'PKT-001',
        narrativeType: 'defense',
        createdBy: 'forge-agent',
      })
    ).toThrow('[WriteLane Violation]');
  });
});
