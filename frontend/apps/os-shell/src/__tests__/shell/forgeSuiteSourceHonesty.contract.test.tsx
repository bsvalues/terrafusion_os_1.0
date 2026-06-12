import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';

const mockUseCountyStats = vi.fn();
const mockSuiteModuleGrid = vi.fn(() => <div data-testid="mock-module-grid" />);
const invokeToolMock = vi.fn();
const activateModuleMock = vi.fn();
const apiFetchMock = vi.fn();
const getTokenMock = vi.fn();
const persistTokenMock = vi.fn();

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => mockUseCountyStats(),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => invokeToolMock(...args),
}));

vi.mock('../../lib/apiBase', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('../../auth/authStorage', () => ({
  getToken: () => getTokenMock(),
  setToken: (token: string) => persistTokenMock(token),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => activateModuleMock(...args),
}));

vi.mock('../../auth/session', () => ({
  getSession: () => ({
    userId: 'appraiser-1',
    countyId: '19190019-1919-1919-1919-191919191919',
    role: 'appraiser',
    mode: 'pilot',
  }),
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

vi.mock('../../pages/suites/SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => <div data-testid="forge-sale-qualification-queue" />,
}));

vi.mock('../../pages/suites/CompsPoolBrowser', () => ({
  CompsPoolBrowser: () => <div data-testid="forge-comps-pool-browser" />,
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
    getTokenMock.mockReturnValue('dev-token');
    apiFetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      }),
    );
  });

  it('includes TerraForge while disclosing suite metrics and standalone modules are preview-locked', () => {
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
      screen.getByText(/TerraForge is part of the Benton operating model/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Property Workbench/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TerraForge is not part of the June 10 runtime proof path/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('does not present TerraForge aggregates as June 10 live proof even when provider mode is live', () => {
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

    expect(screen.getByTestId('forge-source-disclosure')).toHaveTextContent(
      /TerraForge is part of the Benton operating model/i,
    );
    expect(screen.queryByText(/TerraForge is not part of the June 10 runtime proof path/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live metrics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live regression/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live spatial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live preview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live Forge applications/i)).not.toBeInTheDocument();
    expect(screen.queryByText('120,850')).not.toBeInTheDocument();
    expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
  });

  it('renders verified runtime-backed suite panels while keeping stale KPIs hidden', () => {
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

    expect(screen.getByTestId('forge-sale-qualification-queue')).toBeInTheDocument();
    expect(screen.getByTestId('forge-comps-pool-browser')).toBeInTheDocument();
    expect(screen.queryByText('120,850')).not.toBeInTheDocument();
    expect(screen.queryByText('$342,100')).not.toBeInTheDocument();
  });

  it('binds TerraForge suite metrics to proven app runtime data while blocking unaccepted county rollup values', async () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });
    apiFetchMock.mockImplementation((path: string) => {
      if (path.startsWith('/terraforge/sale-qualification?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 52, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/terraforge/comps-pool?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 36, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/costforge/cost-matrix/benton')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 42, entries: [] }),
        });
      }
      if (path.startsWith('/costforge/income-approach/cap-rates')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ capRates: [{ propertyType: 'commercial' }, { propertyType: 'industrial' }, { propertyType: 'multi-family' }, { propertyType: 'office' }, { propertyType: 'retail' }] }),
        });
      }
      if (path.startsWith('/terraforge/county-stats?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            taxYear: 2026,
            totalParcels: 128784,
            averageAssessedValue: 469564.7,
            assessedThisYear: 128784,
            pendingAssessments: 95758,
            assessmentCompletionPercent: 71.4,
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    const runtimeStatus = screen.getByTestId('forge-runtime-status');
    await waitFor(() => expect(runtimeStatus).toHaveTextContent(/Metrics app-backed; county rollup blocked/i));

    const stats = screen.getByTestId('forge-stats');
    await waitFor(() => expect(stats).toHaveTextContent(/county-stats returned unaccepted stale rollup values/i));
    expect(stats).toHaveTextContent(/SALE QUEUE/i);
    expect(stats).toHaveTextContent(/52/);
    expect(stats).toHaveTextContent(/COMPS POOL/i);
    expect(stats).toHaveTextContent(/36/);
    expect(stats).toHaveTextContent(/COST MATRIX/i);
    expect(stats).toHaveTextContent(/42/);
    expect(stats).toHaveTextContent(/INCOME REFS/i);
    expect(stats).toHaveTextContent(/5/);
    expect(stats).toHaveTextContent(/COUNTY ROLLUP/i);
    expect(stats).toHaveTextContent(/Unavailable/i);
    expect(stats).toHaveTextContent(/county-stats returned unaccepted stale rollup values/i);
    expect(screen.queryByText('120,850')).not.toBeInTheDocument();
    expect(screen.queryByText('$342,100')).not.toBeInTheDocument();
    expect(screen.queryByText('128,784')).not.toBeInTheDocument();
    expect(screen.queryByText('$469,565')).not.toBeInTheDocument();
    expect(screen.queryByText('95,758')).not.toBeInTheDocument();
    expect(screen.queryByText('71.4%')).not.toBeInTheDocument();
  });

  it('hydrates a missing dev auth token before reading TerraForge runtime metrics', async () => {
    getTokenMock.mockReturnValue(null);
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });
    apiFetchMock.mockImplementation((path: string) => {
      if (path === '/auth/dev-token') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'fresh-dev-token' }),
        });
      }
      if (path.startsWith('/terraforge/sale-qualification?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 36, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/terraforge/comps-pool?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 36, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/costforge/cost-matrix/benton')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 66, entries: [] }),
        });
      }
      if (path.startsWith('/costforge/income-approach/cap-rates')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ capRates: Array.from({ length: 5 }, (_, index) => ({ propertyType: `type-${index}` })) }),
        });
      }
      if (path.startsWith('/terraforge/county-stats?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            totalParcels: 128784,
            averageAssessedValue: 469564.7,
            pendingAssessments: 95758,
            assessmentCompletionPercent: 71.4,
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith('/auth/dev-token', expect.anything()));
    await waitFor(() => expect(persistTokenMock).toHaveBeenCalledWith('fresh-dev-token'));
    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/terraforge/sale-qualification?'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer fresh-dev-token' }),
        }),
      );
    });
    await waitFor(() => expect(screen.getByTestId('forge-stats')).toHaveTextContent(/SALE QUEUE36/i));
    expect(screen.queryByText(/HTTP 500/i)).not.toBeInTheDocument();
  });

  it('retries TerraForge runtime metrics with a fresh dev token when stored auth is stale', async () => {
    getTokenMock.mockReturnValue('stale-dev-token');
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });
    const staleSaleResponse = vi.fn();
    const freshSaleResponse = vi.fn();
    apiFetchMock.mockImplementation((path: string, init?: RequestInit) => {
      const auth = init?.headers && !Array.isArray(init.headers)
        ? (init.headers as Record<string, string>).Authorization
        : undefined;
      if (path === '/auth/dev-token') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'fresh-dev-token' }),
        });
      }
      if (path.startsWith('/terraforge/sale-qualification?')) {
        if (auth === 'Bearer stale-dev-token') {
          staleSaleResponse();
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
          });
        }
        if (auth === 'Bearer fresh-dev-token') {
          freshSaleResponse();
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ total: 36, page: 1, pageSize: 1, items: [] }),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ total: 1, page: 1, pageSize: 1, items: [], count: 1, capRates: [{}] }),
      });
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    await waitFor(() => expect(staleSaleResponse).toHaveBeenCalled());
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith('/auth/dev-token', expect.anything()));
    await waitFor(() => expect(freshSaleResponse).toHaveBeenCalled());
    expect(persistTokenMock).toHaveBeenCalledWith('fresh-dev-token');
    await waitFor(() => expect(screen.getByTestId('forge-stats')).toHaveTextContent(/SALE QUEUE36/i));
    expect(screen.queryByText(/HTTP 500/i)).not.toBeInTheDocument();
  });

  it('keeps the runtime board bounded after the five landed TerraForge paths', async () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });
    apiFetchMock.mockImplementation((path: string) => {
      if (path.startsWith('/terraforge/sale-qualification?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 52, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/terraforge/comps-pool?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 36, page: 1, pageSize: 1, items: [] }),
        });
      }
      if (path.startsWith('/costforge/cost-matrix/benton')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 66, entries: [] }),
        });
      }
      if (path.startsWith('/costforge/income-approach/cap-rates')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ capRates: Array.from({ length: 5 }, (_, index) => ({ propertyType: `type-${index}` })) }),
        });
      }
      if (path.startsWith('/terraforge/county-stats?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            totalParcels: 128784,
            averageAssessedValue: 469564.7,
            pendingAssessments: 95758,
            assessmentCompletionPercent: 71.4,
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    const runtimeStatus = screen.getByTestId('forge-runtime-status');
    await waitFor(() => expect(runtimeStatus).toHaveTextContent(/Metrics app-backed; county rollup blocked/i));
    expect(runtimeStatus).toHaveTextContent(/SalesForge runtime/i);
    expect(runtimeStatus).toHaveTextContent(/CostForge live triage path/i);
    expect(runtimeStatus).toHaveTextContent(/CompsForge runtime comps pool/i);
    expect(runtimeStatus).toHaveTextContent(/IncomeForge runtime income approach/i);
    expect(runtimeStatus).toHaveTextContent(/County Studio runtime studies/i);
    expect(runtimeStatus).toHaveTextContent(/Full TerraForge not done/i);
    expect(runtimeStatus).toHaveTextContent(/CUForge\/specialists locked/i);
    expect(runtimeStatus).toHaveTextContent(/County Studio health not rollup proof/i);

    const primaryApps = within(screen.getByTestId('forge-primary-applications'));
    expect(primaryApps.getByRole('button', { name: /SalesForge/i })).toBeEnabled();
    expect(primaryApps.getByRole('button', { name: /CostForge/i })).toBeEnabled();
    expect(primaryApps.getByRole('button', { name: /CompsForge/i })).toBeEnabled();
    expect(primaryApps.getByRole('button', { name: /IncomeForge/i })).toBeEnabled();
    expect(primaryApps.getByRole('button', { name: /CUForge/i })).toBeDisabled();

    const countyApps = within(screen.getByTestId('forge-county-applications'));
    expect(countyApps.getByRole('button', { name: /County Studio/i })).toBeEnabled();

    const secondaryApps = within(screen.getByTestId('forge-secondary-applications'));
    expect(secondaryApps.getByRole('button', { name: /Batch Cost Runs/i })).toBeDisabled();
    expect(secondaryApps.getByRole('button', { name: /Regression Studio/i })).toBeDisabled();
    expect(secondaryApps.getByRole('button', { name: /TerraGAMA/i })).toBeDisabled();
    expect(secondaryApps.getByRole('button', { name: /Coefficient Preview/i })).toBeDisabled();

    expect(screen.queryByText(/Full TerraForge is done/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suite metrics are fully runtime-backed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/County Rollup.*runtime-backed proof/i)).not.toBeInTheDocument();
    expect(screen.queryByText('128,784')).not.toBeInTheDocument();
    expect(screen.queryByText('$469,565')).not.toBeInTheDocument();
    expect(screen.queryByText('95,758')).not.toBeInTheDocument();
    expect(screen.queryByText('71.4%')).not.toBeInTheDocument();
  });

  it('opens SalesForge, CompsForge, and IncomeForge from TerraForge Suite while keeping unverified standalone Forge apps locked', () => {
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

    const primaryApps = within(screen.getByTestId('forge-primary-applications'));
    expect(primaryApps.getByRole('button', { name: /CostForge/i })).toBeEnabled();
    const compsForgeCard = primaryApps.getByRole('button', { name: /CompsForge/i });
    expect(compsForgeCard).toBeEnabled();
    expect(compsForgeCard).toHaveTextContent(/Statewide sales comp search/i);
    expect(compsForgeCard).not.toHaveTextContent(/Benton comps pool API/i);
    const incomeForgeCard = primaryApps.getByRole('button', { name: /IncomeForge/i });
    expect(incomeForgeCard).toBeEnabled();
    expect(incomeForgeCard).toHaveTextContent(/Benton income approach API/i);

    const salesForgeCard = primaryApps.getByRole('button', { name: /SalesForge/i });
    expect(salesForgeCard).toBeEnabled();
    expect(salesForgeCard).toHaveTextContent(/Benton sale qualification API/i);
    expect(screen.getAllByText(/Standalone preview locked/i).length).toBeGreaterThan(0);

    fireEvent.click(salesForgeCard);

    expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', {
      source: 'system',
      metadata: {
        launchContext: 'terraforge-suite',
        dataSource: 'terrafusion-api',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
      },
    });

    fireEvent.click(compsForgeCard);

    expect(activateModuleMock).toHaveBeenCalledWith('comps-forge', {
      source: 'system',
      metadata: {
        launchContext: 'terraforge-suite',
        dataSource: 'terrafusion-api',
        runtimePath: 'compsforge-comps-pool',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
      },
    });

    fireEvent.click(incomeForgeCard);

    expect(activateModuleMock).toHaveBeenCalledWith('income-forge', {
      source: 'system',
      metadata: {
        launchContext: 'terraforge-suite',
        dataSource: 'terrafusion-api',
        runtimePath: 'income-approach',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
      },
    });
  });

  it('opens CostForge from TerraForge Suite on the live triage API path', () => {
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

    const runtimeStatus = screen.getByTestId('forge-runtime-status');
    expect(runtimeStatus).toHaveTextContent(/SalesForge\s+runtime/i);
    expect(runtimeStatus).toHaveTextContent(/CostForge\s+live triage path/i);
    expect(runtimeStatus).toHaveTextContent(/CompsForge\s+runtime comps pool/i);
    expect(runtimeStatus).toHaveTextContent(/IncomeForge\s+runtime income approach/i);
    expect(runtimeStatus).toHaveTextContent(/Metrics app-backed/i);

    const primaryApps = within(screen.getByTestId('forge-primary-applications'));
    const costForgeCard = primaryApps.getByRole('button', { name: /CostForge/i });
    expect(costForgeCard).toBeEnabled();
    expect(costForgeCard).toHaveTextContent(/Benton CostForge triage API/i);

    fireEvent.click(costForgeCard);

    expect(activateModuleMock).toHaveBeenCalledWith('costforge', {
      source: 'system',
      metadata: {
        launchContext: 'terraforge-suite',
        dataSource: 'terrafusion-api',
        runtimePath: 'costforge-triage',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
      },
    });
  });

  it('opens County Studio from TerraForge Suite on the Benton study runtime path', () => {
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

    const runtimeStatus = screen.getByTestId('forge-runtime-status');
    expect(runtimeStatus).toHaveTextContent(/County Studio\s+runtime studies/i);

    const countyApps = within(screen.getByTestId('forge-county-applications'));
    const countyStudioCard = countyApps.getByRole('button', { name: /County Studio/i });
    expect(countyStudioCard).toBeEnabled();
    expect(countyStudioCard).toHaveTextContent(/Benton County Studio studies API/i);
    expect(screen.queryByRole('button', { name: /County Studio preview locked/i })).not.toBeInTheDocument();

    fireEvent.click(countyStudioCard);

    expect(activateModuleMock).toHaveBeenCalledWith('county-studio', {
      source: 'system',
      metadata: {
        launchContext: 'terraforge-suite',
        dataSource: 'terrafusion-api',
        runtimePath: 'county-studio-studies',
        countyId: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
      },
    });
  });

  it('runs verified TerraForge suite command actions through county-scoped Pilot tools', async () => {
    mockUseCountyStats.mockReturnValue({
      stats: MOCK_STATS,
      loading: false,
      error: null,
      source: 'live',
    });
    invokeToolMock
      .mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-brief',
        result: {
          toolId: 'generate_morning_brief',
          output: JSON.stringify({
            brief: {
              role: 'chief_appraiser',
              queueType: 'calibration_review',
              priority: 'high',
              dueWindow: '08:00-11:00 local',
              recommendedTool: 'rerun_ratio_study',
              readyToAct: true,
              blockingDependencies: [],
            },
            findings: [],
          }),
        },
      })
      .mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-sweep',
        result: {
          toolId: 'rerun_ratio_study',
          output: JSON.stringify({
            metrics: {
              prdBefore: 1.04,
              prdAfter: 1.02,
              codBefore: 12.2,
              codAfter: 10.8,
              avDelta: 450000,
              fairnessDelta: 0.02,
            },
            readyForSignoff: true,
            narrative: 'Rerun complete.',
          }),
        },
      })
      .mockResolvedValueOnce({
        success: true,
        correlationId: 'corr-memo',
        result: {
          toolId: 'generate_calibration_memo',
          output: JSON.stringify({
            payloadRef: 'dossier://benton/calibration-memos/benton-2026-working',
            sections: ['executive-summary', 'drivers', 'impact-preview', 'signoff'],
            summary: 'Calibration memo ready.',
          }),
        },
      });

    render(
      <MemoryRouter>
        <ForgeSuiteHome />
      </MemoryRouter>,
    );

    const briefButton = screen.getByRole('button', { name: /Refresh Brief/i });
    const sweepButton = screen.getByRole('button', { name: /Run Sweep/i });
    const memoButton = screen.getByRole('button', { name: /Draft Memo/i });

    expect(briefButton).toBeEnabled();
    expect(sweepButton).toBeEnabled();
    expect(memoButton).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Morning Brief locked/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Diagnostics locked/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Memo locked/i })).not.toBeInTheDocument();

    fireEvent.click(briefButton);
    fireEvent.click(sweepButton);
    fireEvent.click(memoButton);

    await waitFor(() => expect(invokeToolMock).toHaveBeenCalledTimes(3));
    expect(invokeToolMock).toHaveBeenCalledWith({
      toolId: 'generate_morning_brief',
      mode: 'muse',
      params: {
        county: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
        role: 'chief_appraiser',
      },
    });
    expect(invokeToolMock).toHaveBeenCalledWith({
      toolId: 'rerun_ratio_study',
      mode: 'pilot',
      params: {
        county: '19190019-1919-1919-1919-191919191919',
        taxYear: 2026,
        draftVersion: 'benton-2026-working',
        scope: 'county',
      },
    });
    expect(invokeToolMock).toHaveBeenCalledWith({
      toolId: 'generate_calibration_memo',
      mode: 'muse',
      params: {
        county: '19190019-1919-1919-1919-191919191919',
        draftVersion: 'benton-2026-working',
        audience: 'board',
        reasonCode: 'annual_certification',
      },
      confirmation: { confirmed: true, reasonCode: 'annual_certification' },
    });
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
    expect(sourceFile).not.toContain('<ParcelContextBanner');
  });
});
