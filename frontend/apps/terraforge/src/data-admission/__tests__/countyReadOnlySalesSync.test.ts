import { describe, expect, it, vi } from 'vitest';
import {
  fetchCountyReadOnlySalesSyncAvailability,
  runCountyReadOnlySalesSync,
} from '../countyReadOnlySalesSync';

const availability = {
  contractId: 'wal.county-connected.readonly-sales-sync.v1' as const,
  countyId: '19190019-1919-1919-1919-191919191919',
  countyKey: 'wa-benton',
  countyName: 'Benton',
  connectionConfigured: true,
  sourceSystem: 'PACS',
  lastSuccessfulSyncAtUtc: '2026-09-03T20:00:00Z',
  availableSales: 2,
  latestSaleDate: '2026-01-15',
  recommendedStudyYear: 2027,
  salesReviewAvailable: true,
  status: 'connected-sales-available' as const,
};

describe('countyReadOnlySalesSync', () => {
  it('accepts a county-bound connected-source availability receipt', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(availability), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(fetchCountyReadOnlySalesSyncAvailability(apiFetch)).resolves.toEqual(availability);
    expect(apiFetch).toHaveBeenCalledWith('/county-sync/sales', { signal: undefined });
  });

  it('rejects availability that claims sales without a protected connection', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...availability, connectionConfigured: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(fetchCountyReadOnlySalesSyncAvailability(apiFetch)).rejects.toThrow(
      /invalid availability/i
    );
  });

  it('keeps previously synced rows unavailable after a later connection failure', async () => {
    const failedAvailability = {
      ...availability,
      salesReviewAvailable: false,
      status: 'last-sync-failed',
    };
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(failedAvailability), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(fetchCountyReadOnlySalesSyncAvailability(apiFetch)).resolves.toEqual(
      failedAvailability
    );
  });

  it('runs the read-only sync and validates its durable receipt', async () => {
    const payload = {
      countyKey: 'wa-benton',
      countyName: 'Benton',
      receipt: {
        contractId: 'wal.county-connected.readonly-sales-sync.v1',
        receiptId: '550e8400-e29b-41d4-a716-446655440000',
        countyId: availability.countyId,
        connectionId: '660e8400-e29b-41d4-a716-446655440000',
        sourceSystem: 'PACS',
        sourceRows: 2,
        addedSales: 2,
        updatedSales: 0,
        externalWrites: 0,
        availableSales: 2,
        latestSaleDate: '2026-01-15',
        recommendedStudyYear: 2027,
        completedAtUtc: '2026-09-03T20:00:00Z',
      },
    };
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(runCountyReadOnlySalesSync(apiFetch)).resolves.toEqual(payload);
    expect(apiFetch).toHaveBeenCalledWith('/county-sync/sales/run', {
      method: 'POST',
      signal: undefined,
    });

    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({
        ...payload,
        receipt: { ...payload.receipt, externalWrites: 1 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    await expect(runCountyReadOnlySalesSync(apiFetch)).rejects.toThrow(/invalid receipt/i);
  });

  it('surfaces the stable fail-closed code', async () => {
    const apiFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 'COUNTY_SYNC_CONNECTIONNOTREADONLY' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(runCountyReadOnlySalesSync(apiFetch)).rejects.toThrow(
      /HTTP 409 \(COUNTY_SYNC_CONNECTIONNOTREADONLY\)/
    );
  });
});
