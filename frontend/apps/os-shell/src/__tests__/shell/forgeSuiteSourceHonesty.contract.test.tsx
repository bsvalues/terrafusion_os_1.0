import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';

const mockUseCountyStats = vi.fn();
const mockSuiteModuleGrid = vi.fn(() => <div data-testid="mock-module-grid" />);

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => mockUseCountyStats(),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: unknown) => mockSuiteModuleGrid(props),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: () => <div data-testid="mock-operational-queue" />,
}));

const MOCK_STATS = {
  totalParcels: 120850,
  averageAssessedValue: 342100,
  assessedThisYear: 119994,
  pendingAssessments: 2417,
  assessmentCompletionPercent: 98.5,
};

describe('ForgeSuiteHome source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('discloses snapshot-backed county aggregates on the mounted route', () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'snapshot',
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('forge-source-disclosure')).toBeInTheDocument();
    // Match the prose currently produced by getSourceDisclosure() in
    // ForgeSuiteHome (FROZEN file — see frontend/CLAUDE.md, restore commit 8da26658a).
    expect(
      screen.getByText(/Snapshot-backed county aggregates: TerraForge stats are using bundled county snapshot data, not live backend metrics\./i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('does not show the disclosure when live backend metrics are active', () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('forge-source-disclosure')).not.toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('renders the frozen Forge primary module set with TerraDais handoff label available', () => {
    // The frozen v1 ForgeSuiteHome (restore commit 8da26658a per
    // frontend/CLAUDE.md) does not route appeal prep through this surface —
    // appeals live in TerraDais directly. This contract verifies that:
    //   1. The frozen primary modules render (CostForge / CompsForge / IncomeForge / SalesForge),
    //   2. The component still owns the TerraDais workbench handoff string for any
    //      future module that opts into workbenchTab: 'dais'.
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    // Primary frozen modules are rendered as forge-ops-cards
    expect(screen.getByText('CostForge')).toBeInTheDocument();
    expect(screen.getByText('CompsForge')).toBeInTheDocument();
    expect(screen.getByText('IncomeForge')).toBeInTheDocument();
    expect(screen.getByText('SalesForge')).toBeInTheDocument();

    // The TerraDais handoff string lives in the component's getLaunchLabel —
    // verify the source still defines it (proves the dais routing branch survives).
    const sourceFile = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../pages/suites/ForgeSuiteHome.tsx'),
      'utf8',
    );
    expect(sourceFile).toContain("workbenchTab === 'dais' ? 'Opens TerraDais workbench'");
  });
});