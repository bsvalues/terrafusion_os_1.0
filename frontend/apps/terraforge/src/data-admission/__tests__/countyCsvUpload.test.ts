import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

import {
  fetchCountyCsvPromotedSalesAvailability,
  fetchCountyCsvUploadHistory,
  promoteCountyCsvSales,
  uploadCountyCsv,
} from '../countyCsvUpload';

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('county CSV upload client', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('reads authenticated county-only admission history through the centralized API client', async () => {
    const payload = {
      contractId: 'upload-v1',
      countyId: 'county-id',
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      availability: 'row-validation-staging-not-promoted',
      batches: [],
    };
    apiFetchMock.mockResolvedValue(response(payload));

    await expect(fetchCountyCsvUploadHistory(apiFetchMock)).resolves.toEqual(payload);
    expect(apiFetchMock).toHaveBeenCalledWith('/upload/history', { signal: undefined });
  });

  it('posts exactly one CSV and dataset without a caller-supplied county selector', async () => {
    const file = new File(['parcel_id,sale_price\n1,350000\n'], 'sales.csv', {
      type: 'text/csv',
    });
    const payload = {
      contractId: 'upload-v1',
      ledgerContractId: 'ledger-v1',
      batchId: 'batch-id',
      countyId: 'county-id',
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      dataset: 'Sales',
      contentSha256: 'a'.repeat(64),
      contentLength: file.size,
      acceptedRowCount: 1,
      duplicateDisposition: 'FirstSeen',
      rowStagingContractId: 'wal.county-upload.durable-row-staging.v1',
      validationSchemaVersion: 'wa-county-csv-v1',
      stagedRowCount: 1,
      quarantinedRowCount: 0,
      quarantineReasonCounts: [],
    };
    apiFetchMock.mockResolvedValue(response(payload));

    await expect(uploadCountyCsv(apiFetchMock, file, 'Sales')).resolves.toEqual(payload);
    const [path, init] = apiFetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/upload');
    expect(init.method).toBe('POST');
    const form = init.body as FormData;
    expect(form.get('file')).toBe(file);
    expect(form.get('dataset')).toBe('Sales');
    expect(form.has('countyId')).toBe(false);
  });

  it('fails closed on a malformed history response', async () => {
    apiFetchMock.mockResolvedValue(response({ countyName: 'Spokane', batches: [] }));
    await expect(fetchCountyCsvUploadHistory(apiFetchMock)).rejects.toThrow(
      /invalid history response/i
    );
  });

  it("rejects a history payload that contains another county's batch", async () => {
    apiFetchMock.mockResolvedValue(
      response({
        contractId: 'upload-v1',
        countyId: 'spokane-id',
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'row-validation-staging-not-promoted',
        batches: [
          {
            batchId: 'batch-id',
            countyId: 'benton-id',
            dataset: 'Sales',
            sourceFileName: 'sales.csv',
            contentSha256: 'a'.repeat(64),
            contentByteLength: 64,
            acceptedRowCount: 1,
            status: 'Admitted',
            receivedAtUtc: '2026-09-03T00:00:00Z',
            rowStaging: null,
          },
        ],
      })
    );

    await expect(fetchCountyCsvUploadHistory(apiFetchMock)).rejects.toThrow(
      /invalid history response/i
    );
  });

  it('rejects staging metadata that is rebound to another county', async () => {
    apiFetchMock.mockResolvedValue(
      response({
        contractId: 'upload-v1',
        countyId: 'spokane-id',
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'row-validation-staging-not-promoted',
        batches: [
          {
            batchId: 'batch-id',
            countyId: 'spokane-id',
            dataset: 'Sales',
            sourceFileName: 'sales.csv',
            contentSha256: 'a'.repeat(64),
            contentByteLength: 64,
            acceptedRowCount: 1,
            status: 'Admitted',
            receivedAtUtc: '2026-09-03T00:00:00Z',
            rowStaging: {
              batchId: 'batch-id',
              countyId: 'benton-id',
              contractId: 'wal.county-upload.durable-row-staging.v1',
              schemaVersion: 'wa-county-csv-v1',
              totalRowCount: 1,
              stagedRowCount: 1,
              quarantinedRowCount: 0,
              reasonCounts: [],
              validatedAtUtc: '2026-09-03T00:00:01Z',
            },
          },
        ],
      })
    );

    await expect(fetchCountyCsvUploadHistory(apiFetchMock)).rejects.toThrow(
      /invalid history response/i
    );
  });

  it('rejects staging metadata whose total does not match the admitted row count', async () => {
    apiFetchMock.mockResolvedValue(
      response({
        contractId: 'upload-v1',
        countyId: 'spokane-id',
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'row-validation-staging-not-promoted',
        batches: [
          {
            batchId: 'batch-id',
            countyId: 'spokane-id',
            dataset: 'Sales',
            sourceFileName: 'sales.csv',
            contentSha256: 'a'.repeat(64),
            contentByteLength: 64,
            acceptedRowCount: 1,
            status: 'Admitted',
            receivedAtUtc: '2026-09-03T00:00:00Z',
            rowStaging: {
              batchId: 'batch-id',
              countyId: 'spokane-id',
              contractId: 'wal.county-upload.durable-row-staging.v1',
              schemaVersion: 'wa-county-csv-v1',
              totalRowCount: 2,
              stagedRowCount: 2,
              quarantinedRowCount: 0,
              reasonCounts: [],
              validatedAtUtc: '2026-09-03T00:00:01Z',
            },
          },
        ],
      })
    );

    await expect(fetchCountyCsvUploadHistory(apiFetchMock)).rejects.toThrow(
      /invalid history response/i
    );
  });

  it('preserves protected HTTP denial instead of inventing a receipt', async () => {
    apiFetchMock.mockResolvedValue(response({ code: 'CSV_ADMISSION_DENIED' }, false, 400));
    await expect(
      uploadCountyCsv(apiFetchMock, new File(['bad'], 'bad.csv', { type: 'text/csv' }), 'Parcels')
    ).rejects.toThrow(/HTTP 400.*CSV_ADMISSION_DENIED/i);
  });

  it('promotes one batch without accepting county identity from the caller', async () => {
    const payload = {
      contractId: 'wal.county-upload.terraforge-sales-promotion.v1',
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      disposition: 'Promoted',
      promotion: {
        batchId: 'batch-id',
        countyId: 'county-id',
        contractId: 'wal.county-upload.terraforge-sales-promotion.v1',
        promotedRowCount: 2,
        latestSaleDate: '2026-01-15',
        promotedAtUtc: '2026-09-03T10:00:00Z',
      },
    };
    apiFetchMock.mockResolvedValue(response(payload));
    await expect(promoteCountyCsvSales(apiFetchMock, 'batch-id')).resolves.toEqual(payload);
    expect(apiFetchMock).toHaveBeenCalledWith('/upload/batch-id/promote', {
      method: 'POST',
      signal: undefined,
    });
  });

  it('reads only authenticated county promoted-sales availability', async () => {
    const payload = {
      contractId: 'wal.county-upload.terraforge-sales-promotion.v1',
      countyId: 'county-id',
      countyKey: 'wa-spokane',
      countyName: 'Spokane',
      promotedSales: 2,
      latestSaleDate: '2026-01-15',
      salesReviewAvailable: true,
    };
    apiFetchMock.mockResolvedValue(response(payload));
    await expect(fetchCountyCsvPromotedSalesAvailability(apiFetchMock)).resolves.toEqual(payload);
    expect(apiFetchMock).toHaveBeenCalledWith('/upload/promoted-sales', { signal: undefined });
  });
});
