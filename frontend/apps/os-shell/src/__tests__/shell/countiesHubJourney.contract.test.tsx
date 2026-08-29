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
    primarySourceMode: 'repository_reference_demo',
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

  it('selects an observed county and opens TerraForge with an exact county-only handoff', async () => {
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
    expect(screen.getByText(/invented synthetic sales/i)).toHaveTextContent(
      /not observed public sales.*not county records/i,
    );
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
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', {
        source: 'system',
        metadata: {
          countyCode: '063',
          countyName: 'Spokane',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'repository-reference',
          referenceDataPosture: 'repository_reference_demo',
        },
      });
    });
  });

  it('keeps all 39 counties selectable and marks missing public data unavailable', async () => {
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
      .toHaveTextContent(/unavailable instead of borrowing another county's data/i);
    expect(
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    ).toBeDisabled();
    expect(getWashingtonSalesReviewCapabilityMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ county: 'Adams' }),
    );
    expect(activateModuleMock).not.toHaveBeenCalled();
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
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    );

    await waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledWith('sales-forge', {
        source: 'system',
        metadata: {
          countyCode: '063',
          countyName: 'Spokane',
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
          referencePackageSource: 'hosted',
          referenceDataPosture: 'public_recorder_export',
        },
      });
    });
  });

  it('keeps TerraForge disabled when the selected county has no governed sales shard', async () => {
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
      unavailableMessage:
        'No governed staged sales are available for this county. '
        + 'TerraForge remains disabled instead of falling back to another county.',
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

    expect(
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    ).toBeDisabled();
    expect(screen.getByText(/No governed staged sales are available/i)).toBeInTheDocument();
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched observed county name and code instead of guessing scope', async () => {
    getWashingtonSalesReviewCapabilityMock.mockReturnValue({
      eligible: false,
      status: 'county-context-invalid',
      statusLabel: 'Registry mismatch',
      unavailableMessage:
        'The observed county name and code do not match the Washington registry. '
        + 'TerraForge remains disabled instead of guessing a county context.',
    });
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({ county: 'Adams', countyCode: '063' }),
    ]);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    expect(
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    ).toBeDisabled();
    expect(screen.getByText(/name and code do not match/i)).toBeInTheDocument();
    expect(screen.getByText('Registry mismatch')).toBeInTheDocument();
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('keeps the launch disabled outside the hosted public-package mode', async () => {
    isWashingtonSalesReviewLaunchEnabledMock.mockReturnValue(false);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    expect(
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    ).toBeDisabled();
    expect(screen.getByText(/public launch package is not enabled/i)).toBeInTheDocument();
    expect(activateModuleMock).not.toHaveBeenCalled();
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
      screen.getByRole('button', { name: 'Open TerraForge sales review' }),
    ).toBeDisabled();

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
