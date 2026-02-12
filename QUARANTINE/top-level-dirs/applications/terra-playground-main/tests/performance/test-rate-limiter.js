/**
 * Rate Limiter Testing Script
 *
 * This script tests the rate limiting functionality:
 * 1. Token bucket algorithm for smooth rate limiting
 * 2. Fixed window rate limiting for request capping
 * 3. Waiting behavior with delayed execution
 * 4. Metrics collection and reporting
 */

import {
  RateLimiterType,
  createRateLimiter,
  RateLimiterRegistry,
} from './server/services/resilience/rate-limiter.js';

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test token bucket rate limiter
 */
async function testTokenBucketRateLimiter() {
  console.log('\n=== Testing Token Bucket Rate Limiter ===');

  // Create a token bucket rate limiter with 10 tokens and refill rate of 1 token per second
  const limiter = createRateLimiter({
    name: 'test-token-bucket',
    type: RateLimiterType.TOKEN_BUCKET,
    capacity: 10, // 10 tokens max
    refillRate: 1, // 1 token per second
    delayExecution: false,
  });

  // Test initial capacity
  console.log('Initial metrics:', limiter.getMetrics());

  // Test consuming tokens within capacity
  console.log('\nConsuming 5 tokens (should succeed):');
  const result1 = await limiter.tryConsume(5);
  console.log('Result:', result1);
  console.log('Metrics after consuming 5 tokens:', limiter.getMetrics());

  // Test consuming more tokens within remaining capacity
  console.log('\nConsuming 3 more tokens (should succeed):');
  const result2 = await limiter.tryConsume(3);
  console.log('Result:', result2);
  console.log('Metrics after consuming 3 more tokens:', limiter.getMetrics());

  // Test consuming more tokens than available (without waiting)
  console.log('\nConsuming 5 more tokens (should fail - only 2 available):');
  const result3 = await limiter.tryConsume(5);
  console.log('Result:', result3);
  console.log('Metrics after attempted consumption:', limiter.getMetrics());

  // Test consuming remaining tokens
  console.log('\nConsuming 2 tokens (should succeed - exactly 2 available):');
  const result4 = await limiter.tryConsume(2);
  console.log('Result:', result4);
  console.log('Metrics after consuming all tokens:', limiter.getMetrics());

  // Test token refill
  console.log('\nWaiting 3 seconds for token refill...');
  await sleep(3000);
  console.log('Metrics after waiting:', limiter.getMetrics());

  // Test consuming tokens after refill
  console.log('\nConsuming 3 tokens after refill (should succeed):');
  const result5 = await limiter.tryConsume(3);
  console.log('Result:', result5);
  console.log('Final metrics:', limiter.getMetrics());
}

/**
 * Test fixed window rate limiter
 */
async function testFixedWindowRateLimiter() {
  console.log('\n=== Testing Fixed Window Rate Limiter ===');

  // Create a fixed window rate limiter with 5 requests per 2-second window
  const limiter = createRateLimiter({
    name: 'test-fixed-window',
    type: RateLimiterType.FIXED_WINDOW,
    capacity: 5, // 5 requests max
    refillRate: 5, // Not used for fixed window
    windowSizeMs: 2000, // 2 second window
    delayExecution: false,
  });

  // Test initial capacity
  console.log('Initial metrics:', limiter.getMetrics());

  // Test consuming slots within capacity
  console.log('\nConsuming 3 slots (should succeed):');
  const result1 = await limiter.tryConsume(3);
  console.log('Result:', result1);
  console.log('Metrics after consuming 3 slots:', limiter.getMetrics());

  // Test consuming more slots within remaining capacity
  console.log('\nConsuming 2 more slots (should succeed):');
  const result2 = await limiter.tryConsume(2);
  console.log('Result:', result2);
  console.log('Metrics after consuming 2 more slots:', limiter.getMetrics());

  // Test consuming more slots than available (without waiting)
  console.log('\nConsuming 1 more slot (should fail - window full):');
  const result3 = await limiter.tryConsume(1);
  console.log('Result:', result3);
  console.log('Metrics after attempted consumption:', limiter.getMetrics());

  // Test window reset
  console.log('\nWaiting 2 seconds for window reset...');
  await sleep(2000);
  console.log('Metrics after waiting:', limiter.getMetrics());

  // Test consuming slots after window reset
  console.log('\nConsuming 4 slots after window reset (should succeed):');
  const result4 = await limiter.tryConsume(4);
  console.log('Result:', result4);
  console.log('Final metrics:', limiter.getMetrics());
}

/**
 * Test rate limiter with waiting
 */
