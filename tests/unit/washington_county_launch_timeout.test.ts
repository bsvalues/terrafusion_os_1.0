import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const capabilityMocks = vi.hoisted(() => ({
  activateModule: vi.fn(),
  verifyHostedShard: vi.fn(),
}));

vi.mock('../../frontend/apps/os-shell/src/orchestration/moduleActivation', () => ({
  default: capabilityMocks.activateModule,
}));

vi.mock('@/pages/forge/sales/washingtonSalesReviewCapability', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('../../frontend/apps/os-shell/src/pages/forge/sales/washingtonSalesReviewCapability')
    >();
  return {
    ...actual,
    verifyWashingtonSalesReviewHostedShard: capabilityMocks.verifyHostedShard,
  };
});

import { WASHINGTON_COUNTIES } from '../../frontend/apps/os-shell/src/pages/forge/sales/washingtonLaunchApi';
import {
  resolveWashingtonCountyStatus,
  verifyWashingtonCountySalesShard,
  WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS,
} from '../../frontend/apps/os-shell/src/services/washingtonCountyLaunch';
import CountiesHub from '../../frontend/apps/os-shell/src/components/CountiesHub';

describe('Washington county launch request bounds', () => {
  const statusRequestSignals: AbortSignal[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    capabilityMocks.activateModule.mockReset().mockResolvedValue(undefined);
    capabilityMocks.verifyHostedShard.mockReset();
    statusRequestSignals.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: unknown, init?: RequestInit) => {
        if (init?.signal) statusRequestSignals.push(init.signal);
        return new Promise<Response>(() => {});
      })
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('abandons a stalled hosted registry and preserves the 39-county navigation fallback', async () => {
    const resolutionPromise = resolveWashingtonCountyStatus();

    await vi.advanceTimersByTimeAsync(WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);
    const resolution = await resolutionPromise;

    expect(statusRequestSignals).toHaveLength(1);
    expect(statusRequestSignals[0]?.aborted).toBe(true);
    expect(resolution).toMatchObject({
      packageSource: 'repository-reference',
      usedRepositoryFallback: true,
    });
    expect(resolution.counties).not.toHaveLength(0);
    expect(
      resolution.counties.every(county => county.salesShardVerification === 'not-required')
    ).toBe(true);
    expect(WASHINGTON_COUNTIES).toHaveLength(39);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('lets an assessor enter TerraForge after the hosted registry stalls', async () => {
    render(createElement(CountiesHub));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading governed Washington county status'
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(39);
    const adamsOption = screen.getByRole('option', { name: 'Select Adams County' });
    fireEvent.click(adamsOption);
    expect(adamsOption).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('selected-county-context')).toHaveTextContent('Adams County');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open TerraForge' }));
    });

    expect(capabilityMocks.activateModule).toHaveBeenCalledWith('suite-forge', {
      source: 'system',
      metadata: expect.objectContaining({
        countyCode: '001',
        countyName: 'Adams',
        resetValuationScope: true,
        launchContext: 'washington-counties-hub',
        dataTrustTier: 'public-reference-not-county-certified',
        referencePackageSource: 'repository-reference',
        referenceDataPosture: 'unavailable',
        referenceRecordCount: null,
        latestReferenceSaleDate: null,
        salesReviewAvailability: 'unavailable',
        salesReviewUnavailableMessage: expect.stringMatching(/Adams County|not enabled/i),
      }),
    });
  });

  it('preserves caller cancellation instead of converting it into repository data', async () => {
    const controller = new AbortController();
    const resolutionPromise = resolveWashingtonCountyStatus(controller.signal);

    controller.abort();

    await expect(resolutionPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(statusRequestSignals).toHaveLength(1);
    expect(statusRequestSignals[0]?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('turns a stalled selected-county shard verification into a retryable unavailable state', async () => {
    const fallbackPromise = resolveWashingtonCountyStatus();
    await vi.advanceTimersByTimeAsync(WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);
    const fallback = await fallbackPromise;
    const county = fallback.counties[0];
    expect(county).toBeDefined();

    const verificationSignals: AbortSignal[] = [];
    capabilityMocks.verifyHostedShard.mockImplementation(
      (_input: unknown, signal?: AbortSignal) => {
        if (signal) verificationSignals.push(signal);
        return new Promise(() => {});
      }
    );
    const verificationPromise = verifyWashingtonCountySalesShard(county!);

    await vi.advanceTimersByTimeAsync(WASHINGTON_PUBLIC_DATA_REQUEST_TIMEOUT_MS);
    const verifiedCounty = await verificationPromise;

    expect(verificationSignals).toHaveLength(1);
    expect(verificationSignals[0]?.aborted).toBe(true);
    expect(verifiedCounty).toEqual({
      ...county,
      salesShardVerification: 'unavailable',
    });
  });
});
