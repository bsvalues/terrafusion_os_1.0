/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Appeal Packet Reference Contract
 *
 * Verifies that appeal intake binds to an immutable finalized packet
 * reference, invalidates when the packet is revised, and preserves
 * provenance without ownership leakage.
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
  acceptAppealHandoff,
  checkAppealPacketValidity,
  type AppealIntakeRecord,
} from '../../services/suites/daisAppealIntake';

import type { AppealHandoffModel } from '../../services/suites/dossierAppealHandoff';

describe('Appeal Packet Reference Contract', () => {
  const handoff: AppealHandoffModel = {
    parcelId: 'P-100',
    packetId: 'PKT-001',
    packetType: 'defense',
    packetStatus: 'finalized',
    narrativeIncluded: true,
    coverSheetIncluded: true,
    sectionCount: 3,
    totalItems: 5,
    narrativeSummary: 'Three comparable sales support the assessed value.',
    preparedAt: '2026-03-15T12:00:00Z',
    preparedBy: 'jsmith',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('binds an appeal intake record to an immutable finalized packet reference', () => {
    const result = acceptAppealHandoff(handoff);

    expect(result.success).toBe(true);
    expect(result.intake).toBeDefined();
    expect(result.intake!.packetId).toBe('PKT-001');
    expect(result.intake!.parcelId).toBe('P-100');
    expect(result.intake!.packetSnapshotStatus).toBe('finalized');
    expect(result.intake!.status).toBe('pending');
  });

  it('invalidates active handoff readiness when the packet is revised', () => {
    const result = acceptAppealHandoff(handoff);
    const intake = result.intake!;

    // Simulate packet being revised — status becomes draft
    const revisedHandoff: AppealHandoffModel = {
      ...handoff,
      packetStatus: 'draft',
    };

    const validity = checkAppealPacketValidity(intake, revisedHandoff);

    expect(validity.valid).toBe(false);
    expect(validity.reason).toContain('packet has been revised');
  });

  it('preserves provenance and cover-sheet linkage without ownership leakage', () => {
    const result = acceptAppealHandoff(handoff);
    const intake = result.intake!;

    // Intake references packet provenance
    expect(intake.narrativeIncluded).toBe(true);
    expect(intake.coverSheetIncluded).toBe(true);
    expect(intake.sectionCount).toBe(3);
    expect(intake.totalItems).toBe(5);

    // Intake does NOT contain mutable dossier internals
    expect(intake).not.toHaveProperty('narrativeSummary');
    expect(intake).not.toHaveProperty('sections');
  });
});
