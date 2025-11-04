/**
 * Resilience Testing Script
 *
 * This script tests the resilience mechanisms:
 * 1. Circuit breaker pattern with failure thresholds
 * 2. Retry with exponential backoff and jitter
 * 3. Combination of circuit breaker and retry
 * 4. Graceful degradation under load
 */

import { CircuitBreaker, CircuitState } from './server/services/resilience/circuit-breaker.js';
import { withRetry, createRetryFunction } from './server/services/resilience/retry.js';

// Simulate an API client
class MockAPIClient {
  constructor() {
    this.failureRate = 0;
    this.latency = 100;
    this.callCount = 0;
  }

  // Set failure rate (0-1)
  setFailureRate(rate) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  // Set latency in ms
  setLatency(latency) {
    this.latency = latency;
  }

  // Make a request that might fail
  async makeRequest() {
    this.callCount++;

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.latency));

    // Randomly fail based on failure rate
    if (Math.random() < this.failureRate) {
      throw new Error('API Request failed');
    }

    return { success: true, data: `Response #${this.callCount}` };
  }

  // Reset state
  reset() {
    this.callCount = 0;
  }
}

/**
 * Test circuit breaker pattern
 */
async function testCircuitBreaker() {
  console.log('\n=== Testing Circuit Breaker ===');

  const apiClient = new MockAPIClient();

  const circuitBreaker = new CircuitBreaker({
    name: 'test-api',
    failureThreshold: 3,
    resetTimeout: 2000,
    halfOpenSuccessThreshold: 1,
    timeout: 500,
  });

  // Test successful requests
  console.log('\nTesting successful requests:');
  apiClient.setFailureRate(0);

  for (let i = 0; i < 5; i++) {
    try {
      const result = await circuitBreaker.execute(() => apiClient.makeRequest());
      console.log(`Request ${i + 1}: Success - ${result.data}`);
    } catch (error) {
      console.log(`Request ${i + 1}: Error - ${error.message}`);
    }
  }

  // Print circuit state and metrics
  console.log(`\nCircuit state: ${circuitBreaker.getState()}`);
  console.log('Circuit metrics:', circuitBreaker.getMetrics());

  // Test failing requests that open the circuit
  console.log('\nTesting failing requests to open circuit:');
  apiClient.setFailureRate(1);

  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute(() => apiClient.makeRequest());
      console.log(`Request ${i + 1}: Success`);
    } catch (error) {
      console.log(`Request ${i + 1}: Error - ${error.message}`);
    }
  }

  // Print circuit state and metrics
  console.log(`\nCircuit state: ${circuitBreaker.getState()}`);
  console.log('Circuit metrics:', circuitBreaker.getMetrics());

  // Test circuit half-open state
  console.log('\nWaiting for circuit to transition to half-open state (2s)...');
  await new Promise(resolve => setTimeout(resolve, 2100));

  console.log(`Circuit state: ${circuitBreaker.getState()}`);

  // Test recovery
  console.log('\nTesting recovery with successful request:');
  apiClient.setFailureRate(0);

  try {
    const result = await circuitBreaker.execute(() => apiClient.makeRequest());
    console.log(`Recovery request: Success - ${result.data}`);
  } catch (error) {
    console.log(`Recovery request: Error - ${error.message}`);
  }

  // Print final circuit state and metrics
  console.log(`\nFinal circuit state: ${circuitBreaker.getState()}`);
  console.log('Final circuit metrics:', circuitBreaker.getMetrics());

  // Cleanup
  circuitBreaker.dispose();
}

/**
 * Test retry mechanism
 */
