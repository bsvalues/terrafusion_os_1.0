import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiFetchError, LiveDataProvider } from '../LiveDataProvider';

describe('LiveDataProvider auth failure handling', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('preserves 401 parcel lookup failures instead of falling back or returning null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn(),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(new LiveDataProvider().getParcel('GATE-TEST-001')).rejects.toMatchObject({
      status: 401,
      path: '/api/properties/parcel/GATE-TEST-001',
    });

    await expect(new LiveDataProvider().getParcel('GATE-TEST-001')).rejects.toBeInstanceOf(ApiFetchError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/properties/parcel/GATE-TEST-001',
      expect.objectContaining({ headers: {} }),
    );
  });

  it('still falls back to the legacy property endpoint for non-auth primary misses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          propId: 42,
          geoId: 'GATE-TEST-001',
          address: '100 Gate Test Ave, Kennewick, WA, 99336',
          ownerName: 'Gate Tester',
          assessedValue: 250000,
          marketValue: 260000,
          landValue: 80000,
          improvementValue: 170000,
          propertyType: 'Residential',
          legalDescription: 'LOT 1 BLK 1',
          appraisalYear: 2026,
          lastModified: '2026-01-01T00:00:00Z',
          source: 'live',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const parcel = await new LiveDataProvider().getParcel('GATE-TEST-001');

    expect(parcel).toMatchObject({
      parcelId: 'GATE-TEST-001',
      address: '100 Gate Test Ave',
      ownerName: 'Gate Tester',
      totalAssessedValue: 250000,
      dataSource: 'live',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/ops/pacs/property/GATE-TEST-001', expect.any(Object));
  });

  it('falls back to the legacy property endpoint when primary parcel evidence stalls', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_path: string, init?: RequestInit) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          propId: 42,
          geoId: 'GATE-TEST-001',
          address: '100 Gate Test Ave, Kennewick, WA, 99336',
          ownerName: 'Gate Tester',
          assessedValue: 250000,
          marketValue: 260000,
          landValue: 80000,
          improvementValue: 170000,
          propertyType: 'Residential',
          legalDescription: 'LOT 1 BLK 1',
          appraisalYear: 2026,
          lastModified: '2026-01-01T00:00:00Z',
          source: 'live',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const parcelPromise = new LiveDataProvider().getParcel('GATE-TEST-001');
    await vi.advanceTimersByTimeAsync(14_000);

    await expect(parcelPromise).resolves.toMatchObject({
      parcelId: 'GATE-TEST-001',
      address: '100 Gate Test Ave',
      dataSource: 'live',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/ops/pacs/property/GATE-TEST-001', expect.any(Object));
  });

  it('waits for slow but valid primary parcel evidence before falling back', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_path: string, init?: RequestInit) => new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
              id: 'property-001',
              parcelNumber: 'GATE-TEST-001',
              address: '100 Gate Test Ave, Kennewick, WA, 99336',
              ownerName: 'Gate Tester',
              assessedValue: 250000,
              marketValue: 260000,
              landValue: 80000,
              improvementValue: 170000,
              propertyType: 'Residential',
              taxYear: 2026,
              countyId: 'benton',
              countyName: 'Benton',
            }),
          });
        }, 12_000);
        init?.signal?.addEventListener('abort', () => {
          window.clearTimeout(timeoutId);
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }));
    vi.stubGlobal('fetch', fetchMock);

    const parcelPromise = new LiveDataProvider().getParcel('GATE-TEST-001');
    await vi.advanceTimersByTimeAsync(12_500);

    await expect(parcelPromise).resolves.toMatchObject({
      parcelId: 'GATE-TEST-001',
      address: '100 Gate Test Ave',
      ownerName: 'Gate Tester',
      dataSource: 'live',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not map PACS offline fallback payloads into fake active parcels', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          pacs: 'offline',
          geoId: 'GATE-TEST-001',
          reason: 'PACS SQL Server not configured in this environment',
          source: 'sqlite-only',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(new LiveDataProvider().getParcel('GATE-TEST-001')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
