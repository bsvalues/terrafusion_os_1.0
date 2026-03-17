/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Management Dashboard Rollup Contract
 *
 * Verifies that the rollup builds from queue, notice, cert, and appeal
 * state, includes workload/overdue/dispatch/blocker summaries, and
 * does not require parcel context.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  buildManagementDashboardRollup,
  type ManagementRollupInput,
} from '../../services/suites/daisManagementDashboard';

describe('Management Dashboard Rollup Contract', () => {
  const validInput: ManagementRollupInput = {
    queueItems: [
      {
        queueItemId: 'QI-001',
        parcelId: 'P-100',
        currentStatus: 'active',
        appealId: 'APL-001',
        priority: 'high' as const,
        dueAt: '2026-03-20T00:00:00Z',
        assignedTo: 'appraiser-jones',
        blockerSummary: ['valuation dispute'],
        certificationReady: false,
        createdAt: '2026-03-10T00:00:00Z',
      },
      {
        queueItemId: 'QI-002',
        parcelId: 'P-200',
        currentStatus: 'active',
        priority: 'normal' as const,
        dueAt: '2026-03-25T00:00:00Z',
        blockerSummary: [],
        certificationReady: true,
        createdAt: '2026-03-11T00:00:00Z',
      },
    ],
    noticeBatches: [
      { batchId: 'BATCH-001', items: [], groups: {}, rejectedItems: [], status: 'pending' as const, createdAt: '2026-03-15T00:00:00Z' },
      { batchId: 'BATCH-002', items: [], groups: {}, rejectedItems: [], status: 'dispatched' as const, createdAt: '2026-03-14T00:00:00Z' },
    ],
    certBatches: [
      { batchId: 'CBATCH-001', parcels: [], rejectedParcels: [], status: 'pending' as const, createdAt: '2026-03-15T00:00:00Z' },
      { batchId: 'CBATCH-002', parcels: [], rejectedParcels: [{ parcelId: 'P-300', reasons: ['open appeal'] }], status: 'signed' as const, createdAt: '2026-03-14T00:00:00Z' },
    ],
    appealCount: 15,
    openAppealCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds an office-wide rollup from queue, notice, certification, and appeal state', () => {
    const rollup = buildManagementDashboardRollup(validInput);

    expect(rollup.rollupId).toBeDefined();
    expect(rollup.workloadSummary).toBeDefined();
    expect(rollup.appealExposure).toBeDefined();
    expect(rollup.certificationRisk).toBeDefined();
    expect(rollup.noticeQueueState).toBeDefined();
    expect(rollup.exceptionSummary).toBeDefined();
    expect(rollup.createdAt).toBeDefined();
  });

  it('includes workload, overdue pressure, dispatch status, and certification blocker summaries', () => {
    const rollup = buildManagementDashboardRollup(validInput);

    expect(rollup.workloadSummary.totalItems).toBe(2);
    expect(rollup.workloadSummary.assignedCount).toBe(1);
    expect(rollup.workloadSummary.unassignedCount).toBe(1);

    expect(rollup.appealExposure.totalAppeals).toBe(15);
    expect(rollup.appealExposure.openAppeals).toBe(5);

    expect(rollup.noticeQueueState.totalBatches).toBe(2);
    expect(rollup.noticeQueueState.pendingBatches).toBe(1);
    expect(rollup.noticeQueueState.dispatchedBatches).toBe(1);

    expect(rollup.certificationRisk.totalBatches).toBe(2);
    expect(rollup.certificationRisk.blockedParcels).toBe(1);
  });

  it('does not require parcel context to render', () => {
    const emptyInput: ManagementRollupInput = {
      queueItems: [],
      noticeBatches: [],
      certBatches: [],
      appealCount: 0,
      openAppealCount: 0,
    };

    const rollup = buildManagementDashboardRollup(emptyInput);

    expect(rollup.rollupId).toBeDefined();
    expect(rollup.workloadSummary.totalItems).toBe(0);
    expect(rollup.appealExposure.exposureLevel).toBe('low');
  });
});
