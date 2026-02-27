import { useCostForgeAPI } from '@/hooks/useCostForgeAPI';
import { act, renderHook, waitFor } from '@testing-library/react';

const mockFetch = vi.fn() as vi.MockedFunction<typeof fetch>;

describe('useCostForgeAPI - Integration (fetch + headers)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;

    localStorage.clear();
    sessionStorage.clear();
  });

  test('adds Authorization header when JWT is present', async () => {
    localStorage.setItem('terrafusion-jwt', 'jwt_123');

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    } as Response);

    const { result } = renderHook(() => useCostForgeAPI({ baseUrl: 'http://localhost:5000' }));

    await act(async () => {
      await result.current.apiCall('/api/health', { method: 'GET' });
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer jwt_123',
        'Content-Type': 'application/json',
        'X-Correlation-ID': expect.stringMatching(/^tf-\d+-[a-z0-9]+$/i),
      })
    );
  });

  test('calculatePropertyCost POSTs to /api/costforge/calculate', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ calculationId: 'calc_1' }),
    } as Response);

    const { result } = renderHook(() => useCostForgeAPI({ baseUrl: 'http://localhost:5000' }));

    const request = {
      region: 'king-county',
      buildingType: 'single-family',
      additionalParameters: { sqft: 2000 },
    };

    await act(async () => {
      await result.current.calculatePropertyCost(request);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/costforge/calculate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      })
    );
  });

  test('surfaces HTTP failures as success=false and sets error state', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Service unavailable' }),
    } as Response);

    const { result } = renderHook(() => useCostForgeAPI({ baseUrl: 'http://localhost:5000' }));

    let response: any;
    await act(async () => {
      response = await result.current.apiCall('/api/costforge/status');
    });

    expect(response.success).toBe(false);
    expect(response.message).toMatch(/service unavailable/i);

    await waitFor(() => {
      expect(result.current.error).toMatch(/service unavailable/i);
      expect(result.current.loading).toBe(false);
    });
  });

  test('healthCheck returns true on success and false on failure', async () => {
    const { result } = renderHook(() => useCostForgeAPI({ baseUrl: 'http://localhost:5000' }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    } as Response);

    await act(async () => {
      expect(await result.current.healthCheck()).toBe(true);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({ message: 'Down' }),
    } as Response);

    await act(async () => {
      expect(await result.current.healthCheck()).toBe(false);
    });
  });
});
