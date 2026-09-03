// frontend/apps/os-shell/src/pages/forge/sales/__tests__/SalesForge.deeplink.test.tsx
//
// Task D2 — SalesForge deeplink consumption.
// Verifies the mount-time handler for County Studio Inspector metadata:
//   - stratumKey → setSelectedStratumKey + activeTab='ai-audit'
//   - taxYear → setTaxYear (queue state reset so stale data isn't shown)
//   - segmentId/segmentLabel → setContextSegment → renders Scoped From chip
//   - chip click → activateModule('county-studio', ...) for round-trip
//   - deeplinkQuery-only fallback parsing still produces the same effects
//   - no-metadata mount does NOT clobber existing store state

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import SalesForge from '../SalesForge';
import { useSalesForgeStore } from '../salesForgeStore';
import { SALESFORGE_TAX_YEAR } from '../salesForgeTypes';

// Mock activateModule so chip-click is observable without the full shell.
const activateModuleMock = vi.hoisted(() => vi.fn());
const washingtonCountyLaunchMocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  verify: vi.fn(),
}));
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));
vi.mock('@/services/washingtonCountyLaunch', () => ({
  resolveWashingtonCountyStatus: washingtonCountyLaunchMocks.resolve,
  verifyWashingtonCountySalesShard: washingtonCountyLaunchMocks.verify,
}));

// The child panels fetch live data — replace them with cheap render stubs
// so tests don't need to mock every PACS endpoint.
vi.mock('../panels/QualificationQueuePanel', () => ({
  QualificationQueuePanel: () => <div data-testid='stub-queue' />,
}));
vi.mock('../panels/RatioAuditPanel', () => ({
  RatioAuditPanel: () => <div data-testid='stub-ratio' />,
}));
vi.mock('../panels/NeighborhoodViewPanel', () => ({
  NeighborhoodViewPanel: () => <div data-testid='stub-hood' />,
}));
vi.mock('../panels/CodeAuditPanel', () => ({
  CodeAuditPanel: () => <div data-testid='stub-code' />,
}));
vi.mock('../panels/DorExportPanel', () => ({
  DorExportPanel: () => <div data-testid='stub-dor' />,
}));
vi.mock('../audit/AuditCommandCenter', () => ({
  AuditCommandCenter: ({ taxYear }: { taxYear: number }) => (
    <div data-testid='stub-ai-audit' data-year={taxYear} />
  ),
}));
vi.mock('../components/RunningStatsPanel', () => ({
  RunningStatsPanel: () => <div data-testid='stub-stats' />,
}));

function resetStore() {
  // Reset via store actions so the setter contracts are exercised too.
  act(() => {
    const s = useSalesForgeStore.getState();
    s.setDataSource('live-api');
    s.setActiveTab('queue');
    s.setSelectedStratumKey(null);
    s.setTaxYear(2026);
    s.setContextSegment(null);
    s.applyCountyStudioScope('005', null);
    s.clearFilters();
  });
}

function hostedBentonStatus() {
  return {
    county: 'Benton',
    countyCode: '005',
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
    candidateSales: 1,
    stagedSales: 1,
    needsReview: 0,
    salesShardVerification: 'unverified',
    confidence: {
      averageQualityScore: 0.9,
      parserStatus: 'ready',
      rawStatus: 'observed',
      rawDriftDetected: false,
    },
    staticRoutes: {
      detail: '/launch-data/washington/counties/005.json',
      salesShard: '/launch-data/washington/sales/by-county/005.json',
    },
  };
}

