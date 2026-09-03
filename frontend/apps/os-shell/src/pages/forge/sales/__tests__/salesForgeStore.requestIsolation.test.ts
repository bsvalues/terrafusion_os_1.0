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
  isEnabled: vi.fn(),
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/apiBase', () => ({
  apiFetch: launchApiMocks.apiFetch,
}));

vi.mock('../washingtonLaunchApi', () => ({
  bulkPatchWashingtonLaunchDecision: launchApiMocks.bulkDecision,
  fetchWashingtonLaunchCodeAudit: vi.fn(),
  fetchWashingtonLaunchNeighborhoodStats: vi.fn(),
  fetchWashingtonLaunchQueue: launchApiMocks.fetchQueue,
  fetchWashingtonLaunchRunningStats: vi.fn(),
  fetchWashingtonLaunchSaleDetail: launchApiMocks.fetchDetail,
  isWashingtonLaunchDataEnabled: launchApiMocks.isEnabled,
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
    launchApiMocks.isEnabled.mockReset().mockReturnValue(true);
    launchApiMocks.apiFetch.mockReset();
    useSalesForgeStore.getState().setDataSource('washington-reference');
    useSalesForgeStore.getState().applyCountyStudioScope('063', null);
  });

  it('keeps hosted and repository-reference launch providers explicit', async () => {
    launchApiMocks.isEnabled.mockReturnValue(false);
    launchApiMocks.fetchQueue.mockResolvedValue({
      total: 0,
      page: 1,
      pageSize: 50,
      items: [],
    });

    useSalesForgeStore.getState().setDataSource('washington-hosted');
    await useSalesForgeStore.getState().fetchQueue();
    expect(launchApiMocks.fetchQueue.mock.calls[0]?.[5]).toBe('hosted');

    useSalesForgeStore.getState().setDataSource('washington-reference');
    await useSalesForgeStore.getState().fetchQueue();
    expect(launchApiMocks.fetchQueue.mock.calls[1]?.[5]).toBe('repository-reference');
  });

  it('keeps validated county uploads on the live API and sends the selected study year', async () => {
    useSalesForgeStore.getState().setDataSource('county-upload');
    useSalesForgeStore.getState().setTaxYear(2025);
    launchApiMocks.apiFetch
      .mockResolvedValueOnce(Response.json({ total: 1, page: 1, pageSize: 50, items: [] }))
      .mockResolvedValueOnce(Response.json({ saleId: 'uploaded-sale' }));

    await useSalesForgeStore.getState().fetchQueue();
    await useSalesForgeStore.getState().fetchSaleDetail('uploaded-sale');

    expect(launchApiMocks.fetchQueue).not.toHaveBeenCalled();
    expect(launchApiMocks.fetchDetail).not.toHaveBeenCalled();
    expect(launchApiMocks.apiFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/terraforge/sale-qualification?'),
      expect.anything(),
    );
    const detailUrl = String(launchApiMocks.apiFetch.mock.calls[1]?.[0]);
    expect(detailUrl).toContain('/terraforge/sale-qualification/uploaded-sale?');
    expect(detailUrl).toContain('taxYear=2025');
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

  it('keeps a late live response from overwriting a Counties Hub reference transition', async () => {
    launchApiMocks.isEnabled.mockReturnValue(false);
    useSalesForgeStore.getState().setDataSource('live-api');
    useSalesForgeStore.getState().applyCountyStudioScope('005', null);

    const liveResponse = deferred<Response>();
    launchApiMocks.apiFetch.mockImplementationOnce(() => liveResponse.promise);
    const liveRequest = useSalesForgeStore.getState().fetchQueue();

    useSalesForgeStore.getState().setDataSource('washington-reference');
    useSalesForgeStore.getState().applyCountyStudioScope('063', null);
    launchApiMocks.fetchQueue.mockResolvedValueOnce({
      total: 3,
      page: 1,
      pageSize: 50,
      items: [],
    });
    await useSalesForgeStore.getState().fetchQueue();

    liveResponse.resolve(Response.json({
      total: 99,
      page: 1,
      pageSize: 50,
      items: [],
    }));
    await liveRequest;

    expect(useSalesForgeStore.getState().dataSource).toBe('washington-reference');
    expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('063');
    expect(useSalesForgeStore.getState().queueData?.total).toBe(3);
    expect(useSalesForgeStore.getState().queueLoading).toBe(false);
  });

  it('keeps a late reference response from overwriting a live-provider transition', async () => {
    launchApiMocks.isEnabled.mockReturnValue(false);
    const referenceResponse = deferred<SaleQueuePage>();
    launchApiMocks.fetchQueue.mockImplementationOnce(() => referenceResponse.promise);
    const referenceRequest = useSalesForgeStore.getState().fetchQueue();

    useSalesForgeStore.getState().setDataSource('live-api');
    useSalesForgeStore.getState().applyCountyStudioScope('005', null);
    launchApiMocks.apiFetch.mockResolvedValueOnce(Response.json({
      total: 7,
      page: 1,
      pageSize: 50,
      items: [],
    }));
    await useSalesForgeStore.getState().fetchQueue();

    referenceResponse.resolve({ total: 88, page: 1, pageSize: 50, items: [] });
    await referenceRequest;

    expect(useSalesForgeStore.getState().dataSource).toBe('live-api');
    expect(useSalesForgeStore.getState().committedFilters.countyCode).toBe('005');
    expect(useSalesForgeStore.getState().queueData?.total).toBe(7);
    expect(useSalesForgeStore.getState().queueLoading).toBe(false);
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
