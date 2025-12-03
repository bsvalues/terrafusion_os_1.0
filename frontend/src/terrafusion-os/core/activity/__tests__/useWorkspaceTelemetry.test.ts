/**
 * useWorkspaceTelemetry tests – validates WebSocket and polling telemetry hooks.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspacePollingTelemetry, useWorkspaceTelemetry } from '../useWorkspaceTelemetry';
import {
  clearRuntimeActivity,
  getWorkspaceActivityProvider,
  resetWorkspaceActivityProvider,
} from '../WorkspaceActivityProvider';

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1; // OPEN

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async connection
    setTimeout(() => this.onopen?.(), 0);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.();
  }

  // Test helper to simulate receiving a message
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Test helper to simulate an error
  simulateError() {
    this.onerror?.(new Event('error'));
  }

  static clear() {
    MockWebSocket.instances = [];
  }
}

// Mock fetch for polling tests
const mockFetch = vi.fn();

describe('useWorkspaceTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearRuntimeActivity();
    MockWebSocket.clear();

    // @ts-expect-error - Mocking WebSocket
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
    MockWebSocket.clear();
  });

  describe('WebSocket connection', () => {
    it('connects to the provided URL', () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8788/ws/telemetry');
    });

    it('calls onConnect when WebSocket opens', async () => {
      const onConnect = vi.fn();

      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
          onConnect,
        })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onConnect).toHaveBeenCalledTimes(1);
    });

    it('calls onDisconnect when WebSocket closes', async () => {
      const onDisconnect = vi.fn();

      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
          onDisconnect,
          autoReconnect: false,
        })
      );

      await act(async () => {
        MockWebSocket.instances[0].close();
      });

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('calls onError when WebSocket errors', async () => {
      const onError = vi.fn();

      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
          onError,
        })
      );

      await act(async () => {
        MockWebSocket.instances[0].simulateError();
      });

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('closes WebSocket on unmount', () => {
      const { unmount } = renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      const ws = MockWebSocket.instances[0];
      expect(ws.readyState).toBe(1); // OPEN

      unmount();

      expect(ws.readyState).toBe(3); // CLOSED
    });
  });

  describe('event ingestion', () => {
    it('ingests telemetry messages into activity provider', async () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'home',
          severity: 'warn',
          message: 'CPU usage at 85%',
          source: 'SystemMonitor',
        });
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const ingested = items.find((i) => i.summary === 'CPU usage at 85%');
      expect(ingested).toBeDefined();
      expect(ingested?.type).toBe('warning');
      expect(ingested?.source).toBe('SystemMonitor');
    });

    it('maps severity correctly', async () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Test all severity mappings
      await act(async () => {
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'severity-test',
          severity: 'info',
          message: 'Info message',
        });
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'severity-test',
          severity: 'warn',
          message: 'Warning message',
        });
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'severity-test',
          severity: 'error',
          message: 'Error message',
        });
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('severity-test', { limit: 10 });

      const infoItem = items.find((i) => i.summary === 'Info message');
      const warnItem = items.find((i) => i.summary === 'Warning message');
      const errorItem = items.find((i) => i.summary === 'Error message');

      expect(infoItem?.type).toBe('info');
      expect(warnItem?.type).toBe('warning');
      expect(errorItem?.type).toBe('incident');
    });

    it('uses default source when not provided', async () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'home',
          severity: 'info',
          message: 'No source specified',
        });
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 10 });

      const item = items.find((i) => i.summary === 'No source specified');
      expect(item?.source).toBe('Telemetry');
    });

    it('ignores malformed messages', async () => {
      const initialProvider = getWorkspaceActivityProvider();
      const initialItems = await initialProvider.getRecentActivity('home', { limit: 100 });
      const initialCount = initialItems.length;

      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
        })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        // Missing required fields
        MockWebSocket.instances[0].simulateMessage({
          workspaceId: 'home',
          // Missing severity and message
        });
      });

      const provider = getWorkspaceActivityProvider();
      const items = await provider.getRecentActivity('home', { limit: 100 });

      // Should not have added anything
      expect(items.length).toBe(initialCount);
    });
  });

  describe('auto-reconnect', () => {
    it('reconnects after disconnect when autoReconnect is true', async () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
          autoReconnect: true,
          reconnectDelay: 1000,
        })
      );

      expect(MockWebSocket.instances).toHaveLength(1);

      await act(async () => {
        MockWebSocket.instances[0].close();
      });

      // Advance past reconnect delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('does not reconnect when autoReconnect is false', async () => {
      renderHook(() =>
        useWorkspaceTelemetry({
          url: 'ws://localhost:8788/ws/telemetry',
          autoReconnect: false,
        })
      );

      expect(MockWebSocket.instances).toHaveLength(1);

      await act(async () => {
        MockWebSocket.instances[0].close();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });
});

describe('useWorkspacePollingTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearRuntimeActivity();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    resetWorkspaceActivityProvider();
    clearRuntimeActivity();
  });

  it('polls the provided URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderHook(() =>
      useWorkspacePollingTelemetry({
        url: '/api/os/workspace-events',
        interval: 5000,
      })
    );

    // Initial poll happens immediately (at tick 0)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/os/workspace-events');
  });

  it('ingests events from polling response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          workspaceId: 'home',
          severity: 'warn',
          message: 'Polled warning event',
          source: 'PollingTest',
        },
      ],
    });

    renderHook(() =>
      useWorkspacePollingTelemetry({
        url: '/api/os/workspace-events',
        interval: 5000,
      })
    );

    // Initial poll happens immediately
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const provider = getWorkspaceActivityProvider();
    const items = await provider.getRecentActivity('home', { limit: 10 });

    const polled = items.find((i) => i.summary === 'Polled warning event');
    expect(polled).toBeDefined();
    expect(polled?.type).toBe('warning');
    expect(polled?.source).toBe('PollingTest');
  });

  it('calls onError when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const onError = vi.fn();

    renderHook(() =>
      useWorkspacePollingTelemetry({
        url: '/api/os/workspace-events',
        interval: 5000,
        onError,
      })
    );

    // Initial poll happens immediately (and fails)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('continues polling after error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderHook(() =>
      useWorkspacePollingTelemetry({
        url: '/api/os/workspace-events',
        interval: 1000,
      })
    );

    // First poll (fails)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Second poll (succeeds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('stops polling on unmount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { unmount } = renderHook(() =>
      useWorkspacePollingTelemetry({
        url: '/api/os/workspace-events',
        interval: 1000,
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // Should not have polled again
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
