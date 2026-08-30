/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  WashingtonCountyStatusEntry,
  WashingtonCountyStatusResolution,
} from '../../services/washingtonCountyLaunch';

const {
  activateModuleMock,
  resolveWashingtonCountyStatusMock,
  verifyWashingtonCountySalesShardMock,
  getWashingtonSalesReviewCapabilityMock,
  isWashingtonSalesReviewLaunchEnabledMock,
} = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  resolveWashingtonCountyStatusMock: vi.fn(),
  verifyWashingtonCountySalesShardMock: vi.fn(),
  getWashingtonSalesReviewCapabilityMock: vi.fn(),
  isWashingtonSalesReviewLaunchEnabledMock: vi.fn(),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  default: activateModuleMock,
}));

vi.mock('../../services/washingtonCountyLaunch', () => ({
  resolveWashingtonCountyStatus: resolveWashingtonCountyStatusMock,
  verifyWashingtonCountySalesShard: verifyWashingtonCountySalesShardMock,
}));

vi.mock('../../pages/forge/sales/washingtonSalesReviewCapability', () => ({
  getWashingtonSalesReviewCapability: getWashingtonSalesReviewCapabilityMock,
  isWashingtonSalesReviewLaunchEnabled: isWashingtonSalesReviewLaunchEnabledMock,
}));

import CountiesHub from '../../components/CountiesHub';

