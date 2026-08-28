/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WashingtonCountyStatusEntry } from '../../services/washingtonCountyLaunch';

const {
  activateModuleMock,
  fetchWashingtonCountyStatusMock,
  isWashingtonLaunchDataEnabledMock,
} = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  fetchWashingtonCountyStatusMock: vi.fn(),
  isWashingtonLaunchDataEnabledMock: vi.fn(),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  default: activateModuleMock,
}));

vi.mock('../../services/washingtonCountyLaunch', () => ({
  fetchWashingtonCountyStatus: fetchWashingtonCountyStatusMock,
}));

vi.mock('../../pages/forge/sales/washingtonLaunchApi', () => ({
  isWashingtonLaunchDataEnabled: isWashingtonLaunchDataEnabledMock,
  WASHINGTON_COUNTIES: [
    { code: '001', name: 'Adams' },
    { code: '063', name: 'Spokane' },
  ],
}));

import CountiesHub from '../../components/CountiesHub';

function countyStatus(
  overrides: Partial<WashingtonCountyStatusEntry> = {},
): WashingtonCountyStatusEntry {
  return {
    county: 'Spokane',
    countyCode: '063',
    priority: 'statewide',
    prometheusStatus: 'reference_ready',
    primarySourceMode: 'public_launch_package',
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
      salesShard: '/launch-data/washington/sales/063.json',
    },
    ...overrides,
  };
}

describe('Washington Counties Hub assessor journey', () => {
  beforeEach(() => {
    activateModuleMock.mockReset().mockResolvedValue(undefined);
    fetchWashingtonCountyStatusMock.mockReset().mockResolvedValue([countyStatus()]);
    isWashingtonLaunchDataEnabledMock.mockReset().mockReturnValue(true);
  });

  it('selects an observed county and opens TerraForge with an exact county-only handoff', async () => {
    render(<CountiesHub />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading governed Washington county status',
    );

    const spokaneOption = await screen.findByRole('option', {
      name: 'Select Spokane County',
    });
    expect(spokaneOption).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByTestId('selected-county-context')).not.toBeInTheDocument();

    fireEvent.click(spokaneOption);

    expect(spokaneOption).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent(
      'Selected navigation context',
    );
    expect(screen.getByText(/navigation context only/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Review public sales in TerraForge' }),
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
        },
      });
    });
  });

  it('keeps TerraForge disabled when the selected county has no governed sales shard', async () => {
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
      screen.getByRole('button', { name: 'Review public sales in TerraForge' }),
    ).toBeDisabled();
    expect(screen.getByText(/No governed staged sales are available/i)).toBeInTheDocument();
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched observed county name and code instead of guessing scope', async () => {
    fetchWashingtonCountyStatusMock.mockResolvedValue([
      countyStatus({ county: 'Adams', countyCode: '063' }),
    ]);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Adams County' }));

    expect(
      screen.getByRole('button', { name: 'Review public sales in TerraForge' }),
    ).toBeDisabled();
    expect(screen.getByText(/name and code do not match/i)).toBeInTheDocument();
    expect(screen.getByText('Registry mismatch')).toBeInTheDocument();
    expect(activateModuleMock).not.toHaveBeenCalled();
  });

  it('keeps the launch disabled outside the hosted public-package mode', async () => {
    isWashingtonLaunchDataEnabledMock.mockReturnValue(false);

    render(<CountiesHub />);
    fireEvent.click(await screen.findByRole('option', { name: 'Select Spokane County' }));

    expect(
      screen.getByRole('button', { name: 'Review public sales in TerraForge' }),
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
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.queryByTestId('selected-county-context')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('option', { name: 'Select Spokane County' }),
    ).toBeInTheDocument();
    expect(fetchWashingtonCountyStatusMock).toHaveBeenCalledTimes(2);
  });
});