async function testRateLimiterWithWaiting() {
  console.log('\n=== Testing Rate Limiter With Waiting ===');

  // Create a token bucket rate limiter with waiting enabled
  const limiter = createRateLimiter({
    name: 'test-with-waiting',
    type: RateLimiterType.TOKEN_BUCKET,
    capacity: 5, // 5 tokens max
    refillRate: 1, // 1 token per second
    delayExecution: true, // Wait for tokens to become available
    maxWaitMs: 5000, // Maximum wait time: 5 seconds
  });

  // Test initial capacity
  console.log('Initial metrics:', limiter.getMetrics());

  // Test consuming tokens within capacity
  console.log('\nConsuming 3 tokens (should succeed immediately):');
  const result1 = await limiter.tryConsume(3);
  console.log('Result:', result1);
  console.log('Metrics after consuming 3 tokens:', limiter.getMetrics());

  // Test consuming more tokens than available (with waiting)
  console.log('\nConsuming 4 tokens (should wait for 2 seconds):');
  const startTime = Date.now();
  const result2 = await limiter.tryConsume(4, true);
  const endTime = Date.now();
  const actualDelay = endTime - startTime;

  console.log('Result:', result2);
  console.log(`Actual delay: ${actualDelay}ms`);
  console.log('Metrics after waiting consumption:', limiter.getMetrics());

  // Test exceeding max wait time
  console.log('\nConsuming 10 tokens with max wait 5s (should fail - would need to wait 10s):');
  const result3 = await limiter.tryConsume(10, true);
  console.log('Result:', result3);
  console.log('Final metrics:', limiter.getMetrics());
}

/**
 * Test rate limiter registry
 */
async function testRateLimiterRegistry() {
  console.log('\n=== Testing Rate Limiter Registry ===');

  // Create a rate limiter registry
  const registry = new RateLimiterRegistry();

  // Register multiple rate limiters
  console.log('Registering multiple rate limiters:');

  registry.register({
    name: 'api-limiter',
    type: RateLimiterType.TOKEN_BUCKET,
    capacity: 100,
    refillRate: 10,
  });

  registry.register({
    name: 'db-limiter',
    type: RateLimiterType.FIXED_WINDOW,
    capacity: 50,
    refillRate: 5,
    windowSizeMs: 5000,
  });

  // Get all metrics
  console.log('\nInitial metrics for all registered limiters:');
  console.log(registry.getAllMetrics());

  // Get a specific limiter and use it
  console.log('\nUsing api-limiter:');
  const apiLimiter = registry.get('api-limiter');

  if (apiLimiter) {
    const result1 = await apiLimiter.tryConsume(20);
    console.log('Result of consuming 20 tokens:', result1);

    const result2 = await apiLimiter.tryConsume(30);
    console.log('Result of consuming 30 more tokens:', result2);
  }

  // Get updated metrics
  console.log('\nUpdated metrics for all registered limiters:');
  console.log(registry.getAllMetrics());

  // Reset all limiters
  console.log('\nResetting all limiters:');
  registry.resetAll();

  // Get metrics after reset
  console.log('\nMetrics after reset:');
  console.log(registry.getAllMetrics());
}

/**
 * Test rate limiters with concurrent requests
 */
async function testConcurrentRequests() {
  console.log('\n=== Testing Rate Limiter With Concurrent Requests ===');

  // Create a token bucket rate limiter
  const limiter = createRateLimiter({
    name: 'concurrent-test',
    type: RateLimiterType.TOKEN_BUCKET,
    capacity: 10,
    refillRate: 2,
    delayExecution: false,
  });

  // Simulate multiple concurrent requests
  console.log('Sending 15 concurrent requests with 10 token capacity:');

  const requests = Array(15)
    .fill(0)
    .map((_, i) => {
      return limiter.tryConsume(1).then(result => {
        return { index: i, result };
      });
    });

  // Wait for all requests to complete
  const results = await Promise.all(requests);

  // Count successes and failures
  const successes = results.filter(r => r.result.allowed).length;
  const failures = results.filter(r => !r.result.allowed).length;

  console.log(`Results: ${successes} succeeded, ${failures} failed`);
  console.log('Final metrics:', limiter.getMetrics());

  // Show individual results for first few and last few
  console.log('\nFirst 3 results:');
  console.log(results.slice(0, 3));

  console.log('\nLast 3 results:');
  console.log(results.slice(-3));
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== Rate Limiter Test ===');

  try {
    // Test token bucket rate limiter
    await testTokenBucketRateLimiter();

    // Test fixed window rate limiter
    await testFixedWindowRateLimiter();

    // Test rate limiter with waiting
    await testRateLimiterWithWaiting();

    // Test rate limiter registry
    await testRateLimiterRegistry();

    // Test concurrent requests
    await testConcurrentRequests();

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
