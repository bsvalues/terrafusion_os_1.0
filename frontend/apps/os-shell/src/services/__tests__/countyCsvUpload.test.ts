import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('@/lib/apiBase', () => ({ apiFetch: apiFetchMock }));

import { fetchCountyCsvUploadHistory, uploadCountyCsv } from '../canon/countyCsvUpload';

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
      availability: 'admitted-not-staged',
      batches: [],
    };
    apiFetchMock.mockResolvedValue(response(payload));

    await expect(fetchCountyCsvUploadHistory()).resolves.toEqual(payload);
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
    };
    apiFetchMock.mockResolvedValue(response(payload));

    await expect(uploadCountyCsv(file, 'Sales')).resolves.toEqual(payload);
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
    await expect(fetchCountyCsvUploadHistory()).rejects.toThrow(/invalid history response/i);
  });

  it("rejects a history payload that contains another county's batch", async () => {
    apiFetchMock.mockResolvedValue(
      response({
        contractId: 'upload-v1',
        countyId: 'spokane-id',
        countyKey: 'wa-spokane',
        countyName: 'Spokane',
        availability: 'admitted-not-staged',
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
          },
        ],
      })
    );

    await expect(fetchCountyCsvUploadHistory()).rejects.toThrow(/invalid history response/i);
  });

  it('preserves protected HTTP denial instead of inventing a receipt', async () => {
    apiFetchMock.mockResolvedValue(response({ code: 'CSV_ADMISSION_DENIED' }, false, 400));
    await expect(
      uploadCountyCsv(new File(['bad'], 'bad.csv', { type: 'text/csv' }), 'Parcels')
    ).rejects.toThrow(/HTTP 400.*CSV_ADMISSION_DENIED/i);
  });
});
