/**
 * Jest Test Setup for TerraFusion OS Integration Tests
 */

// Increase default timeout for integration tests
jest.setTimeout(60000);

// Global test configuration
global.testConfig = {
  timeout: {
    short: 5000,
    medium: 15000,
    long: 30000,
    integration: 60000
  },
  retries: {
    network: 3,
    service: 5
  }
};

// Setup before all tests
beforeAll(async () => {
  console.log('🚀 Setting up TerraFusion OS integration test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  console.log('✅ Test environment configured');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Additional cleanup if needed
  
  console.log('✅ Test cleanup complete');
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Utility functions for tests
global.testUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (condition, timeout = 10000, interval = 500) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Retry a function with exponential backoff
   */
  retry: async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Generate unique test ID
   */
  generateTestId: () => {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Create test data
   */
  createTestAgent: (overrides = {}) => {
    return {
      agentId: global.testUtils.generateTestId(),
      capabilities: { testing: true },
      type: 'operational',
      ...overrides
    };
  }
};

console.log('✅ Jest test setup complete');