// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29 TEST PLAN: C1 - Frontend Hook Tests
// SystemGPT Atlas Real-Time Telemetry & Alert Engine
// "Write the exam before the course"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemGptAtlasLiveEvent } from '../useSystemGptAtlasLive';
import { useSystemGptAtlasLive } from '../useSystemGptAtlasLive';

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Setup
// ═══════════════════════════════════════════════════════════════════════════════

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close(): void {
    this.readyState = 2;
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: object): void {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify(data),
      })
    );
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  static reset(): void {
    MockEventSource.instances = [];
  }

  static getLastInstance(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// C1.1 – Initial state
// ═══════════════════════════════════════════════════════════════════════════════

describe('useSystemGptAtlasLive', () => {
  beforeEach(() => {
    MockEventSource.reset();
    vi.stubGlobal('EventSource', MockEventSource);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('C1.1 - Initial state', () => {
    it('should start with connecting state', () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      expect(result.current.connectionState).toBe('connecting');
    });

    it('should have null liveEvent initially', () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      expect(result.current.liveEvent).toBeNull();
    });

    it('should have null error initially', () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      expect(result.current.error).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C1.2 – SSE connection lifecycle
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('C1.2 - SSE connection lifecycle', () => {
    it('should transition to connected on SSE open', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();
      expect(eventSource).toBeDefined();

      act(() => {
        eventSource!.simulateOpen();
      });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should connect to correct SSE endpoint', () => {
      renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();
      expect(eventSource?.url).toContain('/api/gpt/system/atlas/live');
    });

    it('should close EventSource on unmount', () => {
      const { unmount } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();
      const closeSpy = vi.spyOn(eventSource!, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C1.3 – Event processing
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('C1.3 - Event processing', () => {
    it('should update liveEvent on message', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();

      act(() => {
        eventSource!.simulateOpen();
      });

      const mockEvent: SystemGptAtlasLiveEvent = {
        version: '1.0',
        eventType: 'atlas_county_batch',
        timestamp: new Date().toISOString(),
        counties: [
          {
            countyId: 'benton',
            healthScore: 0.95,
            healthState: 'healthy',
            ragActive: true,
            guardrailTriggered: false,
            activeRequests: 42,
            p95LatencyMs: 150,
            errorRatePercent: 0.1,
            activeAlerts: [],
          },
        ],
      };

      act(() => {
        eventSource!.simulateMessage(mockEvent);
      });

      expect(result.current.liveEvent).not.toBeNull();
      expect(result.current.liveEvent?.counties[0].countyId).toBe('benton');
    });

    it('should preserve previous event on malformed JSON', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();

      // First, send a valid event
      const validEvent: SystemGptAtlasLiveEvent = {
        version: '1.0',
        eventType: 'atlas_county_batch',
        timestamp: new Date().toISOString(),
        counties: [
          {
            countyId: 'benton',
            healthScore: 0.95,
            healthState: 'healthy',
            ragActive: true,
            guardrailTriggered: false,
            activeRequests: 10,
            p95LatencyMs: 100,
            errorRatePercent: 0,
            activeAlerts: [],
          },
        ],
      };

      act(() => {
        eventSource!.simulateOpen();
        eventSource!.simulateMessage(validEvent);
      });

      expect(result.current.liveEvent?.counties[0].countyId).toBe('benton');

      // Now send malformed data directly via onmessage
      act(() => {
        eventSource!.onmessage?.(
          new MessageEvent('message', {
            data: 'not-valid-json{',
          })
        );
      });

      // Previous event should be preserved
      expect(result.current.liveEvent?.counties[0].countyId).toBe('benton');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C1.4 – Error handling and reconnection
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('C1.4 - Error handling and reconnection', () => {
    it('should transition to reconnecting on SSE error', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();

      act(() => {
        eventSource!.simulateOpen();
      });

      expect(result.current.connectionState).toBe('connected');

      act(() => {
        eventSource!.simulateError();
      });

      expect(result.current.connectionState).toBe('reconnecting');
    });

    it('should attempt reconnection after error', async () => {
      renderHook(() => useSystemGptAtlasLive());

      const initialInstanceCount = MockEventSource.instances.length;
      const eventSource = MockEventSource.getLastInstance();

      act(() => {
        eventSource!.simulateError();
      });

      // Advance timers to trigger reconnection
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(MockEventSource.instances.length).toBeGreaterThan(initialInstanceCount);
    });

    it('should transition to offline after max retries', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive({ maxRetries: 2 }));

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        const eventSource = MockEventSource.getLastInstance();
        act(() => {
          eventSource!.simulateError();
        });
        act(() => {
          vi.advanceTimersByTime(5000);
        });
      }

      expect(result.current.connectionState).toBe('offline');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C1.5 – Polling fallback
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('C1.5 - Polling fallback', () => {
    it('should fall back to polling when SSE fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0',
            eventType: 'atlas_county_batch',
            timestamp: new Date().toISOString(),
            counties: [
              {
                countyId: 'benton',
                healthScore: 0.9,
                healthState: 'healthy',
                ragActive: true,
                guardrailTriggered: false,
                activeRequests: 5,
                p95LatencyMs: 80,
                errorRatePercent: 0,
                activeAlerts: [],
              },
            ],
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { result } = renderHook(() =>
        useSystemGptAtlasLive({
          enablePollingFallback: true,
          maxRetries: 0,
        })
      );

      const eventSource = MockEventSource.getLastInstance();

      // Fail SSE
      act(() => {
        eventSource!.simulateError();
      });

      // Should trigger polling
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should call snapshot endpoint when polling', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0',
            eventType: 'atlas_county_batch',
            timestamp: new Date().toISOString(),
            counties: [],
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      renderHook(() =>
        useSystemGptAtlasLive({
          enablePollingFallback: true,
          maxRetries: 0,
        })
      );

      const eventSource = MockEventSource.getLastInstance();

      act(() => {
        eventSource!.simulateError();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/gpt/system/atlas/live/snapshot'),
        expect.any(Object)
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // C1.6 – getCountyById helper
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('C1.6 - getCountyById helper', () => {
    it('should return county by ID', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();

      const mockEvent: SystemGptAtlasLiveEvent = {
        version: '1.0',
        eventType: 'atlas_county_batch',
        timestamp: new Date().toISOString(),
        counties: [
          {
            countyId: 'benton',
            healthScore: 0.95,
            healthState: 'healthy',
            ragActive: true,
            guardrailTriggered: false,
            activeRequests: 10,
            p95LatencyMs: 100,
            errorRatePercent: 0,
            activeAlerts: [],
          },
          {
            countyId: 'yakima',
            healthScore: 0.8,
            healthState: 'warning',
            ragActive: true,
            guardrailTriggered: true,
            activeRequests: 20,
            p95LatencyMs: 350,
            errorRatePercent: 1.5,
            activeAlerts: ['High latency'],
          },
        ],
      };

      act(() => {
        eventSource!.simulateOpen();
        eventSource!.simulateMessage(mockEvent);
      });

      const benton = result.current.getCountyById('benton');
      const yakima = result.current.getCountyById('yakima');

      expect(benton?.healthState).toBe('healthy');
      expect(yakima?.healthState).toBe('warning');
    });

    it('should return undefined for unknown county', async () => {
      const { result } = renderHook(() => useSystemGptAtlasLive());

      const eventSource = MockEventSource.getLastInstance();

      const mockEvent: SystemGptAtlasLiveEvent = {
        version: '1.0',
        eventType: 'atlas_county_batch',
        timestamp: new Date().toISOString(),
        counties: [
          {
            countyId: 'benton',
            healthScore: 0.95,
            healthState: 'healthy',
            ragActive: true,
            guardrailTriggered: false,
            activeRequests: 10,
            p95LatencyMs: 100,
            errorRatePercent: 0,
            activeAlerts: [],
          },
        ],
      };

      act(() => {
        eventSource!.simulateOpen();
        eventSource!.simulateMessage(mockEvent);
      });

      const unknown = result.current.getCountyById('unknown');

      expect(unknown).toBeUndefined();
    });
  });
});
