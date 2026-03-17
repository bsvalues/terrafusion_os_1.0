/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dossier Appeal Handoff Write-Lane Contract
 *
 * Verifies constitutional ownership boundaries during appeal handoff:
 * - Dossier may prepare handoff artifacts but not mutate appeal state
 * - Dais may create appeal state but not mutate dossier packet content
 * - Cross-lane violations fail loudly
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn((mod: string, domain: string) => {
    if (mod === 'dossier' && domain === 'document') return true;
    if (mod === 'dais' && domain === 'appeal') return true;
    return false;
  }),
  WRITE_LANE_MATRIX: { document: 'dossier', appeal: 'dais' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import { prepareAppealHandoff } from '../../services/suites/dossierAppealHandoff';
import { acceptAppealHandoff } from '../../services/suites/daisAppealIntake';

import type { FinalizedSnapshot } from '../../services/suites/dossierAppealHandoff';

describe('Dossier Appeal Handoff Write-Lane Contract', () => {
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
    narrativeSummary: 'Summary text.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('allows dossier to prepare handoff artifacts but not mutate appeal workflow state', () => {
    const result = prepareAppealHandoff(finalizedSnapshot);

    // Dossier prepares artifacts under document ownership
    expect(mockAssertWriteLane).toHaveBeenCalledWith('dossier', 'document');
    expect(result.success).toBe(true);

    // Dossier does NOT write to appeal domain
    const appealCalls = mockAssertWriteLane.mock.calls.filter(
      (c: unknown[]) => c[1] === 'appeal'
    );
    expect(appealCalls.length).toBe(0);
  });

  it('allows dais to create appeal workflow state but not mutate dossier packet content', () => {
    const handoff = prepareAppealHandoff(finalizedSnapshot).handoff!;

    const intakeResult = acceptAppealHandoff(handoff);

    // Dais writes to appeal domain
    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');
    expect(intakeResult.success).toBe(true);

    // Dais does NOT write to document domain
    const docCalls = mockAssertWriteLane.mock.calls.filter(
      (c: unknown[]) => c[0] === 'dais' && c[1] === 'document'
    );
    expect(docCalls.length).toBe(0);
  });

  it('fails loudly on direct cross-lane write attempts', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'document') {
        throw new Error('[WriteLane Violation] Module "dais" attempted to write to domain "document"');
      }
      if (mod === 'dossier' && domain === 'appeal') {
        throw new Error('[WriteLane Violation] Module "dossier" attempted to write to domain "appeal"');
      }
    });

    // Dossier cannot write to appeal domain
    expect(() => mockAssertWriteLane('dossier', 'appeal')).toThrow('[WriteLane Violation]');

    // Dais cannot write to document domain
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow('[WriteLane Violation]');
  });
});
