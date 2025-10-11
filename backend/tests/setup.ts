/**
 * Test Setup File for TerraFusion OS 1.0
 * 
 * This file runs BEFORE EACH test file.
 * Use it to:
 * - Set up Jest matchers
 * - Configure test utilities
 * - Add custom assertions
 * - Set global test timeouts
 * 
 * @author TerraFusion Systems Engineering Team
 */

import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend({
  /**
   * Custom matcher: Check if response time is acceptable
   */
  toHaveAcceptableResponseTime(received: number, maxMs: number = 500) {
    const pass = received <= maxMs;
    if (pass) {
      return {
        message: () => `expected ${received}ms not to be <= ${maxMs}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received}ms to be <= ${maxMs}ms (SLOW!)`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher: Check if quantum advantage exists
   */
  toHaveQuantumAdvantage(received: number, minAdvantage: number = 1.0) {
    const pass = received > minAdvantage;
    if (pass) {
      return {
        message: () => `expected ${received}x not to be > ${minAdvantage}x`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received}x quantum advantage to be > ${minAdvantage}x`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher: Check if error rate is acceptable
   */
  toHaveAcceptableErrorRate(
    received: { total: number; errors: number },
    maxErrorRate: number = 0.01 // 1%
  ) {
    const errorRate = received.errors / received.total;
    const pass = errorRate <= maxErrorRate;
    if (pass) {
      return {
        message: () =>
          `expected ${(errorRate * 100).toFixed(2)}% error rate not to be <= ${(maxErrorRate * 100).toFixed(2)}%`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${(errorRate * 100).toFixed(2)}% error rate to be <= ${(maxErrorRate * 100).toFixed(2)}% (TOO MANY ERRORS!)`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAcceptableResponseTime(maxMs?: number): R;
      toHaveQuantumAdvantage(minAdvantage?: number): R;
      toHaveAcceptableErrorRate(maxErrorRate?: number): R;
    }
  }
}

// Set default test timeout
jest.setTimeout(60000); // 60 seconds

// Mock console methods to reduce noise (except errors)
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  debug: jest.fn(), // Mock console.debug
  info: jest.fn(), // Mock console.info
  warn: jest.fn(), // Mock console.warn
  // Keep console.error for debugging failures
};

// Configure test database cleanup
afterEach(async () => {
  // Clean up test data after each test
  // This ensures test isolation
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  throw reason;
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

console.info('✅ Test setup complete - ready to run tests!');
