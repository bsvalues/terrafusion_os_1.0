/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WashingtonCountyStatusEntry } from '../../services/washingtonCountyLaunch';

const {
  activateModuleMock,
  fetchWashingtonCountyStatusMock,
  getWashingtonSalesReviewCapabilityMock,
  isWashingtonLaunchDataEnabledMock,
  isWashingtonSalesReviewLaunchEnabledMock,
} = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  fetchWashingtonCountyStatusMock: vi.fn(),
  getWashingtonSalesReviewCapabilityMock: vi.fn(),
  isWashingtonLaunchDataEnabledMock: vi.fn(),
  isWashingtonSalesReviewLaunchEnabledMock: vi.fn(),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  default: activateModuleMock,
}));

vi.mock('../../services/washingtonCountyLaunch', () => ({
  fetchWashingtonCountyStatus: fetchWashingtonCountyStatusMock,
}));

vi.mock('../../pages/forge/sales/washingtonSalesReviewCapability', () => ({
  getWashingtonSalesReviewCapability: getWashingtonSalesReviewCapabilityMock,
  isWashingtonSalesReviewLaunchEnabled: isWashingtonSalesReviewLaunchEnabledMock,
}));

vi.mock('../../pages/forge/sales/washingtonLaunchApi', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../../pages/forge/sales/washingtonLaunchApi')
  >();
  return {
    ...actual,
    isWashingtonLaunchDataEnabled: isWashingtonLaunchDataEnabledMock,
  };
});

import CountiesHub from '../../components/CountiesHub';

function countyStatus(
  overrides: Partial<WashingtonCountyStatusEntry> = {},
): WashingtonCountyStatusEntry {
  return {
    county: 'Spokane',
    countyCode: '063',
    priority: 'statewide',
    prometheusStatus: 'reference_ready',
    primarySourceMode: 'public_recorder_export',
    latestSaleDate: '2025-12-31',
    candidateSales: 18,
    stagedSales: 12,
    needsReview: 4,
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

describe('Washington Counties Hub assessor journey', () => {
  beforeEach(() => {
    activateModuleMock.mockReset().mockResolvedValue(undefined);
    fetchWashingtonCountyStatusMock.mockReset().mockResolvedValue([countyStatus()]);
    getWashingtonSalesReviewCapabilityMock.mockReset().mockReturnValue({
      eligible: true,
      status: 'available',
      statusLabel: 'Sales review available',
      unavailableMessage: null,
    });
    isWashingtonLaunchDataEnabledMock.mockReset().mockReturnValue(false);
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
    expect(fetchWashingtonCountyStatusMock).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      'repository-reference',
    );
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
          referencePackageSource: 'repository-reference',
          referenceDataPosture: 'public_recorder_export',
          referenceRecordCount: 12,
          latestReferenceSaleDate: '2025-12-31',
          salesReviewAvailability: 'available',
          salesReviewUnavailableMessage: null,
        },
      });
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

  it('preserves the hosted county feed when hosted launch mode is active', async () => {
    isWashingtonLaunchDataEnabledMock.mockReturnValue(true);
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({
        primarySourceMode: 'public_recorder_export',
      }),
    ]);

    render(<CountiesHub />);

    const spokaneOption = await screen.findByRole('option', {
      name: 'Select Spokane County',
    });
    expect(spokaneOption).toBeInTheDocument();
    expect(fetchWashingtonCountyStatusMock).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      'hosted',
    );
    expect(screen.queryByText(/invented synthetic sales/i)).not.toBeInTheDocument();

    fireEvent.click(spokaneOption);
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

  it('opens TerraForge but keeps SalesForge unavailable when the county has no governed sales shard', async () => {
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
      unavailableMessage:
        'No governed staged sales are available for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
    });
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({
        county: 'Adams',
        countyCode: '001',
        stagedSales: 0,
        staticRoutes: {
          detail: '/launch-data/washington/counties/001.json',
          salesShard: '',
        },
      }),
    ]);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Adams County' }));

    const openTerraForge = screen.getByRole('button', { name: 'Open TerraForge' });
    expect(openTerraForge).toBeEnabled();
    expect(screen.getByText(/No governed staged sales are available/i)).toBeInTheDocument();
    fireEvent.click(openTerraForge);

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith(
        'suite-forge',
        expect.objectContaining({
          metadata: expect.objectContaining({
            countyCode: '001',
            salesReviewAvailability: 'unavailable',
            salesReviewUnavailableMessage: expect.stringMatching(
              /No governed staged sales are available/i,
            ),
          }),
        }),
      );
    });
  });

  it('rejects a mismatched observed county name and code instead of guessing scope', async () => {
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({ county: 'Adams', countyCode: '063' }),
    ]);

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
    expect(screen.getByText('0 with governed status')).toBeInTheDocument();
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
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({ county: 'Spokane', countyCode: '999' }),
    ]);

    render(<CountiesHub />);
    const spokaneOption = await screen.findByRole('option', { name: 'Select Spokane County' });
    fireEvent.click(spokaneOption);

    const selectedContext = screen.getByTestId('selected-county-context');
    expect(screen.getByTestId('county-registry-integrity-error'))
      .toHaveTextContent(/Spokane \(999\)/i);
    expect(within(spokaneOption).getByText('Registry mismatch')).toBeInTheDocument();
    expect(screen.getByText(/reported Spokane County with code 999 for canonical Spokane County/i))
      .toBeInTheDocument();
    expect(screen.getByText('0 with governed status')).toBeInTheDocument();
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
    fetchWashingtonCountyStatusMock
      .mockRejectedValueOnce(new Error('Observed county feed is offline.'))
      .mockResolvedValueOnce([countyStatus()]);

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
    expect(fetchWashingtonCountyStatusMock).toHaveBeenCalledTimes(2);
  });
});
