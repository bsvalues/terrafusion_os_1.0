import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

const mockUseDaisSuiteStats = vi.fn();

vi.mock('../../pages/suites/useDaisSuiteStats', () => ({
  useDaisSuiteStats: () => mockUseDaisSuiteStats(),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: () => <div data-testid="mock-module-grid" />,
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: () => <div data-testid="mock-operational-queue" />,
}));

vi.mock('../../components/dais/NoticeBatchQueuePanel', () => ({
  default: () => <div data-testid="mock-notice-batch-panel" />,
}));

vi.mock('../../components/dais/CertRollPanel', () => ({
  default: () => <div data-testid="mock-cert-roll-panel" />,
}));

vi.mock('../../components/dais/ManagementDashboardPanel', () => ({
  default: () => <div data-testid="mock-management-dashboard-panel" />,
}));

const MOCK_STATS = {
  activeAppeals: 138,
  totalLevyRevenue: 89500000,
  pendingAssessments: 2417,
  assessmentCompletionPercent: 74.3,
};

describe('DaisSuiteHome source honesty contract', () => {
  it('discloses county-provider fallback when the mounted route is not on TerraDais API metrics', () => {
    mockUseDaisSuiteStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'county-provider',
    });

    render(
      <MemoryRouter>
        <DaisSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('dais-source-disclosure')).toBeInTheDocument();
    expect(
      screen.getByText(/County aggregate fallback active: TerraDais overview, certification, and notice panels are currently using county-wide provider aggregates, not TerraDais API metrics\./i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('dais-stats')).toBeInTheDocument();
  });

  it('does not show the fallback disclosure when TerraDais API metrics are active', () => {
    mockUseDaisSuiteStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'dais-api',
    });

    render(
      <MemoryRouter>
        <DaisSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('dais-source-disclosure')).not.toBeInTheDocument();
    expect(screen.getByTestId('dais-stats')).toBeInTheDocument();
  });
});