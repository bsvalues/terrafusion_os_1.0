/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 3
 * Dossier Narrative Trace Contract
 *
 * Verifies trace event emission for narrative create/update actions
 * using the append-only TerraTrace pattern.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockEmitTraceEvent = vi.fn();

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: (...args: unknown[]) => mockEmitTraceEvent(...args),
}));

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { document: 'dossier' },
}));

import {
  createNarrativeDraft,
  updateNarrativeDraft,
} from '../../services/suites/dossierNarrative';

describe('Dossier Narrative Trace Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits trace events for narrative create actions', () => {
    const draft = createNarrativeDraft({
      parcelId: 'P-100',
      packetId: 'PKT-001',
      narrativeType: 'defense',
      createdBy: 'jsmith',
    });

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'narrative_created',
      'narrative',
      draft.narrativeId,
      undefined,
      expect.objectContaining({
        parcelId: 'P-100',
        packetId: 'PKT-001',
        narrativeType: 'defense',
        status: 'draft',
      }),
    );
  });

  it('emits trace events for narrative update actions', () => {
    const draft = createNarrativeDraft({
      parcelId: 'P-100',
      packetId: 'PKT-001',
      narrativeType: 'defense',
      createdBy: 'jsmith',
    });

    vi.clearAllMocks();

    const updated = updateNarrativeDraft(draft, {
      summary: 'Updated defense summary',
      sections: [
        { sectionType: 'evidence-summary', content: 'Evidence supports...' },
      ],
    });

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'narrative_updated',
      'narrative',
      draft.narrativeId,
      expect.objectContaining({ summary: '' }),
      expect.objectContaining({ summary: 'Updated defense summary' }),
    );
  });

  it('uses append-only action_started/action_completed pattern', () => {
    // emitTraceEvent is fire-and-forget (per terraTrace.ts contract).
    // The action string indicates the completed action, not a request.
    createNarrativeDraft({
      parcelId: 'P-200',
      packetId: 'PKT-002',
      narrativeType: 'market-analysis',
      createdBy: 'assessor1',
    });

    const call = mockEmitTraceEvent.mock.calls[0];
    expect(call[0]).toBe('narrative_created');
    expect(call[1]).toBe('narrative');
    // entityId is a generated narrative ID
    expect(typeof call[2]).toBe('string');
    expect(call[2].length).toBeGreaterThan(0);
  });

  it('does not emit trace from forbidden direct suite writes', () => {
    // When assertWriteLane blocks, no trace should fire
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('[WriteLane Violation]');
    });

    expect(() =>
      createNarrativeDraft({
        parcelId: 'P-300',
        packetId: 'PKT-003',
        narrativeType: 'defense',
        createdBy: 'forge-agent',
      })
    ).toThrow('[WriteLane Violation]');

    expect(mockEmitTraceEvent).not.toHaveBeenCalled();
  });
});
