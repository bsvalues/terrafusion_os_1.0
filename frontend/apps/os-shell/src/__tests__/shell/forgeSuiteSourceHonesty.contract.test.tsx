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
    expect(
      screen.getByText(/Snapshot-backed county aggregates active: TerraForge overview stats are currently using bundled county snapshot data, not live backend metrics\./i),
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

  it('makes the TerraDais workbench handoff explicit for appeal prep', () => {
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

    expect(screen.getByTestId('mock-module-grid')).toBeInTheDocument();

    const [gridCall] = mockSuiteModuleGrid.mock.calls;
    const modules = gridCall?.[0]?.modules ?? [];
    const appealModule = modules.find((module: { id: string }) => module.id === 'appeal');

    expect(appealModule).toEqual(
      expect.objectContaining({
        label: 'Appeals via TerraDais',
        description: 'BOE appeal preparation routes through the TerraDais workbench flow for scheduling, packet handoff, and case operations',
        workbenchTab: 'dais',
      }),
    );
  });
});