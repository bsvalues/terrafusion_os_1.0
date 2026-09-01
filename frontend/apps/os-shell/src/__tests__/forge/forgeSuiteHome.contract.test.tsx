/**
 * forgeSuiteHome.contract.test.tsx
 *
 * REGRESSION LOCK — TerraForge Suite Home taxonomy contract.
 *
 * This test file exists because the legacy card matrix has crawled back from
 * the dead twice. Every test here is a tombstone. If you're reading this
 * because a test failed, the zombie is back. Find the wrong component source
 * and kill it again.
 *
 * Locked taxonomy (June 10 TerraForge canonical inventory):
 *   PRIMARY:   CostForge · CompsForge · SalesForge · IncomeForge ·
 *              Reconciliation · Calibration / QC · CAMA Characteristics ·
 *              Valuation Notes / Defensibility
 *   SUPPORT:   Batch Cost Runs · Regression Studio · County Studio ·
 *              Coefficient Preview · Current-use Support
 *   QUEUE:     SaleQualificationQueue (the only panel surface)
 *
 * BANNED from suite home:
 *   - Governed Run, Cost Manual, Value Audit Log (reference/legacy cards)
 *   - ComparableSales, Reconciliation, Appeals, Value Audit (workbench openers)
 *   - RatioStudyPanel (removed surface)
 *   - "Parcel adapters, references, and planned scenes" heading
 *   - Any card that opens a property workbench from suite home
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTerraForgeCanonicalInventory } from '../../pages/suites/terraforgeCanonicalInventory';
import type { WashingtonCountyStatusEntry } from '../../services/washingtonCountyLaunch';

const {
  activateModuleMock,
  resolveWashingtonCountyStatusMock,
  verifyWashingtonCountySalesShardMock,
} = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  resolveWashingtonCountyStatusMock: vi.fn(),
  verifyWashingtonCountySalesShardMock: vi.fn(),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: null,
    loading: false,
    error: null,
    sourceDisclosure: null,
  }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector?: (s: unknown) => unknown) => {
    const state = { recentParcels: [] as unknown[], activeParcel: null };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: activateModuleMock,
}));

vi.mock('../../services/washingtonCountyLaunch', () => ({
  resolveWashingtonCountyStatus: resolveWashingtonCountyStatusMock,
  verifyWashingtonCountySalesShard: verifyWashingtonCountySalesShardMock,
}));

vi.mock('../../pages/suites/SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => (
    <div data-testid="mock-sale-qualification-queue" />
  ),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

// CompsPoolBrowser is imported from './CompsPoolBrowser' in ForgeSuiteHome —
// rendered in Slice 1.6. Mock to null so it doesn't surface "/comps pool/i" text.
vi.mock('../../pages/suites/CompsPoolBrowser', () => ({
  CompsPoolBrowser: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderForgeSuiteHome(metadata?: Record<string, unknown>) {
  const { default: ForgeSuiteHome } = await import(
    '../../pages/suites/ForgeSuiteHome'
  );
  const rendered = render(
    <MemoryRouter>
      <ForgeSuiteHome metadata={metadata} />
    </MemoryRouter>
  );
  return { ...rendered, ForgeSuiteHome };
}

function washingtonCountyContext(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    countyCode: '063',
    countyName: 'Spokane',
    resetValuationScope: true,
    launchContext: 'washington-counties-hub',
    dataTrustTier: 'public-reference-not-county-certified',
    referencePackageSource: 'hosted',
    referenceDataPosture: 'public_recorder_export',
    referenceRecordCount: 12,
    latestReferenceSaleDate: '2025-12-31',
    salesReviewAvailability: 'available',
    salesReviewUnavailableMessage: null,
    ...overrides,
  };
}

function hostedCountyStatus(
  overrides: Partial<WashingtonCountyStatusEntry> = {},
): WashingtonCountyStatusEntry {
  return {
    county: 'Spokane',
    countyCode: '063',
    packageIdentity: {
      statusSchemaVersion: 'terrafusion.washington.county-status.v1',
      statusCanonicalJsonSha256: 'a'.repeat(64),
      generatedAt: '2026-08-28T00:00:00.000Z',
      sourcePosture: 'public_recorder_export',
    },
    priority: 'statewide',
    prometheusStatus: 'reference_ready',
    primarySourceMode: 'public_recorder_export',
    latestSaleDate: '2025-12-31',
    candidateSales: 18,
    stagedSales: 12,
    needsReview: 4,
    salesShardVerification: 'unverified',
    confidence: {
      averageQualityScore: 0.91,
      parserStatus: 'ready',
      rawStatus: 'observed',
      rawDriftDetected: false,
    },
    staticRoutes: {
      detail: '/launch-data/washington/counties/063.json',
      salesShard: '/launch-data/washington/sales/by-county/063.json',
    },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TerraForge suite home — taxonomy contract', () => {
  beforeEach(() => {
    vi.resetModules();
    activateModuleMock.mockReset();
    resolveWashingtonCountyStatusMock.mockReset();
    verifyWashingtonCountySalesShardMock.mockReset();
  });

  // ── Primary tier ────────────────────────────────────────────────────────────

  it('renders every June 10 primary capability', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const cards = within(primary).getAllByRole('button');
    expect(cards).toHaveLength(8);
  });

  it('renders CostForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('CostForge')).toBeDefined();
  });

  it('renders CompsForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('CompsForge')).toBeDefined();
  });

  it('renders IncomeForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('IncomeForge')).toBeDefined();
  });

  it('renders SalesForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('SalesForge')).toBeDefined();
  });

  it('renders Reconciliation, Calibration / QC, CAMA Characteristics, and Valuation Notes as primary capability lanes', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');

    expect(within(primary).getByText('Reconciliation')).toBeDefined();
    expect(within(primary).getByText('Calibration / QC')).toBeDefined();
    expect(within(primary).getByText('CAMA Characteristics')).toBeDefined();
    expect(within(primary).getByText('Valuation Notes / Defensibility')).toBeDefined();
  });

  // ── Support / deferred tier ────────────────────────────────────────────────

  it('renders exactly five support/deferred tools outside primary proof', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    const cards = within(support).getAllByRole('button');
    expect(cards).toHaveLength(5);
  });

  it('does not render Statistics Studio or TerraGAMA in support/deferred tools', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).queryByText('Statistics Studio')).toBeNull();
    expect(within(support).queryByText('TerraGAMA')).toBeNull();
    expect(within(support).queryByText(/legacy specialist/i)).toBeNull();
  });

  it('renders Batch Cost Runs in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('Batch Cost Runs')).toBeDefined();
  });

  it('renders Regression Studio in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('Regression Studio')).toBeDefined();
  });

  it('renders County Studio, Coefficient Preview, and Current-use Support in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('County Studio')).toBeDefined();
    expect(within(support).getByText('Coefficient Preview')).toBeDefined();
    expect(within(support).getByText('Current-use Support')).toBeDefined();
  });

  it('matches the canonical inventory labels rendered on /forge', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const support = screen.getByTestId('forge-support-applications');

    for (const capability of getTerraForgeCanonicalInventory()) {
      const surface = capability.tier === 'primary' ? primary : support;
      expect(within(surface).getByText(capability.label)).toBeDefined();
    }
  });

  // ── Queue / panel surface ───────────────────────────────────────────────────

  it('renders SaleQualificationQueue as the only panel surface', async () => {
    await renderForgeSuiteHome();
    expect(screen.getByTestId('mock-sale-qualification-queue')).toBeDefined();
  });

  it('enters any selected county context without falling back to Benton runtime data', async () => {
    await renderForgeSuiteHome(washingtonCountyContext({
      countyCode: '001',
      countyName: 'Adams',
      referenceDataPosture: 'unavailable',
      referenceRecordCount: null,
      latestReferenceSaleDate: null,
      salesReviewAvailability: 'unavailable',
      salesReviewUnavailableMessage: 'No governed public sales state is available for Adams County.',
      officialAssessorBaseUrl: 'https://untrusted.example/adams',
    }));

    const countyContext = screen.getByTestId('forge-county-context');
    expect(countyContext).toHaveTextContent('Adams County');
    expect(countyContext).toHaveTextContent('WA-001');
    expect(countyContext).toHaveTextContent(/navigation context only/i);
    expect(countyContext).toHaveTextContent(/never fall back to Benton or another county/i);
    const publicSourceWorkflow = within(countyContext).getByTestId(
      'forge-public-source-workflow',
    );
    expect(publicSourceWorkflow).toHaveTextContent('County public-source research');
    expect(publicSourceWorkflow).toHaveTextContent(
      'Parcel/property search via TaxSifter; direct sales UI not yet verified in this pass',
    );
    expect(publicSourceWorkflow).toHaveTextContent('MapSifter/parcel detail history');
    expect(publicSourceWorkflow).toHaveTextContent('GIS / map surface');
    expect(publicSourceWorkflow).toHaveTextContent('MapSifter');
    expect(publicSourceWorkflow).toHaveTextContent('Parcel transfer history');
    expect(publicSourceWorkflow).toHaveTextContent('Source path researched');
    expect(publicSourceWorkflow).toHaveTextContent(/does not activate a TerraFusion sales shard/i);
    const officialSource = within(publicSourceWorkflow).getByRole('link', {
      name: /Open Adams County public-data entry point in a new tab/i,
    });
    expect(officialSource).toHaveAttribute('href', 'https://co.adams.wa.us');
    expect(officialSource).not.toHaveAttribute('href', 'https://untrusted.example/adams');
    expect(officialSource).toHaveAttribute('target', '_blank');
    expect(officialSource).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByTestId('forge-stats')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forge-calibration-desk')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-sale-qualification-queue')).not.toBeInTheDocument();

    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeDisabled();
    expect(within(primary).getByRole('button', { name: /CompsForge/i })).toBeDisabled();
    expect(within(primary).getByRole('button', { name: /CostForge/i })).toBeDisabled();
    expect(within(primary).getByRole('button', { name: /Reconciliation/i })).toHaveAttribute(
      'title',
      'This workflow is unavailable in the selected public county context.',
    );
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('fails closed when a Counties Hub county name and code do not match', async () => {
    await renderForgeSuiteHome(washingtonCountyContext({ countyName: 'Adams' }));

    expect(screen.getByTestId('forge-county-context-invalid')).toHaveTextContent(
      'County scope required',
    );
    expect(screen.getByText(/county scope invalid/i)).toBeInTheDocument();
    expect(screen.queryByTestId('forge-runtime-status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forge-stats')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forge-calibration-desk')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-sale-qualification-queue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forge-public-source-workflow')).not.toBeInTheDocument();

    const primary = screen.getByTestId('forge-primary-applications');
    for (const button of within(primary).getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('re-attests an available handoff before opening exact-county public workflows', async () => {
    const metadata = washingtonCountyContext();
    const status = hostedCountyStatus();
    resolveWashingtonCountyStatusMock.mockResolvedValue({
      counties: [status],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    verifyWashingtonCountySalesShardMock.mockResolvedValue({
      ...status,
      salesShardVerification: 'verified',
    });
    await renderForgeSuiteHome(metadata);

    const primary = screen.getByTestId('forge-primary-applications');
    const salesForge = within(primary).getByRole('button', { name: /SalesForge/i });
    const compsForge = within(primary).getByRole('button', { name: /CompsForge/i });
    await waitFor(() => {
      expect(salesForge).toBeEnabled();
      expect(compsForge).toBeEnabled();
    });
    expect(resolveWashingtonCountyStatusMock).toHaveBeenCalledTimes(1);
    expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(1);
    expect(within(primary).getByRole('button', { name: /CostForge/i })).toBeDisabled();

    fireEvent.click(salesForge);
    fireEvent.click(compsForge);

    expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', {
      source: 'system',
      metadata: expect.objectContaining({
        countyCode: '063',
        referenceRecordCount: 12,
        salesReviewAvailability: 'available',
      }),
    });
    expect(activateModuleMock).toHaveBeenCalledWith('comps-forge', {
      source: 'system',
      metadata: expect.objectContaining({
        countyCode: '063',
        referenceRecordCount: 12,
        salesReviewAvailability: 'available',
      }),
    });
  });

  it('keeps county context open while attestation runs, then unlocks public workflows', async () => {
    const pendingStatus = hostedCountyStatus();
    resolveWashingtonCountyStatusMock.mockResolvedValue({
      counties: [pendingStatus],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    let completeVerification!: (status: WashingtonCountyStatusEntry) => void;
    verifyWashingtonCountySalesShardMock.mockReturnValue(
      new Promise<WashingtonCountyStatusEntry>((resolve) => {
        completeVerification = resolve;
      }),
    );

    await renderForgeSuiteHome(washingtonCountyContext({
      referenceRecordCount: null,
      latestReferenceSaleDate: null,
      salesReviewAvailability: 'verifying',
      salesReviewUnavailableMessage: null,
    }));

    expect(screen.getByTestId('forge-county-context')).toHaveTextContent('Spokane County');
    expect(screen.getByTestId('forge-county-verification-pending')).toHaveTextContent(
      /will unlock only after attestation succeeds/i,
    );
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeDisabled();
    expect(within(primary).getByRole('button', { name: /CompsForge/i })).toBeDisabled();
    await waitFor(() => {
      expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      completeVerification({
        ...pendingStatus,
        salesShardVerification: 'verified',
      });
    });

    await waitFor(() => {
      expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeEnabled();
      expect(within(primary).getByRole('button', { name: /CompsForge/i })).toBeEnabled();
    });
    expect(screen.getByTestId('forge-county-context')).toHaveTextContent(
      /12 public\/reference sales are available/i,
    );

    fireEvent.click(within(primary).getByRole('button', { name: /SalesForge/i }));
    expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', {
      source: 'system',
      metadata: expect.objectContaining({
        countyCode: '063',
        referenceRecordCount: 12,
        salesReviewAvailability: 'available',
      }),
    });
  });

  it('rejects an unproven available claim and lets the assessor retry in TerraForge', async () => {
    const pendingStatus = hostedCountyStatus();
    resolveWashingtonCountyStatusMock
      .mockResolvedValueOnce({
        counties: [],
        packageSource: 'repository-reference',
        usedRepositoryFallback: true,
      })
      .mockResolvedValueOnce({
        counties: [pendingStatus],
        packageSource: 'hosted',
        usedRepositoryFallback: false,
      });
    verifyWashingtonCountySalesShardMock.mockResolvedValue({
      ...pendingStatus,
      salesShardVerification: 'verified',
    });

    await renderForgeSuiteHome(washingtonCountyContext());

    const retry = await screen.findByRole('button', { name: 'Retry county sales data' });
    const countyContext = screen.getByTestId('forge-county-context');
    expect(countyContext).toHaveTextContent(
      /hosted Spokane County public sales package is unavailable/i,
    );
    expect(countyContext).toHaveTextContent(/Source Unavailable/i);
    expect(countyContext).not.toHaveTextContent(/Source verification pending/i);
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeDisabled();
    expect(countyContext).not.toHaveTextContent(
      /12 public\/reference sales are available/i,
    );

    fireEvent.click(retry);

    await waitFor(() => {
      expect(resolveWashingtonCountyStatusMock).toHaveBeenCalledTimes(2);
      expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeEnabled();
    });
  });

  it('ignores a superseded county verification result after the context changes', async () => {
    const spokaneStatus = hostedCountyStatus();
    const adamsStatus = hostedCountyStatus({
      county: 'Adams',
      countyCode: '001',
      staticRoutes: {
        detail: '/launch-data/washington/counties/001.json',
        salesShard: '/launch-data/washington/sales/by-county/001.json',
      },
    });
    resolveWashingtonCountyStatusMock.mockResolvedValue({
      counties: [spokaneStatus, adamsStatus],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    let completeSpokane!: (status: WashingtonCountyStatusEntry) => void;
    let completeAdams!: (status: WashingtonCountyStatusEntry) => void;
    verifyWashingtonCountySalesShardMock.mockImplementation(
      (status: WashingtonCountyStatusEntry) => new Promise<WashingtonCountyStatusEntry>((resolve) => {
        if (status.countyCode === '063') completeSpokane = resolve;
        else completeAdams = resolve;
      }),
    );
    const pending = {
      referenceRecordCount: null,
      latestReferenceSaleDate: null,
      salesReviewAvailability: 'verifying',
      salesReviewUnavailableMessage: null,
    };

    const rendered = await renderForgeSuiteHome(washingtonCountyContext(pending));
    const RerenderedForgeSuiteHome = rendered.ForgeSuiteHome;
    await waitFor(() => expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(1));
    rendered.rerender(
      <MemoryRouter>
        <RerenderedForgeSuiteHome metadata={washingtonCountyContext({
          ...pending,
          countyCode: '001',
          countyName: 'Adams',
        })} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      completeAdams({ ...adamsStatus, salesShardVerification: 'verified' });
    });
    await waitFor(() => {
      expect(screen.getByTestId('forge-county-context')).toHaveTextContent('Adams County');
    });

    await act(async () => {
      completeSpokane({ ...spokaneStatus, salesShardVerification: 'verified' });
    });
    expect(screen.getByTestId('forge-county-context')).toHaveTextContent('Adams County');
    expect(screen.getByTestId('forge-county-context')).not.toHaveTextContent('Spokane County');
  });

  it('re-attests a refreshed request even when the county identity is unchanged', async () => {
    const spokaneStatus = hostedCountyStatus();
    resolveWashingtonCountyStatusMock.mockResolvedValue({
      counties: [spokaneStatus],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    const completeVerification: Array<(status: WashingtonCountyStatusEntry) => void> = [];
    verifyWashingtonCountySalesShardMock.mockImplementation(
      () => new Promise<WashingtonCountyStatusEntry>((resolve) => {
        completeVerification.push(resolve);
      }),
    );
    const pending = {
      referenceRecordCount: null,
      latestReferenceSaleDate: null,
      salesReviewAvailability: 'verifying',
      salesReviewUnavailableMessage: null,
    };

    const rendered = await renderForgeSuiteHome(washingtonCountyContext(pending));
    const RerenderedForgeSuiteHome = rendered.ForgeSuiteHome;
    await waitFor(() => expect(completeVerification).toHaveLength(1));

    await act(async () => {
      completeVerification[0]!({ ...spokaneStatus, salesShardVerification: 'verified' });
    });
    const primary = screen.getByTestId('forge-primary-applications');
    await waitFor(() => {
      expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeEnabled();
    });

    const refreshLayoutStates: boolean[] = [];
    function RefreshLayoutProbe() {
      React.useLayoutEffect(() => {
        const salesForgeButton = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '[data-testid="forge-primary-applications"] button',
          ),
        ).find((button) => button.textContent?.includes('SalesForge'));
        refreshLayoutStates.push(salesForgeButton?.disabled ?? false);
      }, []);
      return null;
    }

    rendered.rerender(
      <MemoryRouter>
        <RerenderedForgeSuiteHome metadata={washingtonCountyContext(pending)} />
        <RefreshLayoutProbe />
      </MemoryRouter>,
    );
    expect(refreshLayoutStates).toEqual([true]);
    await waitFor(() => expect(completeVerification).toHaveLength(2));
    expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeDisabled();
    expect(screen.getByTestId('forge-county-verification-pending')).toBeInTheDocument();

    await act(async () => {
      completeVerification[1]!({ ...spokaneStatus, salesShardVerification: 'verified' });
    });
    await waitFor(() => {
      expect(within(primary).getByRole('button', { name: /SalesForge/i })).toBeEnabled();
    });
  });

  // ── Banned cards (legacy resurrection tests) ────────────────────────────────

  it('BANNED: does not render Governed Run', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Governed Run')).toBeNull();
  });

  it('BANNED: does not render Cost Manual card on suite home', async () => {
    await renderForgeSuiteHome();
    // Cost Manual is a standalone page — it must not appear as a suite home card
    expect(screen.queryByText('Cost Manual')).toBeNull();
  });

  it('BANNED: does not render Value Audit Log', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Value Audit Log')).toBeNull();
  });

  it('BANNED: does not render ComparableSales as a standalone card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Comparable Sales')).toBeNull();
  });

  it('renders Reconciliation only as a primary canonical lane, not as a workbench-opener card', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('Reconciliation')).toBeDefined();
    expect(screen.queryByText('Open Property Workbench')).toBeNull();
  });

  it('BANNED: does not render Appeals card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Appeals')).toBeNull();
  });

  it('BANNED: does not render Value Audit card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Value Audit')).toBeNull();
  });

  it('BANNED: does not render the legacy "Parcel adapters, references, and planned scenes" section heading', async () => {
    await renderForgeSuiteHome();
    expect(
      screen.queryByText(/parcel adapters, references, and planned scenes/i)
    ).toBeNull();
  });

  it('BANNED: does not render RatioStudyPanel', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText(/ratio study/i)).toBeNull();
  });

  it('BANNED: does not render CompsPoolBrowser as a suite proof card', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const support = screen.getByTestId('forge-support-applications');

    expect(within(primary).queryByText(/comps pool/i)).toBeNull();
    expect(within(support).queryByText(/comps pool/i)).toBeNull();
  });

  // ── Wrong-suite items ───────────────────────────────────────────────────────

  it('BANNED: does not render Income Valuation as a workbench-opener card (belongs in primary as IncomeForge)', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Income Valuation')).toBeNull();
  });
});
