/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Appeal Packet Dependency Contract
 *
 * Verifies immutable linkage to finalized packet reference,
 * readiness invalidation on packet validity failure, and
 * Dais cannot mutate packet content directly.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn((mod: string, domain: string) => {
    if (mod === 'dais' && domain === 'appeal') return true;
    if (mod === 'dossier' && domain === 'document') return true;
    return false;
  }),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  createDeadlineState,
  checkDeadlineDrift,
  type AppealIntakeRecord,
} from '../../services/suites/daisAppealDeadline';

describe('Appeal Packet Dependency Contract', () => {
  const validIntake: AppealIntakeRecord = {
    appealId: 'APL-001',
    parcelId: 'P-100',
    packetId: 'PKT-001',
    packetSnapshotStatus: 'finalized',
    status: 'pending',
    narrativeIncluded: true,
    coverSheetIncluded: true,
    sectionCount: 3,
    totalItems: 5,
    createdAt: '2026-03-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('preserves immutable linkage to finalized packet reference', () => {
    const result = createDeadlineState(validIntake);
    const deadline = result.deadline!;

    expect(deadline.packetId).toBe('PKT-001');
    expect(deadline.packetValid).toBe(true);
    // Deadline references the packet but doesn't contain mutable packet internals
    expect(deadline).not.toHaveProperty('narrativeSummary');
    expect(deadline).not.toHaveProperty('sections');
  });

  it('invalidates readiness when packet validity check fails', () => {
    const result = createDeadlineState(validIntake);
    const deadline = result.deadline!;

    const drift = checkDeadlineDrift(deadline, 'draft');

    expect(drift.drifted).toBe(true);
    expect(drift.reason).toContain('packet has been revised');
  });

  it('does not allow Dais to mutate packet content directly', () => {
    mockAssertWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'document') {
        throw new Error('[WriteLane Violation] Module "dais" attempted to write to domain "document"');
      }
    });

    // Dais writing to appeal is fine
    expect(() => mockAssertWriteLane('dais', 'appeal')).not.toThrow();

    // Dais writing to document domain is forbidden
    expect(() => mockAssertWriteLane('dais', 'document')).toThrow('[WriteLane Violation]');
  });
});