async function testRetry() {
  console.log('\n=== Testing Retry Mechanism ===');

  const apiClient = new MockAPIClient();

  // Test successful request (no retries needed)
  console.log('\nTesting successful request (no retries needed):');
  apiClient.setFailureRate(0);

  const result1 = await withRetry(() => apiClient.makeRequest(), {
    name: 'successful-operation',
    maxRetries: 3,
    initialDelay: 100,
    backoffFactor: 2,
  });

  console.log('Result:', result1);

  // Test with temporary failures (retries should succeed)
  console.log('\nTesting with temporary failures (should succeed after retries):');
  apiClient.reset();

  // Make next 2 calls fail, then succeed
  let callCount = 0;
  const temporaryFailOperation = async () => {
    callCount++;
    if (callCount <= 2) {
      throw new Error(`Temporary failure #${callCount}`);
    }
    return { success: true, data: 'Finally succeeded!' };
  };

  const result2 = await withRetry(temporaryFailOperation, {
    name: 'temporary-failure-operation',
    maxRetries: 3,
    initialDelay: 100,
    backoffFactor: 2,
  });

  console.log('Result:', result2);

  // Test with permanent failures (retries should fail)
  console.log('\nTesting with permanent failures (should fail after all retries):');
  apiClient.setFailureRate(1);

  const result3 = await withRetry(() => apiClient.makeRequest(), {
    name: 'permanent-failure-operation',
    maxRetries: 2,
    initialDelay: 100,
    backoffFactor: 2,
  });

  console.log('Result:', result3);

  // Test retry function wrapper
  console.log('\nTesting retry function wrapper:');
  apiClient.setFailureRate(0.5);

  const retryableRequest = createRetryFunction(() => apiClient.makeRequest(), {
    name: 'wrapped-api-call',
    maxRetries: 5,
    initialDelay: 50,
    backoffFactor: 1.5,
    jitter: true,
  });

  try {
    const result = await retryableRequest();
    console.log('Wrapped function result:', result);
  } catch (error) {
    console.log('Wrapped function error:', error.message);
  }
}

/**
 * Test combined resilience patterns
 */
async function testCombinedResilience() {
  console.log('\n=== Testing Combined Resilience Patterns ===');

  const apiClient = new MockAPIClient();

  // Create circuit breaker
  const circuitBreaker = new CircuitBreaker({
    name: 'resilient-api',
    failureThreshold: 5,
    resetTimeout: 2000,
    halfOpenSuccessThreshold: 2,
    timeout: 300,
  });

  // Create retryable function that uses circuit breaker
  const resilientRequest = async () => {
    return await circuitBreaker.execute(async () => {
      const result = await withRetry(() => apiClient.makeRequest(), {
        name: 'api-request-with-retry',
        maxRetries: 2,
        initialDelay: 50,
        backoffFactor: 2,
        jitter: true,
      });

      if (!result.success) {
        throw result.error || new Error('Unknown error in retry');
      }

      return result.result;
    });
  };

  // Test with occasional failures
  console.log('\nTesting resilient requests with occasional failures:');
  apiClient.setFailureRate(0.3);

  for (let i = 0; i < 10; i++) {
    try {
      const result = await resilientRequest();
      console.log(`Request ${i + 1}: Success - ${result.data}`);
    } catch (error) {
      console.log(`Request ${i + 1}: Error - ${error.message}`);
    }
  }

  // Test with high failure rate
  console.log('\nTesting resilient requests with high failure rate:');
  apiClient.setFailureRate(0.9);

  for (let i = 0; i < 10; i++) {
    try {
      const result = await resilientRequest();
      console.log(`Request ${i + 1}: Success - ${result.data}`);
    } catch (error) {
      console.log(`Request ${i + 1}: Error - ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Print circuit state and metrics
  console.log(`\nCircuit state: ${circuitBreaker.getState()}`);
  console.log('Circuit metrics:', circuitBreaker.getMetrics());

  // Cleanup
  circuitBreaker.dispose();
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== Resilience Mechanisms Test ===');

  try {
    // Test circuit breaker
    await testCircuitBreaker();

    // Test retry
    await testRetry();

    // Test combined resilience
    await testCombinedResilience();

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
