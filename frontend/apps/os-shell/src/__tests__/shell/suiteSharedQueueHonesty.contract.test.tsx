import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';
import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';
import GptSuiteHome from '../../pages/suites/GptSuiteHome';

const mockUseCountyStats = vi.fn();
const mockUseDaisSuiteStats = vi.fn();
const mockOperationalQueue = vi.fn(() => <div data-testid="mock-operational-queue" />);

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => mockUseCountyStats(),
}));

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
  OperationalQueue: (props: unknown) => mockOperationalQueue(props),
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

vi.mock('../../components/gpt/GPTManagementDashboard', () => ({
  GPTManagementDashboard: () => <div data-testid="mock-gpt-management" />,
}));

vi.mock('../../components/gpt/RAGDatasetManager', () => ({
  RAGDatasetManager: () => <div data-testid="mock-rag-datasets" />,
}));

const MOCK_COUNTY_STATS = {
  totalParcels: 120850,
  totalAssessedValue: 41342000000,
  averageAssessedValue: 342100,
  activeAppeals: 138,
  pendingAssessments: 2417,
  assessmentCompletionPercent: 98.5,
  parcelsByCity: { Kennewick: 1, Richland: 1 },
  parcelsByType: { residential: 1, commercial: 1 },
};

const MOCK_DAIS_STATS = {
  activeAppeals: 138,
  totalLevyRevenue: 89500000,
  pendingAssessments: 2417,
  assessmentCompletionPercent: 74.3,
};

function expectRecentParcelsQueue() {
  const [queueCall] = mockOperationalQueue.mock.calls;
  expect(queueCall?.[0]).toEqual(
    expect.objectContaining({
      title: 'Recent Parcels',
      emptyMessage: 'No recent parcel activity',
    }),
  );
}

describe('mounted suite shared queue honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCountyStats.mockReturnValue({
      stats: MOCK_COUNTY_STATS,
      loading: false,
      error: null,
      source: 'snapshot',
    });

    mockUseDaisSuiteStats.mockReturnValue({
      stats: MOCK_DAIS_STATS,
      loading: false,
      error: null,
      source: 'county-provider',
    });
  });

  it('labels the Atlas suite queue as recent parcels', () => {
    render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>,
    );

    expectRecentParcelsQueue();
  });

  it('labels the Forge suite queue as recent parcels', () => {
    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    expectRecentParcelsQueue();
  });

  it('labels the Dais suite queue as recent parcels', () => {
    render(
      <MemoryRouter>
        <DaisSuiteHome />
      </MemoryRouter>,
    );

    expectRecentParcelsQueue();
  });

  it('labels the GPT suite queue as recent parcels', () => {
    render(
      <MemoryRouter>
        <GptSuiteHome />
      </MemoryRouter>,
    );

    expectRecentParcelsQueue();
  });
});