describe('SalesForge — County Studio deeplink consumption (Task D2)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    activateModuleMock.mockReset();
    const benton = hostedBentonStatus();
    washingtonCountyLaunchMocks.resolve.mockReset().mockResolvedValue({
      counties: [benton],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    washingtonCountyLaunchMocks.verify.mockReset().mockImplementation(async (county) => ({
      ...county,
      salesShardVerification: 'verified',
    }));
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  it('does not touch store state when no metadata is provided', () => {
    render(<SalesForge />);
    const s = useSalesForgeStore.getState();
    expect(s.selectedStratumKey).toBeNull();
    expect(s.contextSegmentId).toBeNull();
    // Default tab stays 'queue' (no forced switch).
    expect(s.activeTab).toBe('queue');
    // No scoped-from chip when there's no segment context.
    expect(screen.queryByTestId('sf-scoped-from-chip')).not.toBeInTheDocument();
  });

  it('uses the independently verified package year instead of an untrusted Hub claim', async () => {
    const olderPackage = {
      ...hostedBentonStatus(),
      latestSaleDate: '2024-12-31',
    };
    washingtonCountyLaunchMocks.resolve.mockResolvedValue({
      counties: [olderPackage],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    washingtonCountyLaunchMocks.verify.mockResolvedValue({
      ...olderPackage,
      salesShardVerification: 'verified',
    });

    render(
      <SalesForge
        metadata={{
          countyCode: '005',
          countyName: 'Benton',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: 999,
          latestReferenceSaleDate: '2099-12-31',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
      expect(useSalesForgeStore.getState().taxYear).toBe(2024);
    });
    expect(screen.getByText('2024 study year')).toBeInTheDocument();
  });

  it('keeps public-package mode on package-backed tabs and forces stale live state to Queue', async () => {
    window.history.replaceState({}, '', '/?wa-launch-data=1');
    act(() => {
      useSalesForgeStore.getState().setActiveTab('ai-audit');
    });

    render(<SalesForge />);

    expect(await screen.findByRole('tab', { name: 'Queue' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Neighborhoods' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Code Audit' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'AI Audit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Ratio Audit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'DOR Export' })).not.toBeInTheDocument();
    expect(await screen.findByTestId('stub-queue')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-ai-audit')).not.toBeInTheDocument();
    expect(screen.getByText(/Public\/reference package only/i)).toHaveTextContent(
      /browser-local and nonofficial/i
    );
    expect(screen.getByText(/Public\/reference package only/i)).not.toHaveTextContent(
      /invented synthetic sales/i
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().activeTab).toBe('queue');
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
    });
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(1);
    expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledTimes(1);
  });

  it('keeps direct hosted SalesForge data-closed when county attestation is unavailable', async () => {
    window.history.replaceState({}, '', '/?wa-launch-data=1');
    washingtonCountyLaunchMocks.resolve.mockResolvedValueOnce({
      counties: [],
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    });

    render(<SalesForge />);

    expect(
      await screen.findByText(/No authenticated hosted sales package is currently available/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('salesforge-data-unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stub-queue')).not.toBeInTheDocument();
    expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    expect(washingtonCountyLaunchMocks.verify).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('salesforge-retry-hosted-verification'));

    expect(await screen.findByTestId('stub-queue')).toBeInTheDocument();
    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
    });
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(2);
    expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledTimes(1);
  });

  it('bounds a stalled direct hosted verification and exposes retry', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/?wa-launch-data=1');
    washingtonCountyLaunchMocks.resolve.mockReturnValueOnce(new Promise(() => {}));

    render(<SalesForge />);

    expect(
      screen.getByText(/authenticating the selected county public-data package/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('salesforge-retry-hosted-verification')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(
      screen.getByText(/No authenticated hosted sales package is currently available/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('salesforge-retry-hosted-verification')).toBeInTheDocument();
    expect(screen.getByTestId('salesforge-data-unavailable')).toBeInTheDocument();
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(1);
    expect(washingtonCountyLaunchMocks.verify).not.toHaveBeenCalled();
  });

  it('does not trust an available hosted Hub claim before reattestation', async () => {
    washingtonCountyLaunchMocks.resolve.mockResolvedValueOnce({
      counties: [],
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    });

    render(
      <SalesForge
        metadata={{
          countyCode: '005',
          countyName: 'Benton',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: 999,
          latestReferenceSaleDate: '2099-12-31',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    expect(
      await screen.findByText(/No authenticated hosted sales package is currently available/i)
    ).toBeInTheDocument();
    expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(1);
    expect(washingtonCountyLaunchMocks.verify).not.toHaveBeenCalled();
  });

  it('closes data in the same render when a same-county handoff is refreshed', async () => {
    const benton = hostedBentonStatus();
    washingtonCountyLaunchMocks.resolve.mockResolvedValue({
      counties: [benton],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    const completeVerification: Array<(county: typeof benton) => void> = [];
    washingtonCountyLaunchMocks.verify.mockImplementation(
      () => new Promise<typeof benton>((resolve) => completeVerification.push(resolve))
    );
    const handoff = () =>
      ({
        countyCode: '005',
        countyName: 'Benton',
        resetValuationScope: true,
        launchContext: 'washington-counties-hub',
        dataTrustTier: 'public-reference-not-county-certified',
        referencePackageSource: 'hosted',
        referenceDataPosture: 'public_recorder_export',
        referenceRecordCount: 1,
        latestReferenceSaleDate: '2025-12-31',
        salesReviewAvailability: 'available',
        salesReviewUnavailableMessage: null,
      }) as const;

    const rendered = render(<SalesForge metadata={handoff()} />);
    await waitFor(() => expect(completeVerification).toHaveLength(1));
    await act(async () => {
      completeVerification[0]!({ ...benton, salesShardVerification: 'verified' });
    });
    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
    });

    const refreshLayoutSources: string[] = [];
    function RefreshLayoutProbe() {
      React.useLayoutEffect(() => {
        refreshLayoutSources.push(useSalesForgeStore.getState().dataSource);
      }, []);
      return null;
    }

    rendered.rerender(
      <>
        <SalesForge metadata={handoff()} />
        <RefreshLayoutProbe />
      </>
    );
    expect(refreshLayoutSources).toEqual(['live-api']);
    await waitFor(() => expect(completeVerification).toHaveLength(2));
    expect(
      screen.getByText(/authenticating the selected county public-data package/i)
    ).toBeInTheDocument();

    await act(async () => {
      completeVerification[1]!({ ...benton, salesShardVerification: 'verified' });
    });
    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
    });
  });

  it('reverifies a changed county after an available hosted Hub handoff', async () => {
    const benton = hostedBentonStatus();
    const spokane = {
      ...benton,
      county: 'Spokane',
      countyCode: '063',
      staticRoutes: {
        detail: '/launch-data/washington/counties/063.json',
        salesShard: '/launch-data/washington/sales/by-county/063.json',
      },
    };
    washingtonCountyLaunchMocks.resolve.mockResolvedValue({
      counties: [benton, spokane],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    let finishVerification: ((county: typeof spokane) => void) | undefined;
    washingtonCountyLaunchMocks.verify
      .mockImplementationOnce(async (county) => ({
        ...county,
        salesShardVerification: 'verified',
      }))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishVerification = resolve;
          })
      );

    render(
      <SalesForge
        metadata={{
          countyCode: '005',
          countyName: 'Benton',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: 1,
          latestReferenceSaleDate: '2025-12-31',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
    });
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(1);
    expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledWith(
      expect.objectContaining({ countyCode: '005' }),
      expect.anything()
    );

    act(() => {
      const store = useSalesForgeStore.getState();
      store.setFilterForm({ countyCode: '063' });
      store.applyFilters();
    });

    await waitFor(() => {
      expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(2);
      expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledWith(
        expect.objectContaining({ countyCode: '063' }),
        expect.anything()
      );
    });
    expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('063');
    expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    expect(screen.getByText('Spokane County')).toBeInTheDocument();
    expect(
      screen.getByText(/authenticating the selected county public-data package/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('stub-queue')).not.toBeInTheDocument();

    await act(async () => {
      finishVerification?.({
        ...spokane,
        salesShardVerification: 'verified',
      });
    });

    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
      expect(screen.getByTestId('stub-queue')).toBeInTheDocument();
    });
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(2);
    expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledTimes(2);
  });

  it('verifies an original pending Hub handoff and exposes retry after failure', async () => {
    const benton = hostedBentonStatus();
    const spokane = {
      ...benton,
      county: 'Spokane',
      countyCode: '063',
      staticRoutes: {
        detail: '/launch-data/washington/counties/063.json',
        salesShard: '/launch-data/washington/sales/by-county/063.json',
      },
    };
    washingtonCountyLaunchMocks.resolve
      .mockResolvedValueOnce({
        counties: [],
        packageSource: 'repository-reference',
        usedRepositoryFallback: true,
      })
      .mockResolvedValueOnce({
        counties: [spokane],
        packageSource: 'hosted',
        usedRepositoryFallback: false,
      });

    render(
      <SalesForge
        metadata={{
          countyCode: '063',
          countyName: 'Spokane',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: null,
          latestReferenceSaleDate: null,
          salesReviewAvailability: 'verifying',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    expect(
      await screen.findByText(/No authenticated hosted sales package is currently available/i)
    ).toBeInTheDocument();
    expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    expect(screen.getByTestId('salesforge-retry-hosted-verification')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('salesforge-retry-hosted-verification'));

    await waitFor(() => {
      expect(useSalesForgeStore.getState().dataSource).toBe('washington-hosted');
      expect(screen.getByTestId('stub-queue')).toBeInTheDocument();
    });
    expect(washingtonCountyLaunchMocks.resolve).toHaveBeenCalledTimes(2);
    expect(washingtonCountyLaunchMocks.verify).toHaveBeenCalledWith(
      expect.objectContaining({ countyCode: '063' }),
      expect.anything()
    );
  });

  it('keeps county context but blocks a synthetic reference demo from assessor workflows', async () => {
    render(
      <SalesForge
        metadata={{
          countyCode: '063',
          countyName: 'Spokane',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'repository_reference_demo',
          referenceRecordCount: 3,
          latestReferenceSaleDate: '2025-11-06',
          salesReviewAvailability: 'unavailable',
          salesReviewUnavailableMessage:
            'Only invented repository reference records are available for this county.',
        }}
      />
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('063');
      expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    });
    expect(washingtonCountyLaunchMocks.resolve).not.toHaveBeenCalled();
    expect(washingtonCountyLaunchMocks.verify).not.toHaveBeenCalled();
    expect(screen.getByText(/Only invented repository reference records/i)).toBeInTheDocument();
    expect(screen.getByTestId('salesforge-data-unavailable')).toHaveTextContent(
      /No sales-review records or data-dependent tools/i
    );
    expect(screen.queryByTestId('stub-queue')).not.toBeInTheDocument();
  });

  it('keeps a validated county-upload handoff on the protected live provider', async () => {
    window.history.replaceState({}, '', '/?wa-launch-data=1');

    render(
      <SalesForge
        metadata={{
          countyCode: '005',
          countyName: 'Benton',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'county-provided-validated-upload',
          referencePackageSource: 'county-upload',
          referenceDataPosture: 'county_provided_validated_upload',
          referenceRecordCount: 1,
          latestReferenceSaleDate: '2026-01-15',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('005');
      expect(useSalesForgeStore.getState().dataSource).toBe('county-upload');
    });
    expect(washingtonCountyLaunchMocks.resolve).not.toHaveBeenCalled();
    expect(washingtonCountyLaunchMocks.verify).not.toHaveBeenCalled();
    expect(screen.getByTestId('stub-queue')).toBeInTheDocument();
  });

  it('fails closed instead of retaining Benton when a Counties Hub handoff is invalid', async () => {
    render(
      <SalesForge
        metadata={{
          countyCode: '063',
          countyName: 'Adams',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: 12,
          latestReferenceSaleDate: '2025-12-31',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        }}
      />
    );

    await waitFor(() => {
      expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('');
    });
    expect(screen.getByText('County scope required')).toBeInTheDocument();
    expect(screen.getByText(/Counties Hub county handoff is invalid/i)).toBeInTheDocument();
    expect(screen.getByTestId('salesforge-data-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-queue')).not.toBeInTheDocument();
  });

  it('consumes pre-split metadata (stratumKey / taxYear / segmentId) on mount', async () => {
    render(
      <SalesForge
        metadata={{
          deeplinkQuery: '?stratum=R1&year=2025&segmentId=seg-42',
          stratumKey: 'R1',
          taxYear: 2025,
          segmentId: 'seg-42',
          segmentLabel: 'Kennewick R1',
        }}
      />
    );
    const s = useSalesForgeStore.getState();
    // Stratum selection drives AI AUDIT landing tab.
    expect(s.selectedStratumKey).toBe('R1');
    expect(s.activeTab).toBe('ai-audit');
    // Year filter swapped.
    expect(s.taxYear).toBe(2025);
    // Segment context drives Scoped From chip.
    expect(s.contextSegmentId).toBe('seg-42');
    expect(s.contextSegmentLabel).toBe('Kennewick R1');

    const chip = screen.getByTestId('sf-scoped-from-chip');
    expect(chip).toHaveAttribute('data-segment-id', 'seg-42');
    expect(chip.textContent).toMatch(/Kennewick R1/);

    // AI AUDIT panel is lazy + Suspense — wait for the resolve.
    const aiAudit = await screen.findByTestId('stub-ai-audit');
    expect(aiAudit.getAttribute('data-year')).toBe('2025');
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    render(<SalesForge metadata={{ deeplinkQuery: '?stratum=C2&year=2024&segmentId=seg-7' }} />);
    const s = useSalesForgeStore.getState();
    expect(s.selectedStratumKey).toBe('C2');
    expect(s.taxYear).toBe(2024);
    expect(s.contextSegmentId).toBe('seg-7');
    // Label is unknown, chip still renders using the segmentId.
    const chip = screen.getByTestId('sf-scoped-from-chip');
    expect(chip.textContent).toMatch(/seg-7/);
  });

  it('applies neighborhood rollup scope to county and hood filters', async () => {
    render(
      <SalesForge
        metadata={{
          countyName: 'Benton County',
          taxYear: 2026,
          rollupScope: 'neighborhood',
          neighborhoodCode: 'NBHD-WR01',
          neighborhoodName: 'West Richland Estates',
        }}
      />
    );

    await waitFor(() => {
      const s = useSalesForgeStore.getState();
      expect(s.committedFilters.countyCode).toBe('005');
      expect(s.committedFilters.hood).toBe('NBHD-WR01');
      expect(s.activeTab).toBe('neighborhoods');
    });

    expect(screen.getAllByText(/West Richland Estates/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/counties track reval area and neighborhood before parcel-level action/i)
    ).toBeInTheDocument();
  });

  it('resets prior valuation scope when the Counties Hub selects a different county', async () => {
    const spokane = {
      ...hostedBentonStatus(),
      county: 'Spokane',
      countyCode: '063',
      staticRoutes: {
        detail: '/launch-data/washington/counties/063.json',
        salesShard: '/launch-data/washington/sales/by-county/063.json',
      },
    };
    washingtonCountyLaunchMocks.resolve.mockResolvedValue({
      counties: [spokane],
      packageSource: 'hosted',
      usedRepositoryFallback: false,
    });
    act(() => {
      const s = useSalesForgeStore.getState();
      s.applyCountyStudioScope('005', 'OLD-BENTON-HOOD');
      s.setSelectedStratumKey('R1');
      s.setContextSegment('old-benton-segment', 'Old Benton segment');
      s.setActiveTab('ai-audit');
      s.setTaxYear(2022);
    });

    render(
      <SalesForge
        metadata={{
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
          // Even a conflicting mixed payload must not retain valuation scope
          // when the reset contract is present.
          rollupScope: 'neighborhood',
          neighborhoodCode: 'OLD-BENTON-HOOD',
          neighborhoodName: 'Old Benton neighborhood',
          stratumKey: 'R1',
          segmentId: 'old-benton-segment',
          segmentLabel: 'Old Benton segment',
          taxYear: null,
        }}
      />
    );

    await waitFor(() => {
      const s = useSalesForgeStore.getState();
      expect(s.committedFilters.countyCode).toBe('063');
      expect(s.committedFilters.hood).toBeNull();
      expect(s.filterForm.hood).toBe('');
      expect(s.selectedStratumKey).toBeNull();
      expect(s.contextSegmentId).toBeNull();
      expect(s.contextSegmentLabel).toBeNull();
      expect(s.activeTab).toBe('queue');
      expect(s.taxYear).toBe(SALESFORGE_TAX_YEAR);
      expect(s.dataSource).toBe('washington-hosted');
    });

    expect(screen.getByText('Spokane County')).toBeInTheDocument();
    expect(screen.getByText(/Public\/reference package only/i)).toBeInTheDocument();
    expect(screen.queryByText(/invented synthetic sales/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'DOR Export' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('sf-scoped-from-chip')).not.toBeInTheDocument();
    expect(screen.queryByText(/Old Benton neighborhood/)).not.toBeInTheDocument();
  });

  it('keeps city overview handoffs honest and county-scoped', async () => {
    render(
      <SalesForge
        metadata={{
          countyName: 'Benton County',
          taxYear: 2026,
          rollupScope: 'city',
          city: 'Kennewick',
        }}
      />
    );

    await waitFor(() => {
      const s = useSalesForgeStore.getState();
      expect(s.committedFilters.countyCode).toBe('005');
      expect(s.committedFilters.hood).toBeNull();
      expect(s.activeTab).toBe('queue');
    });

    expect(screen.getAllByText(/city overview/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/city scope remains triage-only until you narrow below the city rollup/i)
    ).toBeInTheDocument();
  });

  it('Scoped From chip click fires activateModule("county-studio") with segmentId', () => {
    render(<SalesForge metadata={{ stratumKey: 'R1', taxYear: 2026, segmentId: 'seg-back' }} />);
    const chip = screen.getByTestId('sf-scoped-from-chip');
    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      })
    );
  });
});