function countyStatus(
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
    salesShardVerification: 'verified',
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

function countyStatusResolution(
  counties: WashingtonCountyStatusEntry[],
  packageSource: WashingtonCountyStatusResolution['packageSource'] = 'hosted',
  usedRepositoryFallback = packageSource === 'repository-reference',
): WashingtonCountyStatusResolution {
  return { counties, packageSource, usedRepositoryFallback };
}

describe('Washington Counties Hub assessor journey', () => {
  beforeEach(() => {
    activateModuleMock.mockReset().mockResolvedValue(undefined);
    resolveWashingtonCountyStatusMock.mockReset().mockResolvedValue(
      countyStatusResolution([countyStatus()]),
    );
    verifyWashingtonCountySalesShardMock.mockReset().mockImplementation(
      async (status: WashingtonCountyStatusEntry) => status,
    );
    getWashingtonSalesReviewCapabilityMock.mockReset().mockReturnValue({
      eligible: true,
      status: 'available',
      statusLabel: 'Sales review available',
      unavailableMessage: null,
      referenceData: {
        posture: 'public_recorder_export',
        isSyntheticReference: false,
        observed: {
          recordCount: 12,
          latestSaleDate: '2025-12-31',
          needsReview: 4,
          runtimePosture: 'reference_ready',
          sourceStatus: 'observed',
          sourceDriftDetected: false,
        },
      },
    });
    isWashingtonSalesReviewLaunchEnabledMock.mockReset().mockReturnValue(true);
  });

  it('selects an observed county and opens the TerraForge suite with an exact county-only handoff', async () => {
    render(<CountiesHub />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading governed Washington county status',
    );

    const spokaneOption = await screen.findByRole('option', {
      name: 'Select Spokane County',
    });
    expect(screen.getAllByRole('option')).toHaveLength(39);
    expect(screen.getByRole('option', { name: 'Select Adams County' })).toBeInTheDocument();
    expect(isWashingtonSalesReviewLaunchEnabledMock).toHaveBeenCalledWith({
      explicitReferenceHandoff: true,
    });
    expect(resolveWashingtonCountyStatusMock).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(screen.queryByText(/invented synthetic sales/i)).not.toBeInTheDocument();
    expect(spokaneOption).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByTestId('selected-county-context')).not.toBeInTheDocument();

    fireEvent.click(spokaneOption);

    expect(spokaneOption).toHaveAttribute('aria-selected', 'true');
    expect(getWashingtonSalesReviewCapabilityMock).toHaveBeenCalledWith(
      expect.objectContaining({ county: 'Spokane', countyCode: '063' }),
    );
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent(
      'Selected navigation context',
    );
    expect(screen.getByText(/navigation context only/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Open TerraForge' }),
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('suite-forge', {
        source: 'system',
        metadata: {
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
        },
      });
    });
  });

  it('validates only the selected hosted county and hands off shard-derived claims', async () => {
    const unverifiedStatus = countyStatus({
      stagedSales: 99,
      needsReview: 98,
      latestSaleDate: '2099-12-31',
      salesShardVerification: 'unverified',
    });
    const verifiedStatus: WashingtonCountyStatusEntry = {
      ...unverifiedStatus,
      stagedSales: 3,
      needsReview: 2,
      latestSaleDate: '2025-11-06',
      salesShardVerification: 'verified',
    };
    resolveWashingtonCountyStatusMock.mockResolvedValue(
      countyStatusResolution([unverifiedStatus]),
    );
    verifyWashingtonCountySalesShardMock.mockResolvedValue(verifiedStatus);
    getWashingtonSalesReviewCapabilityMock.mockImplementation(
      (status: WashingtonCountyStatusEntry) => status.salesShardVerification === 'unverified'
        ? {
            eligible: false,
            status: 'sales-shard-verification-required',
            statusLabel: 'Verification required',
            unavailableMessage: 'The selected county package must be verified.',
            referenceData: {
              posture: 'public_recorder_export',
              isSyntheticReference: false,
              observed: null,
            },
          }
        : {
            eligible: true,
            status: 'available',
            statusLabel: 'Sales review available',
            unavailableMessage: null,
            referenceData: {
              posture: 'public_recorder_export',
              isSyntheticReference: false,
              observed: {
                recordCount: status.stagedSales,
                latestSaleDate: status.latestSaleDate,
                needsReview: status.needsReview,
                runtimePosture: status.prometheusStatus,
                sourceStatus: status.confidence.rawStatus,
                sourceDriftDetected: status.confidence.rawDriftDetected,
              },
            },
          },
    );

    render(<CountiesHub />);
    const spokaneOption = await screen.findByRole('option', {
      name: 'Select Spokane County',
    });
    expect(verifyWashingtonCountySalesShardMock).not.toHaveBeenCalled();

    fireEvent.click(spokaneOption);

    await waitFor(() => {
      expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledWith(
        expect.objectContaining({
          countyCode: '063',
          salesShardVerification: 'unverified',
        }),
        expect.any(AbortSignal),
      );
    });
    const selectedContext = screen.getByTestId('selected-county-context');
    await waitFor(() => {
      expect(selectedContext).toHaveTextContent('3');
      expect(selectedContext).toHaveTextContent('2025-11-06');
      expect(selectedContext).not.toHaveTextContent('2099-12-31');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open TerraForge' }));
    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '063',
            referenceRecordCount: 3,
            latestReferenceSaleDate: '2025-11-06',
            salesReviewAvailability: 'available',
          }),
        }),
      );
    });
  });

  it('hands pending verification to TerraForge without collapsing it into unavailable', async () => {
    const unverifiedStatus = countyStatus({
      salesShardVerification: 'unverified',
    });
    resolveWashingtonCountyStatusMock.mockResolvedValue(
      countyStatusResolution([unverifiedStatus]),
    );
    verifyWashingtonCountySalesShardMock.mockReturnValue(
      new Promise<WashingtonCountyStatusEntry>(() => undefined),
    );
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'sales-shard-verification-required',
      statusLabel: 'Verification required',
      unavailableMessage: 'The selected county package must be verified.',
      referenceData: {
        posture: 'public_recorder_export',
        isSyntheticReference: false,
        observed: null,
      },
    });

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    await waitFor(() => {
      expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledWith(
        expect.objectContaining({ countyCode: '063' }),
        expect.any(AbortSignal),
      );
    });
    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    fireEvent.click(openTerraForge);

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '063',
            salesReviewAvailability: 'verifying',
            salesReviewUnavailableMessage: null,
          }),
        }),
      );
    });
  });

  it('retries selected-county sales verification after a transient failure', async () => {
    const unverifiedStatus = countyStatus({
      salesShardVerification: 'unverified',
    });
    const unavailableStatus: WashingtonCountyStatusEntry = {
      ...unverifiedStatus,
      salesShardVerification: 'unavailable',
    };
    const verifiedStatus: WashingtonCountyStatusEntry = {
      ...unverifiedStatus,
      stagedSales: 3,
      needsReview: 2,
      latestSaleDate: '2025-11-06',
      salesShardVerification: 'verified',
    };
    resolveWashingtonCountyStatusMock.mockResolvedValue(
      countyStatusResolution([unverifiedStatus]),
    );
    verifyWashingtonCountySalesShardMock
      .mockResolvedValueOnce(unavailableStatus)
      .mockResolvedValueOnce(verifiedStatus);
    getWashingtonSalesReviewCapabilityMock.mockImplementation(
      (status: WashingtonCountyStatusEntry) => {
        const verified = status.salesShardVerification === 'verified';
        const unavailable = status.salesShardVerification === 'unavailable';
        return {
          eligible: verified,
          status: verified
            ? 'available'
            : unavailable
              ? 'sales-shard-unavailable'
              : 'sales-shard-verification-required',
          statusLabel: verified
            ? 'Sales review available'
            : unavailable
              ? 'Source gap'
              : 'Verification required',
          unavailableMessage: verified
            ? null
            : unavailable
              ? 'The selected county sales package is temporarily unavailable.'
              : 'The selected county package must be verified.',
          referenceData: {
            posture: 'public_recorder_export',
            isSyntheticReference: false,
            observed: verified
              ? {
                  recordCount: status.stagedSales,
                  latestSaleDate: status.latestSaleDate,
                  needsReview: status.needsReview,
                  runtimePosture: status.prometheusStatus,
                  sourceStatus: status.confidence.rawStatus,
                  sourceDriftDetected: status.confidence.rawDriftDetected,
                }
              : null,
          },
        };
      },
    );

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    const retrySalesData = await screen.findByRole('button', {
      name: 'Retry sales data',
    });
    expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(1);
    fireEvent.click(retrySalesData);

    await waitFor(() => {
      expect(verifyWashingtonCountySalesShardMock).toHaveBeenCalledTimes(2);
      expect(verifyWashingtonCountySalesShardMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          countyCode: '063',
          salesShardVerification: 'unverified',
        }),
        expect.any(AbortSignal),
      );
    });
    await waitFor(() => {
      const selectedContext = screen.getByTestId('selected-county-context');
      expect(selectedContext).toHaveTextContent('2025-11-06');
      expect(screen.queryByRole('button', { name: 'Retry sales data' })).not.toBeInTheDocument();
    });
  });

  it('opens TerraForge context for any of 39 counties while marking missing sales data unavailable', async () => {
    render(<CountiesHub />);

    await screen.findByRole('option', { name: 'Select Spokane County' });
    fireEvent.click(screen.getByRole('option', { name: 'Select Spokane County' }));
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent('12');

    const adamsOption = screen.getByRole('option', { name: 'Select Adams County' });

    fireEvent.click(adamsOption);

    expect(adamsOption).toHaveAttribute('aria-selected', 'true');
    const selectedContext = screen.getByTestId('selected-county-context');
    expect(selectedContext).toHaveTextContent('Adams County');
    expect(within(selectedContext).getAllByText('Unavailable')).toHaveLength(4);
    expect(screen.getByText(/No governed public sales state is available for Adams/i))
      .toHaveTextContent(/TerraForge still opens.*unavailable instead of borrowing/i);
    expect(selectedContext).toHaveTextContent(/Parcel transfer history/i);
    expect(selectedContext).toHaveTextContent(/Source path researched/i);
    const officialSourceLink = within(selectedContext).getByRole('link', {
      name: /Open official Adams County public assessor source in a new tab/i,
    });
    expect(officialSourceLink).toHaveAttribute('href', 'https://co.adams.wa.us');
    expect(officialSourceLink).toHaveAttribute('target', '_blank');
    expect(officialSourceLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(selectedContext).toHaveTextContent(/does not prove statewide ingestion/i);
    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    fireEvent.click(openTerraForge);

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('suite-forge', {
        source: 'system',
        metadata: expect.objectContaining({
          countyCode: '001',
          countyName: 'Adams',
          referenceDataPosture: 'unavailable',
          referenceRecordCount: null,
          latestReferenceSaleDate: null,
          salesReviewAvailability: 'unavailable',
          salesReviewUnavailableMessage: expect.stringMatching(
            /No governed public sales state is available for Adams County/i,
          ),
        }),
      });
    });
    expect(getWashingtonSalesReviewCapabilityMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ county: 'Adams' }),
    );
  });

  it('falls back to repository navigation without exposing synthetic records as public data', async () => {
    resolveWashingtonCountyStatusMock.mockResolvedValue(countyStatusResolution([
      countyStatus({
        primarySourceMode: ' Repository_Reference_Demo ',
        prometheusStatus: 'reference_demo',
        latestSaleDate: '2025-11-06',
        candidateSales: 3,
        stagedSales: 3,
        needsReview: 2,
        confidence: {
          averageQualityScore: 0.85,
          parserStatus: 'repository_fixture',
          rawStatus: 'synthetic_reference',
          rawDriftDetected: false,
        },
      }),
    ], 'repository-reference'));
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'reference-demo-only',
      statusLabel: 'Reference demo only',
      unavailableMessage: 'Only invented repository reference records are available.',
      referenceData: {
        posture: 'repository_reference_demo',
        isSyntheticReference: true,
        observed: null,
      },
    });

    render(<CountiesHub />);

    const spokaneOption = await screen.findByRole('option', {
      name: 'Select Spokane County',
    });
    expect(spokaneOption).toBeInTheDocument();
    expect(resolveWashingtonCountyStatusMock).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(screen.getByText(/valid same-origin Washington public sales package was not available/i))
      .toHaveTextContent(/invented interface fixtures remain suppressed/i);
    expect(screen.getByText('0 with verified observed status')).toBeInTheDocument();

    fireEvent.click(spokaneOption);
    const selectedContext = screen.getByTestId('selected-county-context');
    expect(within(selectedContext).getAllByText('Unavailable')).toHaveLength(4);
    expect(selectedContext).not.toHaveTextContent('2025-11-06');
    fireEvent.click(
      screen.getByRole('button', { name: 'Open TerraForge' }),
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('suite-forge', {
        source: 'system',
        metadata: {
          countyCode: '063',
          countyName: 'Spokane',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'repository-reference',
          referenceDataPosture: 'repository_reference_demo',
          referenceRecordCount: null,
          latestReferenceSaleDate: null,
          salesReviewAvailability: 'unavailable',
          salesReviewUnavailableMessage: 'Only invented repository reference records are available.',
        },
      });
    });
  });

  it('opens TerraForge but keeps SalesForge unavailable when the county has no governed sales shard', async () => {
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'sales-shard-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed TerraForge sales package is unavailable for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
      referenceData: {
        posture: 'public_recorder_export',
        isSyntheticReference: false,
        observed: null,
      },
    });
    resolveWashingtonCountyStatusMock.mockResolvedValue(countyStatusResolution([
      countyStatus({
        county: 'Adams',
        countyCode: '001',
        latestSaleDate: null,
        stagedSales: 0,
        needsReview: 0,
        staticRoutes: {
          detail: '/launch-data/washington/counties/001.json',
          salesShard: '',
        },
      }),
    ]));

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Adams County' }));

    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    expect(screen.getByText(/TerraForge sales package is unavailable/i)).toBeInTheDocument();
    fireEvent.click(openTerraForge);

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '001',
            salesReviewAvailability: 'unavailable',
            salesReviewUnavailableMessage: expect.stringMatching(
              /TerraForge sales package is unavailable/i,
            ),
          }),
        }),
      );
    });
  });

  it('rejects a mismatched observed county name and code instead of guessing scope', async () => {
    resolveWashingtonCountyStatusMock.mockResolvedValue(countyStatusResolution([
      countyStatus({ county: 'Adams', countyCode: '063' }),
    ]));

    render(<CountiesHub />);
    const spokaneOption = await screen.findByRole('option', { name: 'Select Spokane County' });
    fireEvent.click(spokaneOption);

    const selectedContext = screen.getByTestId('selected-county-context');
    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    expect(screen.getByText(/name and code do not match/i)).toBeInTheDocument();
    expect(screen.getByText(/record counts, freshness, and runtime posture are suppressed/i))
      .toBeInTheDocument();
    expect(screen.getByTestId('county-registry-integrity-error'))
      .toHaveTextContent(/Adams \(063\)/i);
    expect(within(spokaneOption).getByText('Registry mismatch')).toBeInTheDocument();
    expect(screen.getByText('0 with verified observed status')).toBeInTheDocument();
    expect(within(selectedContext).getAllByText('Unavailable')).toHaveLength(4);
    expect(selectedContext).not.toHaveTextContent('2025-12-31');
    expect(selectedContext).not.toHaveTextContent('12');
    expect(getWashingtonSalesReviewCapabilityMock).not.toHaveBeenCalled();
    fireEvent.click(openTerraForge);
    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '063',
            salesReviewAvailability: 'unavailable',
            salesReviewUnavailableMessage: expect.stringMatching(/registry mismatch/i),
          }),
        }),
      );
    });
  });

  it('surfaces an unregistered county code by its unique canonical county name', async () => {
    resolveWashingtonCountyStatusMock.mockResolvedValue(countyStatusResolution([
      countyStatus({ county: 'Spokane', countyCode: '999' }),
    ]));

    render(<CountiesHub />);
    const spokaneOption = await screen.findByRole('option', { name: 'Select Spokane County' });
    fireEvent.click(spokaneOption);

    const selectedContext = screen.getByTestId('selected-county-context');
    expect(screen.getByTestId('county-registry-integrity-error'))
      .toHaveTextContent(/Spokane \(999\)/i);
    expect(within(spokaneOption).getByText('Registry mismatch')).toBeInTheDocument();
    expect(screen.getByText(/reported Spokane County with code 999 for canonical Spokane County/i))
      .toBeInTheDocument();
    expect(screen.getByText('0 with verified observed status')).toBeInTheDocument();
    expect(within(selectedContext).getAllByText('Unavailable')).toHaveLength(4);
    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    expect(getWashingtonSalesReviewCapabilityMock).not.toHaveBeenCalled();
    fireEvent.click(openTerraForge);
    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '063',
            salesReviewAvailability: 'unavailable',
          }),
        }),
      );
    });
  });

  it('keeps county entry available when the public sales package is disabled', async () => {
    isWashingtonSalesReviewLaunchEnabledMock.mockReturnValue(false);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    expect(screen.getByText(/public sales package is not enabled/i)).toHaveTextContent(
      /TerraForge still opens.*unavailable/i,
    );
    fireEvent.click(openTerraForge);
    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '063',
            salesReviewAvailability: 'unavailable',
            salesReviewUnavailableMessage: expect.stringMatching(/not enabled/i),
          }),
        }),
      );
    });
  });

  it('shows an honest feed failure and recovers through Retry without a fallback county', async () => {
    resolveWashingtonCountyStatusMock
      .mockRejectedValueOnce(new Error('Observed county feed is offline.'))
      .mockResolvedValueOnce(countyStatusResolution([countyStatus()]));

    render(<CountiesHub />);

    expect(await screen.findByText(/Observed county feed is offline/i)).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(39);
    const adamsOption = screen.getByRole('option', { name: 'Select Adams County' });
    fireEvent.click(adamsOption);
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent('Adams County');
    expect(
      screen.getByRole('button', { name: 'Open TerraForge' }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('option', { name: 'Select Spokane County' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Select Adams County' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent('Adams County');
    expect(activateModuleMock).not.toHaveBeenCalled();
    expect(resolveWashingtonCountyStatusMock).toHaveBeenCalledTimes(2);
  });
});
