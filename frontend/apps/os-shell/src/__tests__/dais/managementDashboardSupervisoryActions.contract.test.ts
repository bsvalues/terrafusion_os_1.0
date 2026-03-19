/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Management Dashboard Supervisory Actions Contract
 *
 * Verifies that the dashboard allows lawful drill-through references,
 * permits dais-owned supervisory actions only, and rejects rogue writes.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  attemptSupervisoryAction,
} from '../../services/suites/daisManagementDashboard';

describe('Management Dashboard Supervisory Actions Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('allows lawful drill-through to queue and Property Workbench for escalated parcels', () => {
    const queueDrill = attemptSupervisoryAction('drill-through-queue', 'QI-001', 'assessor-smith');
    expect(queueDrill.success).toBe(true);
    expect(queueDrill.targetRef).toBeDefined();

    const parcelDrill = attemptSupervisoryAction('drill-through-parcel', 'P-100', 'assessor-smith');
    expect(parcelDrill.success).toBe(true);
    expect(parcelDrill.targetRef).toBeDefined();
  });

  it('permits dais-owned supervisory actions only', () => {
    const reassign = attemptSupervisoryAction('reassign-queue-item', 'QI-001', 'assessor-smith');
    expect(reassign.success).toBe(true);
    expect(mockAssertWriteLane).toHaveBeenCalledWith('dais', 'appeal');

    const escalate = attemptSupervisoryAction('escalate-queue-item', 'QI-002', 'assessor-smith');
    expect(escalate.success).toBe(true);
  });

  it('does not create rogue office-level writes into Forge, Atlas, or Dossier domains', () => {
    const forgeWrite = attemptSupervisoryAction('write-forge-valuation', 'P-100', 'assessor-smith');
    expect(forgeWrite.success).toBe(false);
    expect(forgeWrite.blockers).toContain('forbidden cross-lane write');

    const atlasWrite = attemptSupervisoryAction('write-atlas-gis', 'P-100', 'assessor-smith');
    expect(atlasWrite.success).toBe(false);

    const dossierWrite = attemptSupervisoryAction('write-dossier-packet', 'P-100', 'assessor-smith');
    expect(dossierWrite.success).toBe(false);
  });
});
