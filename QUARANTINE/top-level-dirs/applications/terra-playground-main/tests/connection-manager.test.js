/**
 * ConnectionManager Tests
 *
 * Tests for the ConnectionManager including:
 * 1. Backoff algorithm verification (1s→2s→4s→8s)
 * 2. WebSocket to SSE fallback transitions
 * 3. UI state indicator transitions (Connected/Reconnecting/Offline)
 * 4. "Early success" cancellation during backoff
 */

const ConnectionManager = require('../public/websocket-connection.js');

// Mock the console
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('ConnectionManager', () => {
  let connectionManager;
  let mockStatusElement;
  let mockLogElement;
  let mockReconnectButton;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock DOM elements
    mockStatusElement = {
      className: '',
      textContent: '',
    };

    mockLogElement = {
      appendChild: jest.fn(),
    };

    mockReconnectButton = {
      addEventListener: jest.fn(),
      disabled: true,
    };

    // Mock document.getElementById
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'connection-status') return mockStatusElement;
      if (id === 'message-log') return mockLogElement;
      if (id === 'reconnect-button') return mockReconnectButton;
      return null;
    });

    // Create a new ConnectionManager instance for each test
    connectionManager = new ConnectionManager({
      debug: true,
      wsUrl: 'wss://example.com/ws',
      sseUrl: 'https://example.com/sse',
      reconnect: true,
    });

    // Instead of using mock timers, let's override the setTimeout and clearTimeout
    // This will avoid the unref() issue
    global.setTimeout = jest.fn((callback, delay) => {
      return {
        callback,
        delay,
        unref: jest.fn(), // Add the unref method
      };
    });

    global.clearTimeout = jest.fn();

    // Manual timer advancement function - replaces jest.advanceTimersByTime
    global.runTimer = delay => {
      // Find all timers with this delay
      const timers = global.setTimeout.mock.results
        .map(res => res.value)
        .filter(timer => timer.delay === delay);

      // Execute their callbacks
      timers.forEach(timer => {
        if (timer.callback) {
          timer.callback();
        }
      });
    };

    // Mock WebSocket
    global.WebSocket = jest.fn().mockImplementation(() => {
      return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        send: jest.fn(),
        readyState: WebSocket.CONNECTING,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
      };
    });

    // Mock EventSource
    global.EventSource = jest.fn().mockImplementation(() => {
      return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        readyState: EventSource.CONNECTING,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      };
    });
  });

  // Test 1: Backoff algorithm verification
  test('should implement exponential backoff for reconnection attempts', () => {
    // Initial connection attempt
    connectionManager.connectWebSocket();

    // Simulate first connection failure
    const wsInstance = global.WebSocket.mock.results[0].value;
    const errorHandler = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    errorHandler(new Error('Connection failed'));

    // Check first backoff (should be 1000ms)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    global.runTimer(1000);

    // Simulate second connection failure
    const wsInstance2 = global.WebSocket.mock.results[1].value;
    const errorHandler2 = wsInstance2.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    errorHandler2(new Error('Connection failed'));

    // Check second backoff (should be 2000ms)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000);
    global.runTimer(2000);

    // Simulate third connection failure
    const wsInstance3 = global.WebSocket.mock.results[2].value;
    const errorHandler3 = wsInstance3.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    errorHandler3(new Error('Connection failed'));

    // Check third backoff (should be 4000ms)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 4000);
    global.runTimer(4000);

    // Simulate fourth connection failure
    const wsInstance4 = global.WebSocket.mock.results[3].value;
    const errorHandler4 = wsInstance4.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    errorHandler4(new Error('Connection failed'));

    // Check fourth backoff (should be 8000ms)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 8000);
  });

  // Test 2: WebSocket to SSE fallback transitions
  test('should fall back to SSE when WebSocket connection fails repeatedly', () => {
    // Initial connection attempt
    connectionManager.connectWebSocket();

    // Simulate connection failures until max retries reached
    for (let i = 0; i < connectionManager.config.maxRetries; i++) {
      const wsInstance = global.WebSocket.mock.results[i].value;
      const errorHandler = wsInstance.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorHandler(new Error('Connection failed'));

      // Advance time to trigger next retry
      const backoffTime = 1000 * Math.pow(2, i);
      global.runTimer(backoffTime);
    }

    // Check that SSE connection was attempted
    expect(global.EventSource).toHaveBeenCalled();

    // Verify the ConnectionManager state was updated
    expect(connectionManager.getState().mode).toBe('sse');
  });

  // Test 3: UI state indicator transitions
  test('should update UI indicators correctly during connection state changes', () => {
    // Initial connection attempt
    connectionManager.connectWebSocket();

    // Verify initial state (connecting)
    expect(mockStatusElement.className).toContain('connecting');

    // Simulate successful connection
    const wsInstance = global.WebSocket.mock.results[0].value;
    const openHandler = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')[1];
    openHandler();

    // Verify connected state
    expect(mockStatusElement.className).toContain('connected');

    // Simulate connection close
    const closeHandler = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'close'
    )[1];
    closeHandler();

    // Verify reconnecting state
    expect(mockStatusElement.className).toContain('reconnecting');

    // Advance timer to trigger max retries
    for (let i = 0; i < connectionManager.config.maxRetries; i++) {
      const backoffTime = 1000 * Math.pow(2, i);
      global.runTimer(backoffTime);
    }

    // Simulate SSE connection failure
    const sseInstance = global.EventSource.mock.results[0].value;
    const sseErrorHandler = sseInstance.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    sseErrorHandler(new Error('SSE connection failed'));

    // Verify offline state
    expect(mockStatusElement.className).toContain('offline');
  });

  // Test 4: "Early success" cancellation during backoff
  test('should cancel scheduled reconnection when connection succeeds earlier', () => {
    // Initial connection attempt fails
    connectionManager.connectWebSocket();
    const wsInstance = global.WebSocket.mock.results[0].value;
    const errorHandler = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    errorHandler(new Error('Connection failed'));

    // Reconnection is scheduled
    expect(setTimeout).toHaveBeenCalled();

    // Manually trigger reconnection before scheduled time
    connectionManager.connectWebSocket();

    // Second WebSocket instance connects successfully
    const wsInstance2 = global.WebSocket.mock.results[1].value;
    const openHandler = wsInstance2.addEventListener.mock.calls.find(call => call[0] === 'open')[1];
    openHandler();

    // Verify connection is successful
    expect(connectionManager.getState().connected).toBe(true);
    expect(connectionManager.getState().mode).toBe('websocket');

    // Advance timer to when the scheduled reconnection would happen
    global.runTimer(1000);

    // Verify we're still in the same connected state (reconnection was cancelled)
    expect(connectionManager.getState().connected).toBe(true);
    expect(connectionManager.getState().mode).toBe('websocket');

    // Only 2 WebSocket instances should have been created (not 3)
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });
});
