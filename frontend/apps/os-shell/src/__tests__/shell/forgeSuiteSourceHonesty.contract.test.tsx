import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';

const mockUseCountyStats = vi.fn();
const mockSuiteModuleGrid = vi.fn(() => <div data-testid="mock-module-grid" />);
const invokeToolMock = vi.fn();
const activateModuleMock = vi.fn();

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => mockUseCountyStats(),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => invokeToolMock(...args),
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

  it('opens SalesForge from TerraForge Suite while keeping unverified standalone Forge apps locked', () => {
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
    expect(primaryApps.getByRole('button', { name: /CompsForge/i })).toBeDisabled();
    expect(primaryApps.getByRole('button', { name: /IncomeForge/i })).toBeDisabled();
    expect(primaryApps.getByRole('button', { name: /CostForge/i })).toBeEnabled();

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
    expect(runtimeStatus).toHaveTextContent(/CompsForge\s+preview-locked/i);
    expect(runtimeStatus).toHaveTextContent(/IncomeForge\s+preview-locked/i);
    expect(runtimeStatus).toHaveTextContent(/Metrics\s+not runtime-backed/i);

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
