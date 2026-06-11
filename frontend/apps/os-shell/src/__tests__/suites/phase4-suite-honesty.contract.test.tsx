/**
 * Phase 4 — CP-W3-3: Suite Homes Honesty Contract
 *
 * Proves every suite home meets the "honest home" definition:
 *   1. Renders dynamic content from the DataProvider, not hardcoded literals
 *   2. Error / loading states are surfaced correctly
 *   3. Dais panels show real county data, not static placeholder strings
 *
 * This test will FAIL if any component regresses to hardcoded status strings
 * or ignores the DataProvider boundary.
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CountyAggregateStats } from '../../types/domain';

// Static imports — vi.doMock + require() does not work in Vitest ESM
import ManagementDashboardPanel from '../../components/dais/ManagementDashboardPanel';
import CertRollPanel from '../../components/dais/CertRollPanel';
import NoticeBatchQueuePanel from '../../components/dais/NoticeBatchQueuePanel';
import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';
import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';
import DossierSuiteHome from '../../pages/suites/DossierSuiteHome';
// Import module namespace so vi.spyOn can intercept useCountyStats
import * as countyStatsHook from '../../hooks/useCountyStats';

// ---------------------------------------------------------------------------
// Stub heavy child components — prevent cascade failures from deep deps
// ---------------------------------------------------------------------------

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));
vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: () => null,
}));
vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: () => null,
}));

// ---------------------------------------------------------------------------
// Shared mock stats — distinct values so any hardcoded regression fails
// ---------------------------------------------------------------------------

const MOCK_STATS: CountyAggregateStats = {
  totalParcels: 73_419,
  totalAssessedValue: 14_200_000_000,
  averageAssessedValue: 193_500,
  medianAssessedValue: 182_000,
  assessedThisYear: 71_002,
  pendingAssessments: 2_417,
  activeAppeals: 138,
  totalLevyRevenue: 89_500_000,
  assessmentCompletionPercent: 74.3,
  parcelsByType: { residential: 60_000, commercial: 8_000, industrial: 2_000, agricultural: 3_419 } as CountyAggregateStats['parcelsByType'],
  parcelsByCity: { Kennewick: 30_000, Richland: 22_000, Pasco: 21_419 },
};

// ---------------------------------------------------------------------------
// § 1 — TerraDais Panels: real data from props, not hardcoded literals
// ---------------------------------------------------------------------------
// These panels receive stats as a prop — no hook mocking required.
// They are self-contained React components without internal side-effects.

describe('Phase 4 — TerraDais panel honesty', () => {
  it('ManagementDashboardPanel renders pendingAssessments + activeAppeals from props', () => {
    const { container } = render(<ManagementDashboardPanel stats={MOCK_STATS} />);
    expect(screen.getByTestId('mgmt-dashboard-pending').textContent).toBe('2,417 pending');
    expect(screen.getByTestId('mgmt-dashboard-appeals').textContent).toBe('138 appeals');
    expect(container.textContent).not.toContain('Morning View');
  });

  it('ManagementDashboardPanel renders em-dash placeholders when stats is null', () => {
    render(<ManagementDashboardPanel stats={null} />);
    expect(screen.getByTestId('mgmt-dashboard-pending').textContent).toBe('\u2014');
    expect(screen.getByTestId('mgmt-dashboard-appeals').textContent).toBe('\u2014');
  });

  it('CertRollPanel renders assessmentCompletionPercent from props', () => {
    const { container } = render(<CertRollPanel stats={MOCK_STATS} />);
    expect(screen.getByTestId('cert-roll-status').textContent).toBe('74.3% certified');
    expect(container.textContent).not.toContain('No Active Roll');
  });

  it('CertRollPanel renders em-dash when stats is null', () => {
    render(<CertRollPanel stats={null} />);
    expect(screen.getByTestId('cert-roll-status').textContent).toBe('\u2014 certified');
    expect(screen.queryByTestId('cert-roll-pending')).toBeNull();
  });

  it('NoticeBatchQueuePanel renders activeAppeals from props', () => {
    const { container } = render(<NoticeBatchQueuePanel stats={MOCK_STATS} />);
    expect(screen.getByTestId('batch-queue-count').textContent).toBe('138 active appeals');
    expect(container.textContent).not.toContain('0 Batches');
  });

  it('NoticeBatchQueuePanel renders em-dash when stats is null', () => {
    render(<NoticeBatchQueuePanel stats={null} />);
    expect(screen.getByTestId('batch-queue-count').textContent).toBe('\u2014 notices');
  });
});

// ---------------------------------------------------------------------------
// § 2 — TerraDossier: error + loading states surfaced via useCountyStats
// ---------------------------------------------------------------------------

describe('Phase 4 — TerraDossier error/loading honesty', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DossierSuiteHome surfaces error state when useCountyStats returns error', () => {
    vi.spyOn(countyStatsHook, 'useCountyStats').mockReturnValue({
      stats: null, loading: false, error: 'Service unavailable',
    });
    render(<MemoryRouter><DossierSuiteHome /></MemoryRouter>);
    const errorEl = screen.getByTestId('dossier-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Service unavailable');
  });

  it('DossierSuiteHome surfaces loading state before stats resolve', () => {
    vi.spyOn(countyStatsHook, 'useCountyStats').mockReturnValue({
      stats: null, loading: true, error: null,
    });
    render(<MemoryRouter><DossierSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('dossier-loading')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// § 3 — DataProvider boundary: suite homes render provider-supplied values
// ---------------------------------------------------------------------------

describe('Phase 4 — DataProvider boundary: suite homes render provider-supplied values', () => {
  beforeEach(() => {
    vi.spyOn(countyStatsHook, 'useCountyStats').mockReturnValue({
      stats: MOCK_STATS, loading: false, error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ForgeSuiteHome renders totalParcels from provider (73,419), not a hardcoded value', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('forge-stats').textContent).toContain('73,419');
  });

  it('AtlasSuiteHome renders totalParcels from provider (73,419), not a hardcoded value', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('atlas-stats').textContent).toContain('73,419');
  });

  it('DaisSuiteHome renders activeAppeals from provider (138) and propagates to panels', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('dais-stats').textContent).toContain('138');
    expect(screen.getByTestId('mgmt-dashboard-appeals').textContent).toBe('138 appeals');
    expect(screen.getByTestId('cert-roll-status').textContent).toBe('74.3% certified');
    expect(screen.getByTestId('batch-queue-count').textContent).toBe('138 active appeals');
  });

  it('DossierSuiteHome renders totalParcels from provider (73,419), not a hardcoded value', () => {
    render(<MemoryRouter><DossierSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dossier-root').textContent).toContain('73,419');
  });
});

