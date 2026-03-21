import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DossierSuiteHome from '../../pages/suites/DossierSuiteHome';

const mockUseCountyStats = vi.fn();
const mockSuiteModuleGrid = vi.fn(() => <div data-testid="mock-module-grid" />);
const mockOperationalQueue = vi.fn(() => <div data-testid="mock-operational-queue" />);

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
  OperationalQueue: (props: unknown) => mockOperationalQueue(props),
}));

const MOCK_STATS = {
  totalParcels: 120850,
  activeAppeals: 138,
  pendingAssessments: 2417,
};

describe('DossierSuiteHome routing honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels the shared queue as recent parcels instead of recent documents', () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'snapshot',
    });

    render(
      <MemoryRouter>
        <DossierSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-operational-queue')).toBeInTheDocument();
    const [queueCall] = mockOperationalQueue.mock.calls;
    expect(queueCall?.[0]).toEqual(
      expect.objectContaining({
        title: 'Recent Parcels',
        emptyMessage: 'No recent parcel activity',
      }),
    );
    expect(screen.getByText('Pending Assessments')).toBeInTheDocument();
    expect(screen.queryByText('Pending Reviews')).not.toBeInTheDocument();
  });

  it('makes the Defense Packets handoff to the TerraDais workbench explicit', () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'snapshot',
    });

    render(
      <MemoryRouter>
        <DossierSuiteHome />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-module-grid')).toBeInTheDocument();

    const [gridCall] = mockSuiteModuleGrid.mock.calls;
    const modules = gridCall?.[0]?.modules ?? [];
    const defenseModule = modules.find((module: { id: string }) => module.id === 'defense');

    expect(defenseModule).toEqual(
      expect.objectContaining({
        label: 'Defense Packets',
        description: 'BOE appeal defense packet assembly via the TerraDais workbench flow',
        workbenchTab: 'dais',
      }),
    );
  });
});