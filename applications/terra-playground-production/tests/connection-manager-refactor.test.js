/**
 * Connection Manager Tests
 *
 * Tests WebSocket connection logic with auto-reconnect and SSE fallback
 */

// Import ConnectionManager (mocked for this test)
// In a real setup, we would use proper imports
import ConnectionManager from '../public/websocket-connection.js';

describe('ConnectionManager', () => {
  let originalWebSocket;
  let originalEventSource;
  let originalSetInterval;
  let originalClearInterval;
  let originalSetTimeout;
  let originalClearTimeout;
  let mockWebSocketInstances = [];
  let mockEventSourceInstances = [];
  let intervals = [];
  let timeouts = [];
  let mockDom;
  let connectionManager;

  // Mock WebSocket class
  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0; // CONNECTING
      this.CONNECTING = 0;
      this.OPEN = 1;
      this.CLOSING = 2;
      this.CLOSED = 3;

      // Callbacks
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;

      // Spy properties
      this.sentMessages = [];

      // Auto-connect by default (can be overridden in tests)
      setTimeout(() => this.mockConnect(), 0);
    }

    mockConnect() {
      this.readyState = this.OPEN;
      if (this.onopen) this.onopen({ target: this });
    }

    mockDisconnect(wasClean = true, code = 1000, reason = 'Normal closure') {
      this.readyState = this.CLOSED;
      if (this.onclose)
        this.onclose({
          target: this,
          wasClean,
          code,
          reason,
        });
    }

    mockError(message = 'WebSocket error') {
      if (this.onerror)
        this.onerror({
          target: this,
          message,
        });
    }

    mockReceiveMessage(data) {
      if (this.onmessage)
        this.onmessage({
          target: this,
          data: typeof data === 'object' ? JSON.stringify(data) : data,
        });
    }

    send(data) {
      this.sentMessages.push(data);
    }

    close() {
      this.readyState = this.CLOSING;
      setTimeout(() => {
        this.readyState = this.CLOSED;
        if (this.onclose)
          this.onclose({
            target: this,
            wasClean: true,
            code: 1000,
            reason: 'Normal closure',
          });
      }, 0);
    }
  }

  // Mock EventSource class
  class MockEventSource {
    constructor(url) {
      this.url = url;

      // Callbacks
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;

      // Spy properties
      this.closed = false;

      // Auto-connect by default (can be overridden in tests)
      setTimeout(() => this.mockConnect(), 0);
    }

    mockConnect() {
      if (this.onopen) this.onopen({ target: this });
    }

    mockReceiveMessage(data) {
      if (this.onmessage)
        this.onmessage({
          target: this,
          data: typeof data === 'object' ? JSON.stringify(data) : data,
        });
    }

    mockError(message = 'EventSource error') {
      if (this.onerror)
        this.onerror({
          target: this,
          message,
        });
    }

    close() {
      this.closed = true;
    }
  }

  // Create mock DOM elements for testing
  const createMockDom = () => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <div id="status-indicator" class="status-indicator disconnected">
        <span class="status-icon">🔴</span>
        <span id="connection-status">Disconnected</span>
      </div>
      <div id="connection-details"></div>
      <div id="message-log"></div>
      <input id="message-input" disabled />
      <button id="send-button" disabled>Send</button>
      <button id="connect-button">Connect</button>
      <button id="disconnect-button" disabled>Disconnect</button>
      <button id="connect-sse-button">Use SSE</button>
      <div id="connection-metrics">
        <div class="metric">Messages sent: <span id="sent-count">0</span></div>
        <div class="metric">Messages received: <span id="received-count">0</span></div>
        <div class="metric">Connection attempts: <span id="connection-attempts">0</span></div>
        <div class="metric">Reconnections: <span id="reconnection-count">0</span></div>
      </div>
    `;

    // Return references to DOM elements
    return {
      statusIndicator: document.getElementById('status-indicator'),
      connectionStatus: document.getElementById('connection-status'),
      connectionDetails: document.getElementById('connection-details'),
      messageLog: document.getElementById('message-log'),
      messageInput: document.getElementById('message-input'),
      sendButton: document.getElementById('send-button'),
      connectButton: document.getElementById('connect-button'),
      disconnectButton: document.getElementById('disconnect-button'),
      connectSSEButton: document.getElementById('connect-sse-button'),
      sentCount: document.getElementById('sent-count'),
      receivedCount: document.getElementById('received-count'),
      connectionAttempts: document.getElementById('connection-attempts'),
      reconnectionCount: document.getElementById('reconnection-count'),
    };
  };

  // Helper function to advance timers
  const advanceTimers = ms => {
    // Process timeouts that should trigger
    timeouts.forEach((timeout, id) => {
      if (!timeout.cleared && timeout.delay <= ms) {
        timeout.callback();
        timeout.cleared = true;
      }
    });

    // Process intervals that should trigger (possibly multiple times)
    intervals.forEach((interval, id) => {
      if (!interval.cleared) {
        const iterations = Math.floor(ms / interval.delay);
        for (let i = 0; i < iterations; i++) {
          interval.callback();
        }
      }
    });
  };

  beforeAll(() => {
    // Store original globals
    originalWebSocket = global.WebSocket;
    originalEventSource = global.EventSource;
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;

    // Mock setInterval/setTimeout for controlling time
    global.setInterval = jest.fn((callback, delay) => {
      const id = intervals.length;
      intervals.push({ callback, delay, id });
      return id;
    });

    global.clearInterval = jest.fn(id => {
      if (intervals[id]) {
        intervals[id].cleared = true;
      }
    });

    global.setTimeout = jest.fn((callback, delay) => {
      const id = timeouts.length;
      timeouts.push({ callback, delay, id });
      return id;
    });

    global.clearTimeout = jest.fn(id => {
      if (timeouts[id]) {
        timeouts[id].cleared = true;
      }
    });

    // Mock WebSocket
    global.WebSocket = jest.fn(url => {
      const instance = new MockWebSocket(url);
      mockWebSocketInstances.push(instance);
      return instance;
    });

    // Add WebSocket constants to global WebSocket
    global.WebSocket.CONNECTING = 0;
    global.WebSocket.OPEN = 1;
    global.WebSocket.CLOSING = 2;
    global.WebSocket.CLOSED = 3;

    // Mock EventSource
    global.EventSource = jest.fn(url => {
      const instance = new MockEventSource(url);
      mockEventSourceInstances.push(instance);
      return instance;
    });
  });

  afterAll(() => {
    // Restore original globals
    global.WebSocket = originalWebSocket;
    global.EventSource = originalEventSource;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  beforeEach(() => {
    // Reset mocks and counters
    jest.clearAllMocks();
    mockWebSocketInstances = [];
    mockEventSourceInstances = [];
    intervals = [];
    timeouts = [];

    // Setup DOM
    mockDom = createMockDom();

    // Initialize ConnectionManager
    connectionManager = new ConnectionManager({
      wsPath: '/ws',
      ssePath: '/api/events',
      initialReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectBackoffFactor: 2,
      autoConnect: false, // Disable auto-connect for tests
      debug: true,
    });
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';

    // Clean up connection manager
    if (connectionManager) {
      connectionManager.disconnect();
      connectionManager = null;
    }
  });

  // Tests
  test('should initially show disconnected state', () => {
    expect(mockDom.statusIndicator.classList.contains('disconnected')).toBe(true);
    expect(mockDom.statusIndicator.querySelector('.status-icon').textContent).toBe('🔴');
    expect(mockDom.connectionStatus.textContent).toBe('Disconnected');
  });

  test('should connect to WebSocket successfully', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];

    // Simulate successful connection
    ws.mockConnect();

    // Assert status is updated
    expect(mockDom.statusIndicator.classList.contains('connected')).toBe(true);
    expect(mockDom.statusIndicator.classList.contains('disconnected')).toBe(false);
    expect(mockDom.statusIndicator.querySelector('.status-icon').textContent).toBe('🟢');
    expect(mockDom.connectionStatus.textContent).toBe('Connected (WebSocket)');

    // Assert input and buttons are updated
    expect(mockDom.messageInput.disabled).toBe(false);
    expect(mockDom.sendButton.disabled).toBe(false);
    expect(mockDom.disconnectButton.disabled).toBe(false);
    expect(mockDom.connectButton.disabled).toBe(true);
    expect(mockDom.connectSSEButton.disabled).toBe(true);
  });

  test('should fallback to SSE when WebSocket fails', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];

    // Simulate error and close
    ws.mockError('Connection failed');
    ws.mockDisconnect(false, 1006, 'Abnormal closure');

    // Assert SSE connection is attempted
    expect(mockEventSourceInstances.length).toBe(1);

    // Get latest EventSource instance
    const es = mockEventSourceInstances[mockEventSourceInstances.length - 1];

    // Simulate successful SSE connection
    es.mockConnect();

    // Assert status is updated
    expect(mockDom.statusIndicator.classList.contains('connected')).toBe(true);
    expect(mockDom.statusIndicator.classList.contains('disconnected')).toBe(false);
    expect(mockDom.statusIndicator.querySelector('.status-icon').textContent).toBe('🟢');
    expect(mockDom.connectionStatus.textContent).toBe('Connected (SSE)');
  });

  test('should show reconnecting state during WebSocket reconnection attempts', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];

    // Simulate error and close
    ws.mockError('Connection failed');
    ws.mockDisconnect(false, 1006, 'Abnormal closure');

    // Assert SSE connection is attempted and successful
    const es = mockEventSourceInstances[mockEventSourceInstances.length - 1];
    es.mockConnect();

    // Assert we're in SSE fallback mode
    expect(connectionManager.getState().connectionMode).toBe('SSE');

    // Get reconnect interval state
    expect(connectionManager.getState().reconnecting).toBe(true);

    // Assert we're showing the reconnecting state
    expect(mockDom.statusIndicator.classList.contains('reconnecting')).toBe(false); // Not reconnecting in UI when SSE is connected
    expect(mockDom.statusIndicator.classList.contains('connected')).toBe(true); // We're connected to SSE

    // Disconnect SSE to show true reconnecting state
    connectionManager.disconnect();

    // Start reconnection again
    connectionManager.scheduleWebSocketReconnect();

    // Assert we're in reconnecting state now
    expect(mockDom.statusIndicator.classList.contains('reconnecting')).toBe(true);
    expect(mockDom.statusIndicator.querySelector('.status-icon').textContent).toBe('🟡');
    expect(mockDom.connectionStatus.textContent).toBe('Reconnecting...');
  });

  test('should use exponential backoff for reconnection attempts', () => {
    // Set the initial reconnect attempt value
    connectionManager.reconnectAttempt = 0;

    // Calculate delays for each attempt
    const delay1 = connectionManager.calculateReconnectDelay();
    const delay2 = connectionManager.calculateReconnectDelay();
    const delay3 = connectionManager.calculateReconnectDelay();
    const delay4 = connectionManager.calculateReconnectDelay();

    // Assert exponential increase
    expect(delay1).toBe(1000);
    expect(delay2).toBe(2000);
    expect(delay3).toBe(4000);
    expect(delay4).toBe(8000);
  });

  test('should cancel reconnection attempts when WebSocket reconnects', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];

    // Simulate error and close
    ws.mockError('Connection failed');
    ws.mockDisconnect(false, 1006, 'Abnormal closure');

    // Get SSE connection
    const es = mockEventSourceInstances[mockEventSourceInstances.length - 1];
    es.mockConnect();

    // Ensure reconnect is scheduled
    expect(connectionManager.getState().reconnecting).toBe(true);

    // Advance time to trigger the first reconnect attempt
    advanceTimers(1000);

    // Get the new WebSocket instance
    const ws2 = mockWebSocketInstances[mockWebSocketInstances.length - 1];

    // Simulate successful connection
    ws2.mockConnect();

    // Assert reconnect interval is cleared
    expect(connectionManager.getState().reconnecting).toBe(false);
    expect(connectionManager.reconnectAttempt).toBe(0);

    // Assert SSE connection is closed
    expect(es.closed).toBe(true);
  });

  test('should disconnect cleanly when user clicks disconnect button', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
    ws.mockConnect();

    // Simulate user clicking disconnect button
    mockDom.disconnectButton.click();

    // Assert status is updated
    expect(mockDom.statusIndicator.classList.contains('disconnected')).toBe(true);
    expect(mockDom.statusIndicator.querySelector('.status-icon').textContent).toBe('🔴');
    expect(mockDom.connectionStatus.textContent).toBe('Disconnected');
  });

  test('should be able to send messages when connected', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
    ws.mockConnect();

    // Send a message
    const testMessage = 'Hello world!';
    connectionManager.sendMessage(testMessage);

    // Assert message was sent
    expect(ws.sentMessages.length).toBe(1);

    // Parse the sent message
    const sentData = JSON.parse(ws.sentMessages[0]);
    expect(sentData.message).toBe(testMessage);
    expect(sentData.action).toBe('echo');
  });

  test('should handle incoming messages correctly', () => {
    // Trigger connection
    connectionManager.connectWebSocket();

    // Get latest WebSocket instance
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
    ws.mockConnect();

    // Mock receiving a message
    const testMessage = { type: 'message', content: 'Server response' };
    ws.mockReceiveMessage(testMessage);

    // Assert message was logged (check the message log)
    expect(mockDom.messageLog.children.length).toBeGreaterThan(0);
  });
});
