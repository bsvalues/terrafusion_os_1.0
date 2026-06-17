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
      screen.getByText(/App-backed suite metrics read proven TerraFusion API paths/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('keeps the proof-freeze disclosure visible when live backend metrics are active', () => {
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

    expect(screen.getByTestId('forge-source-disclosure')).toBeInTheDocument();
    expect(
      screen.getByText(/countywide KPI rollups and unverified standalone Forge modules stay preview-locked/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('renders the canonical Forge primary module set with suite-owned runtime surfaces', () => {
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

    expect(screen.getByText('CostForge')).toBeInTheDocument();
    expect(screen.getByText('CompsForge')).toBeInTheDocument();
    expect(screen.getByText('IncomeForge')).toBeInTheDocument();
    expect(screen.getByText('SalesForge')).toBeInTheDocument();
    expect(screen.getByTestId('forge-sale-qualification-queue')).toBeInTheDocument();

    const sourceFile = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../pages/suites/ForgeSuiteHome.tsx'),
      'utf8',
    );
    expect(sourceFile).toContain('TERRAFORGE_CANONICAL_INVENTORY');
    expect(sourceFile).toContain('<SaleQualificationQueue />');
    expect(sourceFile).not.toContain("workbenchTab === 'dais' ? 'Opens TerraDais workbench'");
  });
});
