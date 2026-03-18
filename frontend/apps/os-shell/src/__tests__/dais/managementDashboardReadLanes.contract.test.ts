/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Management Dashboard Read-Lane Contract
 *
 * Verifies that the dashboard reads operational state without mutating it,
 * treats Dais as the only write owner, and rejects cross-lane writes.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockAssertWriteLane = vi.fn();
const mockCheckWriteLane = vi.fn();

vi.mock('../../services/writeLane', () => ({
  assertWriteLane: (...args: unknown[]) => mockAssertWriteLane(...args),
  checkWriteLane: (...args: unknown[]) => mockCheckWriteLane(...args),
  WRITE_LANE_MATRIX: { appeal: 'dais', document: 'dossier' },
}));

vi.mock('../../services/terraTrace', () => ({
  emitTraceEvent: vi.fn(),
}));

import {
  validateReadLaneAccess,
  attemptSupervisoryAction,
} from '../../services/suites/daisManagementDashboard';

describe('Management Dashboard Read-Lane Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertWriteLane.mockImplementation(() => {});
    mockCheckWriteLane.mockImplementation((mod: string, domain: string) => {
      if (mod === 'dais' && domain === 'appeal') return true;
      return false;
    });
  });

  it('reads Forge and Atlas signals without mutating them', () => {
    const forgeAccess = validateReadLaneAccess('forge');
    const atlasAccess = validateReadLaneAccess('atlas');

    expect(forgeAccess.allowed).toBe(true);
    expect(forgeAccess.writeAllowed).toBe(false);

    expect(atlasAccess.allowed).toBe(true);
    expect(atlasAccess.writeAllowed).toBe(false);
  });

  it('treats Dais as the only write owner for assignment, notice, and certification workflow state', () => {
    const daisAccess = validateReadLaneAccess('dais');

    expect(daisAccess.allowed).toBe(true);
    expect(daisAccess.writeAllowed).toBe(true);
  });

  it('rejects cross-lane writes from dashboard aggregation paths', () => {
    mockAssertWriteLane.mockImplementation(() => {
      throw new Error('Write-lane violation');
    });

    const result = attemptSupervisoryAction('write-forge-valuation', 'P-100', 'assessor-smith');

    expect(result.success).toBe(false);
    expect(result.blockers).toContain('forbidden cross-lane write');
  });
});
