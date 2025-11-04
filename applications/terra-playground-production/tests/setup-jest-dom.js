/**
 * Setup file for Jest DOM testing environment
 *
 * This file sets up global browser objects that are used by the ConnectionManager
 */

// Mock WebSocket class
global.WebSocket = class WebSocket {
  constructor() {
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
  }

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock EventSource class
global.EventSource = class EventSource {
  constructor() {
    this.onopen = null;
    this.onerror = null;
    this.onmessage = null;
    this.readyState = 0;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;
  }

  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
  });
});

// Mock DOM APIs used by ConnectionManager
global.document = {
  getElementById: jest.fn(),
  createElement: jest.fn().mockImplementation(() => ({
    className: '',
    textContent: '',
    appendChild: jest.fn(),
  })),
  createTextNode: jest.fn().mockImplementation(text => ({ text })),
};

// Mock window location for WebSocket URL construction
global.window = {
  location: {
    protocol: 'https:',
    host: 'example.com',
  },
};

// Set up necessary timing functions
global.setInterval = jest.fn();
global.clearInterval = jest.fn();
global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();
