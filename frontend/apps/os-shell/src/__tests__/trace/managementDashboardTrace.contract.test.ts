/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Management Dashboard Trace Contract
 *
 * Verifies append-only trace emission for dashboard generation,
 * supervisory drill-through, and blocked cross-lane actions.
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
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

import {
  buildManagementDashboardRollup,
  attemptSupervisoryAction,
  type ManagementRollupInput,
} from '../../services/suites/daisManagementDashboard';

describe('Management Dashboard Trace Contract', () => {
  const emptyInput: ManagementRollupInput = {
    queueItems: [],
    noticeBatches: [],
    certBatches: [],
    appealCount: 0,
    openAppealCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
  });

  it('emits append-only action_started and action_completed for dashboard generation and supervisory drill-through', () => {
    buildManagementDashboardRollup(emptyInput);
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'dashboard_rollup_built',
      'management_dashboard',
      expect.any(String),
      undefined,
      expect.objectContaining({ queueItemCount: 0 }),
    );

    mockEmitTraceEvent.mockClear();
    attemptSupervisoryAction('drill-through-queue', 'QI-001', 'assessor-smith');
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'dashboard_drill_through',
      'management_dashboard',
      expect.any(String),
      undefined,
      expect.objectContaining({ actionType: 'drill-through-queue', targetRef: 'QI-001' }),
    );
  });

  it('emits action_failed when forbidden cross-lane actions are attempted', () => {
    attemptSupervisoryAction('write-forge-valuation', 'P-100', 'assessor-smith');
    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'dashboard_action_blocked',
      'management_dashboard',
      expect.any(String),
      undefined,
      expect.objectContaining({ actionType: 'write-forge-valuation' }),
    );
  });

  it('does not emit success traces for blocked writes', () => {
    attemptSupervisoryAction('write-atlas-gis', 'P-100', 'assessor-smith');

    expect(mockEmitTraceEvent).not.toHaveBeenCalledWith(
      'dashboard_drill_through',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    expect(mockEmitTraceEvent).toHaveBeenCalledWith(
      'dashboard_action_blocked',
      'management_dashboard',
      'P-100',
      undefined,
      expect.objectContaining({ actionType: 'write-atlas-gis' }),
    );
  });
});
