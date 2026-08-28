/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaleDetail, SaleQueuePage } from '../salesForgeTypes';

const launchApiMocks = vi.hoisted(() => ({
  fetchQueue: vi.fn(),
  fetchDetail: vi.fn(),
  patchDecision: vi.fn(),
  bulkDecision: vi.fn(),
}));

vi.mock('../washingtonLaunchApi', () => ({
  bulkPatchWashingtonLaunchDecision: launchApiMocks.bulkDecision,
  fetchWashingtonLaunchCodeAudit: vi.fn(),
  fetchWashingtonLaunchNeighborhoodStats: vi.fn(),
  fetchWashingtonLaunchQueue: launchApiMocks.fetchQueue,
  fetchWashingtonLaunchRunningStats: vi.fn(),
  fetchWashingtonLaunchSaleDetail: launchApiMocks.fetchDetail,
  isWashingtonLaunchDataEnabled: () => true,
  patchWashingtonLaunchDecision: launchApiMocks.patchDecision,
}));

import { useSalesForgeStore } from '../salesForgeStore';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('SalesForge request isolation', () => {
  beforeEach(() => {
    launchApiMocks.fetchQueue.mockReset();
    launchApiMocks.fetchDetail.mockReset();
    launchApiMocks.patchDecision.mockReset();
    launchApiMocks.bulkDecision.mockReset();
    useSalesForgeStore.getState().applyCountyStudioScope('063', null);
  });

  it('lets only the latest same-county queue request own data and loading state', async () => {
    const first = deferred<SaleQueuePage>();
    const second = deferred<SaleQueuePage>();
    launchApiMocks.fetchQueue
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const firstRequest = useSalesForgeStore.getState().fetchQueue();
    useSalesForgeStore.getState().setFilterForm({ hood: 'SPK-NEW' });
    useSalesForgeStore.getState().applyFilters();
    const secondRequest = useSalesForgeStore.getState().fetchQueue();

    second.resolve({ total: 2, page: 1, pageSize: 25, items: [] });
    await secondRequest;
    expect(useSalesForgeStore.getState().queueData?.total).toBe(2);
    expect(useSalesForgeStore.getState().queueLoading).toBe(false);

    first.resolve({ total: 1, page: 1, pageSize: 25, items: [] });
    await firstRequest;
    expect(useSalesForgeStore.getState().queueData?.total).toBe(2);
    expect(useSalesForgeStore.getState().queueLoading).toBe(false);
    expect(useSalesForgeStore.getState().queueError).toBeNull();
  });

  it('ignores a late same-county detail error after a newer detail succeeds', async () => {
    const first = deferred<SaleDetail>();
    const second = deferred<SaleDetail>();
    launchApiMocks.fetchDetail
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const firstRequest = useSalesForgeStore.getState().fetchSaleDetail('old-spokane-sale');
    const secondRequest = useSalesForgeStore.getState().fetchSaleDetail('new-spokane-sale');

    second.resolve({ saleId: 'new-spokane-sale' } as SaleDetail);
    await secondRequest;
    first.reject(new Error('late old request failure'));
    await firstRequest;

    expect(useSalesForgeStore.getState().saleDetail?.saleId).toBe('new-spokane-sale');
    expect(useSalesForgeStore.getState().detailLoading).toBe(false);
    expect(useSalesForgeStore.getState().detailError).toBeNull();
  });

  it('binds a single public decision to Spokane and ignores completion after a county switch', async () => {
    const decision = deferred<void>();
    launchApiMocks.patchDecision.mockImplementationOnce(() => decision.promise);

    const request = useSalesForgeStore.getState().patchDecision(
      'spokane-sale',
      'qualified',
      'reference review',
      'Test reviewer',
    );
    expect(launchApiMocks.patchDecision).toHaveBeenCalledWith(
      '063',
      'spokane-sale',
      'qualified',
      'reference review',
      'Test reviewer',
      'StaffConfirmed',
    );

    useSalesForgeStore.getState().applyCountyStudioScope('001', null);
    decision.resolve();
    await request;

    expect(useSalesForgeStore.getState().patchState).toEqual({});
    expect(launchApiMocks.fetchQueue).not.toHaveBeenCalled();
  });

  it('binds a bulk public decision to Spokane and ignores completion after a county switch', async () => {
    const decision = deferred<void>();
    launchApiMocks.bulkDecision.mockImplementationOnce(() => decision.promise);

    const request = useSalesForgeStore.getState().bulkDecision(
      ['spokane-a', 'spokane-b'],
      'not_qualified',
      'reference review',
      'Test reviewer',
    );
    expect(launchApiMocks.bulkDecision).toHaveBeenCalledWith(
      '063',
      ['spokane-a', 'spokane-b'],
      'not_qualified',
      'reference review',
      'Test reviewer',
    );

    useSalesForgeStore.getState().applyCountyStudioScope('001', null);
    decision.resolve();
    await request;

    expect(useSalesForgeStore.getState().patchState).toEqual({});
    expect(launchApiMocks.fetchQueue).not.toHaveBeenCalled();
  });
});
