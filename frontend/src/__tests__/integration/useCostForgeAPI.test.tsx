import { jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the useCostForgeAPI hook
const mockUseCostForgeAPI = jest.fn();
jest.mock('@/hooks/useCostForgeAPI', () => ({
  useCostForgeAPI: () => mockUseCostForgeAPI(),
}));

// Mock fetch with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock WebSocket for real-time connections
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // WebSocket.OPEN
};

(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('useCostForgeAPI - Government-Grade Integration Testing', () => {
  let queryClient: QueryClient;

  const mockCalculationResponse = {
    totalCost: 937500,
    confidenceScore: 0.956,
    factors: [
      { name: 'Regional Factor', value: 1.35, impact: 262500 },
      { name: 'Property Type Factor', value: 1.0, impact: 0 },
      { name: 'Improvements Factor', value: 1.15, impact: 112500 },
    ],
    calculationId: 'calc_20251020_001',
    timestamp: '2025-01-20T10:30:00Z',
  };

  const defaultMockAPI = {
    calculateCost: jest.fn(),
    calculateBatchCosts: jest.fn(),
    isConnected: true,
    connectionStatus: 'connected',
    performanceMetrics: {
      responseTime: 85,
      successRate: 99.8,
      slaCompliant: true,
      averageResponseTime: 95,
      totalRequests: 0,
      alertLevel: 'normal',
      lastUpdated: new Date(),
    },
    healthStatus: {
      status: 'healthy',
      uptime: '99.9%',
      memoryUsage: 45.2,
      autoRecoveryTriggered: false,
    },
    liveCalculationStatus: {},
    systemAlerts: [],
    authorizationStatus: 'authorized',
    cacheStatus: {
      invalidatedPatterns: [],
    },
    reconnect: jest.fn(),
    logAuditEvent: jest.fn(),
  };

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockUseCostForgeAPI.mockReturnValue(defaultMockAPI);

    // Mock successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy' }),
    } as Response);
  });

  describe('🏛️ Backend Connectivity & Authentication', () => {
    test('establishes secure connection to TerraFusion.API backend', async () => {
      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.connectionStatus).toBe('connected');
      });

      // Verify JWT validation was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/validate'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/Bearer .+/),
          }),
        })
      );
    });

    test('handles JWT token refresh automatically', async () => {
      // Mock token expiration
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' }),
        })
      );

      // Mock successful refresh
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              accessToken: 'new_jwt_token_12345',
              expiresIn: 3600,
            }),
        })
      );

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Verify token refresh was attempted
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.any(Object)
      );
    });

    test('implements circuit breaker pattern for resilience', async () => {
      // Simulate repeated failures
      mockFetch.mockImplementation(() => Promise.reject(new Error('Connection failed')));

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('circuit-open');
        expect(result.current.healthStatus.status).toBe('degraded');
      });
    });
  });

  describe('💰 Cost Calculation API Integration', () => {
    const mockCalculationRequest = {
      propertyValue: 750000,
      county: 'king-county',
      propertyType: 'single-family',
      improvements: ['deck', 'garage'],
    };

    const mockCalculationResponse = {
      totalCost: 937500,
      confidenceScore: 0.956,
      factors: [
        { name: 'Regional Factor', value: 1.35, impact: 262500 },
        { name: 'Property Type Factor', value: 1.0, impact: 0 },
        { name: 'Improvements Factor', value: 1.15, impact: 112500 },
      ],
      calculationId: 'calc_20251020_001',
      timestamp: '2025-01-20T10:30:00Z',
    };

    test('executes cost calculations with <150ms SLA compliance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCalculationResponse),
        headers: new Headers({
          'X-Response-Time': '125ms',
          'X-Calculation-ID': 'calc_20251020_001',
        }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      let calculationResult: any;
      await act(async () => {
        calculationResult = await result.current.calculateCost(mockCalculationRequest);
      });

      expect(calculationResult).toEqual(mockCalculationResponse);
      expect(result.current.performanceMetrics.responseTime).toBeLessThan(150);
      expect(result.current.performanceMetrics.slaCompliant).toBe(true);

      // Verify API call format
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/costforge/calculate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-County-Authorization': 'king-county',
            'X-Calculation-Type': 'property-assessment',
          }),
          body: JSON.stringify(mockCalculationRequest),
        })
      );
    });

    test('handles batch calculations for multiple properties', async () => {
      const batchRequest = [
        { propertyId: 'prop_001', ...mockCalculationRequest },
        { propertyId: 'prop_002', propertyValue: 650000, county: 'pierce-county' },
        { propertyId: 'prop_003', propertyValue: 520000, county: 'snohomish-county' },
      ];

      const batchResponse = {
        results: batchRequest.map((req, index) => ({
          propertyId: req.propertyId,
          totalCost: req.propertyValue * 1.25,
          confidenceScore: 0.95,
          calculationId: `calc_batch_${index + 1}`,
        })),
        batchId: 'batch_20251020_001',
        processedCount: 3,
        failedCount: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(batchResponse),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      let batchResult: any;
      await act(async () => {
        batchResult = await result.current.calculateBatchCosts(batchRequest);
      });

      expect(batchResult.processedCount).toBe(3);
      expect(batchResult.failedCount).toBe(0);
      expect(batchResult.results).toHaveLength(3);
    });

    test('validates county sovereignty and data isolation', async () => {
      const pierceCountyRequest = {
        ...mockCalculationRequest,
        county: 'pierce-county',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockCalculationResponse,
            countySovereigntyValidated: true,
            accessLevel: 'county-authorized',
          }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.calculateCost(pierceCountyRequest);
      });

      // Verify county isolation headers
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-County-Authorization': 'pierce-county',
            'X-Data-Isolation': 'county-level',
            'X-Sovereignty-Check': 'true',
          }),
        })
      );
    });
  });

  describe('🔄 Real-time Performance Monitoring', () => {
    test('tracks response times and SLA compliance continuously', async () => {
      const responseTimes = [95, 120, 85, 140, 105];

      responseTimes.forEach((responseTime, index) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ calculationId: `test_${index}` }),
          headers: new Headers({
            'X-Response-Time': `${responseTime}ms`,
          }),
        });
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      // Execute multiple calculations
      for (let i = 0; i < responseTimes.length; i++) {
        await act(async () => {
          await result.current.calculateCost({
            propertyValue: 500000,
            county: 'king-county',
          });
        });
      }

      await waitFor(() => {
        const metrics = result.current.performanceMetrics;
        expect(metrics.averageResponseTime).toBeCloseTo(109, 0); // Average of response times
        expect(metrics.slaCompliant).toBe(true); // All under 150ms
        expect(metrics.totalRequests).toBe(responseTimes.length);
      });
    });

    test('triggers performance alerts when SLA is breached', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({
          'X-Response-Time': '185ms', // Above 150ms SLA
        }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.calculateCost({
          propertyValue: 500000,
          county: 'king-county',
        });
      });

      await waitFor(() => {
        expect(result.current.performanceMetrics.slaCompliant).toBe(false);
        expect(result.current.performanceMetrics.alertLevel).toBe('warning');
      });
    });

    test('implements adaptive retry with exponential backoff', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary service unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.calculateCost({
          propertyValue: 500000,
          county: 'king-county',
        });
      });

      // Should have retried and eventually succeeded
      expect(callCount).toBe(3);
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  describe('🏥 Health Monitoring & Auto-Recovery', () => {
    test('performs continuous health checks', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/health')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'healthy',
                uptime: '99.95%',
                memoryUsage: 42.3,
                activeConnections: 1247,
                lastHealthCheck: new Date().toISOString(),
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const health = result.current.healthStatus;
        expect(health.status).toBe('healthy');
        expect(health.uptime).toBe('99.95%');
        expect(health.memoryUsage).toBe(42.3);
      });

      // Verify health check interval
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    test('detects service degradation and initiates auto-recovery', async () => {
      let healthCallCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/health')) {
          healthCallCount++;
          if (healthCallCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  status: 'degraded',
                  uptime: '98.2%',
                  memoryUsage: 89.7,
                  errors: ['High memory usage', 'Slow response times'],
                }),
            });
          }
          // Recovery after auto-healing
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'healthy',
                uptime: '99.1%',
                memoryUsage: 45.2,
                autoRecoveryTriggered: true,
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      // First health check shows degradation
      await waitFor(() => {
        expect(result.current.healthStatus.status).toBe('degraded');
      });

      // Auto-recovery should be initiated
      await waitFor(
        () => {
          expect(result.current.healthStatus.autoRecoveryTriggered).toBe(true);
          expect(result.current.healthStatus.status).toBe('healthy');
        },
        { timeout: 5000 }
      );
    });
  });

  describe('📡 WebSocket Real-time Updates', () => {
    test('establishes WebSocket connection for live updates', async () => {
      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Verify WebSocket connection
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:5000/costforge/realtime')
      );
    });

    test('handles real-time calculation status updates', async () => {
      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate WebSocket message
      const statusUpdate = {
        type: 'calculation_status',
        calculationId: 'calc_20251020_001',
        status: 'processing',
        progress: 75,
        estimatedCompletion: 5000, // 5 seconds
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          ([event]) => event === 'message'
        )?.[1];

        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(statusUpdate),
          });
        }
      });

      await waitFor(() => {
        const liveStatus = result.current.liveCalculationStatus;
        expect(liveStatus['calc_20251020_001']).toEqual({
          status: 'processing',
          progress: 75,
          estimatedCompletion: 5000,
        });
      });
    });

    test('receives system-wide performance alerts via WebSocket', async () => {
      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      const performanceAlert = {
        type: 'performance_alert',
        level: 'warning',
        message: 'Response times approaching SLA limits',
        affectedServices: ['CostCalculation', 'PropertyValidation'],
        timestamp: new Date().toISOString(),
      };

      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          ([event]) => event === 'message'
        )?.[1];

        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(performanceAlert),
          });
        }
      });

      await waitFor(() => {
        const alerts = result.current.systemAlerts;
        expect(alerts).toContainEqual(
          expect.objectContaining({
            level: 'warning',
            message: 'Response times approaching SLA limits',
          })
        );
      });
    });
  });

  describe('🔒 Security & Compliance Integration', () => {
    test('implements FISMA-compliant audit logging', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCalculationResponse),
        headers: new Headers({
          'X-Audit-ID': 'audit_20251020_001',
          'X-Compliance-Level': 'FISMA-HIGH',
        }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.calculateCost({
          propertyValue: 500000,
          county: 'king-county',
        });
      });

      // Verify audit headers were included
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Audit-Required': 'true',
            'X-User-Context': expect.any(String),
            'X-Session-ID': expect.any(String),
          }),
        })
      );
    });

    test('enforces county-level data isolation', async () => {
      const bentonCountyRequest = {
        propertyValue: 400000,
        county: 'benton-county',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockCalculationResponse,
            dataIsolationVerified: true,
            accessibleCounties: ['benton-county'],
          }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.calculateCost(bentonCountyRequest);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-County-Isolation': 'benton-county',
            'X-Cross-County-Access': 'denied',
          }),
        })
      );
    });

    test('validates user authorization for county access', async () => {
      // Mock unauthorized access attempt
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            error: 'County access denied',
            requiredRole: 'county-assessor',
            userRole: 'public-user',
          }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      let error: any;
      await act(async () => {
        try {
          await result.current.calculateCost({
            propertyValue: 500000,
            county: 'restricted-county',
          });
        } catch (e) {
          error = e;
        }
      });

      expect(error.message).toContain('County access denied');
      expect(result.current.authorizationStatus).toBe('insufficient-privileges');
    });
  });

  describe('📈 Caching & Performance Optimization', () => {
    test('implements intelligent caching for repeated calculations', async () => {
      const cacheableRequest = {
        propertyValue: 500000,
        county: 'king-county',
        propertyType: 'single-family',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockCalculationResponse,
            cached: false,
            cacheKey: 'calc_cache_12345',
          }),
      });

      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      // First calculation - should hit API
      await act(async () => {
        await result.current.calculateCost(cacheableRequest);
      });

      // Second identical calculation - should use cache
      await act(async () => {
        const cachedResult = await result.current.calculateCost(cacheableRequest);
        expect(cachedResult.cached).toBe(true);
      });

      // Verify only one API call was made (first one)
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial connection + calculation
    });

    test('invalidates cache on data updates', async () => {
      const { result } = renderHook(() => useCostForgeAPI(), {
        wrapper: createWrapper(),
      });

      // Simulate cache invalidation via WebSocket
      act(() => {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          ([event]) => event === 'message'
        )?.[1];

        if (messageHandler) {
          messageHandler({
            data: JSON.stringify({
              type: 'cache_invalidation',
              pattern: 'king-county*',
              reason: 'data_update',
            }),
          });
        }
      });

      await waitFor(() => {
        expect(result.current.cacheStatus.invalidatedPatterns).toContain('king-county*');
      });
    });
  });
});
