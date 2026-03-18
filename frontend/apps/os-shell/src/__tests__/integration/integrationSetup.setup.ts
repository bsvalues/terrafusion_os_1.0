/**
 * Integration Test Setup
 *
 * This file runs before all integration tests to configure the test environment.
 * It extends the base setupTests.ts with integration-specific configurations.
 */

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Extend default test timeout for integration tests - vitest uses test-level timeout or config

// Mock timers for integration tests with animations
// Uncomment if needed for specific workflows
// vi.useFakeTimers();

// Global setup for integration tests
beforeAll(() => {
  // Add any global setup needed for integration tests
  console.log('🧪 Starting Integration Test Suite...');
});

afterAll(() => {
  // Cleanup after all integration tests
  console.log('✅ Integration Test Suite Complete!');
});

// Reset state between integration tests to avoid side effects
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  // Useful for clearing any lingering state from complex workflows
});

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for components using visibility detection
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for components that observe size changes
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console warnings in integration tests (optional)
// Uncomment if you want cleaner test output
// const originalWarn = console.warn;
// beforeAll(() => {
//   console.warn = vi.fn();
// });
// afterAll(() => {
//   console.warn = originalWarn;
// });

export { };

describe('integrationSetup.setup', () => {
  it('loads integration test setup', () => {
    expect(true).toBe(true);
  });
});
